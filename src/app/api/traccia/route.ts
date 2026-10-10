import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { COOKIE_SORGENTE, classifica, leggiAttribuzione } from "@/lib/attribuzione";

/**
 * Eventi di marketing dal browser: visita (una per sessione), click su WhatsApp, app installata.
 * Nessun dato personale: solo sorgente, campagna e pagina.
 */
const TIPI = ["visita", "whatsapp", "app_installata"] as const;

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (/bot|crawl|spider|preview|headless/i.test(ua)) return new NextResponse(null, { status: 204 });
  let b: { tipo?: string; pagina?: string; sessione?: string; ref?: string; q?: string } = {};
  try { b = JSON.parse(await req.text()); } catch { return new NextResponse(null, { status: 400 }); }
  const tipo = TIPI.find((t) => t === b.tipo);
  if (!tipo) return new NextResponse(null, { status: 400 });
  const pagina = String(b.pagina ?? "").slice(0, 120);
  const a = leggiAttribuzione(req.cookies.get(COOKIE_SORGENTE)?.value)
    ?? classifica(new URLSearchParams(String(b.q ?? "").slice(0, 500)), b.ref, pagina);
  const admin = supabaseAdmin();
  let officina_id: string | null = null;
  let utmOfficina: { s?: string; m?: string; c?: string; t?: string } | null = null;

  if (tipo === "app_installata") {
    const sb = await supabaseServer();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return new NextResponse(null, { status: 204 });
    const { data: off } = await admin.from("officine").select("id, app_installata_il, utm").eq("owner_id", user.id).maybeSingle();
    if (!off || off.app_installata_il) return new NextResponse(null, { status: 204 });
    await admin.from("officine").update({ app_installata_il: new Date().toISOString() }).eq("id", off.id);
    officina_id = off.id;
    utmOfficina = off.utm;
  }
  const fonte = utmOfficina ?? a;
  await admin.from("marketing_eventi").insert({
    tipo, pagina, sessione: String(b.sessione ?? "").slice(0, 40) || null, officina_id,
    sorgente: fonte?.s ?? "diretto", mezzo: fonte?.m ?? "diretto", campagna: fonte?.c ?? null, target: fonte?.t ?? null,
  });
  return new NextResponse(null, { status: 204 });
}
