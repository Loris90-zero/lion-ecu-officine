import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { riepilogoIeri } from "@/lib/marketing";
import { notificaStaff } from "@/lib/notifiche";
import { elaboraSequenze } from "@/lib/prospezione";

export const maxDuration = 300;

/**
 * Ogni mattina (Vercel Cron): riepilogo marketing di ieri sul telefono del titolare,
 * poi le email delle sequenze in scadenza.
 */
export async function GET(req: NextRequest) {
  const segreto = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const daVercel = (req.headers.get("user-agent") ?? "").startsWith("vercel-cron");
  if (segreto ? auth !== `Bearer ${segreto}` : !daVercel) return new NextResponse("no", { status: 401 });
  const admin = supabaseAdmin();
  const r = await riepilogoIeri(admin);
  await notificaStaff(admin, { per_ruolo: "titolare", tipo: "marketing", titolo: r.titolo, testo: r.testo, link: "/admin/marketing?p=ieri" });
  const base = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;
  const seq = await elaboraSequenze(admin, base);
  return NextResponse.json({ ok: true, riepilogo: r.titolo, sequenze: seq });
}
