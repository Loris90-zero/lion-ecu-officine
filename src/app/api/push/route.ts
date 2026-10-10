import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { chiaviVapid } from "@/lib/notifiche";

/** Chiave pubblica per iscriversi alle push (non è segreta). */
export async function GET() {
  const k = chiaviVapid();
  return NextResponse.json({ chiave: k?.pubblica ?? null });
}

/** Iscrive il telefono del tecnico alle notifiche push (solo staff attivo). */
export async function POST(request: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: staff } = await sb.rpc("is_staff");
  if (!user?.email || !staff) return NextResponse.json({ errore: "Solo staff." }, { status: 403 });
  const b = await request.json().catch(() => null) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null;
  if (!b?.endpoint?.startsWith("https://") || !b.keys?.p256dh || !b.keys?.auth) return NextResponse.json({ errore: "Iscrizione non valida." }, { status: 400 });
  const { error } = await supabaseAdmin().from("push_iscrizioni").upsert({ endpoint: b.endpoint.slice(0, 1000), email: user.email.toLowerCase(), p256dh: b.keys.p256dh.slice(0, 200), auth: b.keys.auth.slice(0, 100) });
  if (error) return NextResponse.json({ errore: "Non salvata." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) return NextResponse.json({ errore: "Accedi." }, { status: 401 });
  const b = await request.json().catch(() => null) as { endpoint?: string } | null;
  if (b?.endpoint) await supabaseAdmin().from("push_iscrizioni").delete().eq("endpoint", b.endpoint).eq("email", user.email.toLowerCase());
  return NextResponse.json({ ok: true });
}
