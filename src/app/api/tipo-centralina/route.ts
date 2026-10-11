import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CATEGORIE_CENTRALINA, type Categoria } from "@/lib/prezzo";

export const maxDuration = 30;

/**
 * «Non ho il codice»: dal mezzo e da come descrive il guasto, l'AI indica che tipo di centralina è.
 * Nessuna ricerca online: una sola risposta breve, con limite per visitatore.
 */
export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const descrizione = typeof b.descrizione === "string" ? b.descrizione.trim().slice(0, 500) : "";
  const mezzo = typeof b.mezzo === "string" ? b.mezzo.trim().slice(0, 40) : "";
  if (descrizione.length < 8) return NextResponse.json({ errore: "Scrivi qualche parola in più sul guasto." }, { status: 400 });
  const admin = supabaseAdmin();
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "sconosciuto";
  const ipHash = createHash("sha256").update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`).digest("hex").slice(0, 32);
  const { count } = await admin.from("ricerche").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("creato_il", new Date(Date.now() - 864e5).toISOString());
  if ((count ?? 0) >= Number(process.env.LIMITE_RICERCHE_SITO_VISITATORE || 5) * 2) return NextResponse.json({ errore: "Hai fatto molte richieste oggi. Scrivici su WhatsApp." }, { status: 429 });
  await admin.from("ricerche").insert({ chiave: null, risultato: null, ip_hash: ipHash, origine: "sito_tipo" });
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const elenco = Object.entries(CATEGORIE_CENTRALINA).map(([k, v]) => `${k} (${v})`).join(", ");
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens: 300,
      messages: [{ role: "user", content: `Sei il tecnico di un laboratorio che ripara centraline di mezzi pesanti. Un meccanico non ha il codice della centralina.\nMezzo: ${mezzo || "non indicato"}\nCosa succede: ${descrizione}\n\nQuale centralina è più probabilmente guasta? Scegli una sola tra: ${elenco}.\nRispondi solo con JSON: {"categoria":"","perche":"una frase semplice per il meccanico","sicuro":true|false}` }],
    });
    const t = res.content.map((x) => (x.type === "text" ? x.text : "")).join("");
    const j = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
    const categoria = (j.categoria in CATEGORIE_CENTRALINA ? j.categoria : "altro") as Categoria;
    return NextResponse.json({ categoria, perche: String(j.perche ?? "").slice(0, 240), sicuro: j.sicuro !== false });
  } catch {
    return NextResponse.json({ errore: "Non sono riuscito a capirlo. Scegli tu il tipo, o scrivici su WhatsApp." }, { status: 502 });
  }
}
