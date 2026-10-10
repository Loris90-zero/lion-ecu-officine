import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Prospezione: l'AI cerca online officine e aziende di trasporto di una zona (solo dati pubblici
 * di attività: nome, città, telefono, sito, email aziendale pubblicata), poi le sequenze email
 * le contattano a passi. L'invio parte solo quando c'è il servizio email (Resend) collegato.
 */

export type Passo = { giorno: number; canale: "email" | "chiamata"; oggetto: string; testo: string };
export type Trovato = { nome: string; citta?: string; provincia?: string; indirizzo?: string; telefono?: string; email?: string; sito?: string; fonte_url?: string; note?: string };

const CATEGORIE: Record<string, string> = {
  officine: "officine meccaniche e meccatroniche che lavorano su mezzi pesanti (camion, bus, movimento terra, macchine agricole)",
  flotte: "aziende di autotrasporto, logistica e noleggio con flotte di mezzi pesanti",
  partner: "officine e centri diagnosi per veicoli industriali che potrebbero diventare partner per le riparazioni di centraline",
};

const modello = () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

function estraiJson(t: string): unknown {
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  const a = t.indexOf("["), o = t.indexOf("{");
  const src = fence ? fence[1] : a >= 0 && (o < 0 || a < o) ? t.slice(a, t.lastIndexOf("]") + 1) : t.slice(o, t.lastIndexOf("}") + 1);
  try { return JSON.parse(src); } catch { return null; }
}

const s = (v: unknown, max = 200) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
export const normTel = (t?: string) => {
  if (!t) return undefined;
  let x = t.replace(/[^\d+]/g, "");
  if (x.startsWith("0039")) x = "+39" + x.slice(4);
  if (!x.startsWith("+") && x.length >= 6) x = "+39" + x;
  return x.length >= 9 ? x : undefined;
};

/** Cerca online attività della zona. Restituisce solo righe con almeno un contatto. */
export async function trovaAttivita(zona: string, categoria: string): Promise<Trovato[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const messages: Anthropic.MessageParam[] = [{
    role: "user",
    content: `Trova ${CATEGORIE[categoria] ?? CATEGORIE.officine} nella zona: ${zona.slice(0, 80)} (Italia).
Usa la ricerca web (schede Google, Pagine Gialle, siti delle aziende, elenchi di settore). Massimo 25 attività reali e attive.
Per ognuna riporta SOLO dati pubblicati dall'attività stessa: nome, città, provincia (sigla), indirizzo, telefono dell'attività, email aziendale se pubblicata sul suo sito, sito web, l'URL dove hai trovato i dati, e una nota breve su cosa fanno (mezzi, marchi).
Non inventare: se un dato non c'è, lascialo vuoto. Niente nomi o numeri personali di dipendenti.
Rispondi solo con un array JSON: [{"nome":"","citta":"","provincia":"","indirizzo":"","telefono":"","email":"","sito":"","fonte_url":"","note":""}]`,
  }];
  let testo = "";
  for (let giro = 0; giro < 4; giro++) {
    const res = await client.messages.create({
      model: modello(), max_tokens: 6000, messages,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8, user_location: { type: "approximate", country: "IT", timezone: "Europe/Rome" } }],
    });
    for (const b of res.content) if (b.type === "text") testo += b.text;
    if (res.stop_reason !== "pause_turn") break;
    messages.push({ role: "assistant", content: res.content as Anthropic.ContentBlockParam[] });
    testo = "";
  }
  const j = estraiJson(testo);
  if (!Array.isArray(j)) return [];
  return j.map((r: Record<string, unknown>) => ({
    nome: s(r.nome, 120) ?? "",
    citta: s(r.citta, 60), provincia: s(r.provincia, 4)?.toUpperCase(), indirizzo: s(r.indirizzo, 160),
    telefono: normTel(s(r.telefono, 30)),
    email: s(r.email, 120)?.toLowerCase().match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)?.[0],
    sito: s(r.sito, 160), fonte_url: s(r.fonte_url, 300), note: s(r.note, 300),
  })).filter((r) => r.nome && (r.telefono || r.email || r.sito));
}

/** Bozza di sequenza email con l'AI, nel tono di EcuLion. Il titolare la rilegge prima di attivarla. */
export async function bozzaSequenza(target: string, idea: string): Promise<Passo[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const res = await client.messages.create({
    model: modello(), max_tokens: 3000,
    messages: [{
      role: "user",
      content: `Scrivi una sequenza di 4 email commerciali B2B in italiano per EcuLion, laboratorio di Montesilvano che ripara centraline elettroniche di mezzi pesanti, macchine da lavoro e barche.
Destinatari: ${CATEGORIE[target] ?? CATEGORIE.officine}.
Punti di forza veri (non inventarne altri, niente numeri o testimonianze inventate): preventivo immediato dal codice della centralina sul sito eculion.it; riparazione di solito circa un terzo del prezzo del nuovo; ritiro e rispedizione gratuiti; diagnosi gratuita, paghi solo se è riparabile; garanzia a vita sul guasto riparato con certificato; circa 3 giorni tra ritiro e riconsegna; laboratorio guidato da Alex Chiriak, oltre 6 anni di esperienza; programma partner con sconti 10% e 15%.
${idea ? `Indicazioni del titolare: ${idea.slice(0, 500)}` : ""}
Regole: email brevi (massimo 90 parole), tono diretto da officina a officina, una sola richiesta per email, niente punti esclamativi a raffica. Usa {nome} per il nome dell'attività e {citta} per la città. Non aggiungere firma né link di disiscrizione: li aggiunge il sistema.
Giorni consigliati: 0, 3, 7, 14.
Rispondi solo con JSON: [{"giorno":0,"oggetto":"","testo":""}]`,
    }],
  });
  const t = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  const j = estraiJson(t);
  if (!Array.isArray(j)) return [];
  return j.slice(0, 8).map((p: Record<string, unknown>) => ({
    giorno: Math.max(0, Math.min(90, Number(p.giorno) || 0)), canale: "email" as const,
    oggetto: s(p.oggetto, 140) ?? "", testo: (typeof p.testo === "string" ? p.testo : "").slice(0, 2000),
  })).filter((p) => p.oggetto && p.testo);
}

export const personalizza = (t: string, p: { nome: string; citta?: string | null }) =>
  t.replaceAll("{nome}", p.nome).replaceAll("{citta}", p.citta ?? "la tua zona");

export const emailPronta = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_MITTENTE);

async function inviaEmail(a: string, oggetto: string, testo: string, disiscrivi: string) {
  const piede = `\n\n—\nEcuLion · Riparazione centraline per mezzi pesanti · Montesilvano (PE)\nNon vuoi più ricevere queste email? ${disiscrivi}`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_MITTENTE, to: [a], subject: oggetto, text: testo + piede,
      reply_to: process.env.EMAIL_RISPOSTE || undefined,
      headers: { "List-Unsubscribe": `<${disiscrivi}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}`);
}

/**
 * Manda i passi email arrivati a scadenza. Chiamata dal cron giornaliero.
 * Senza servizio email collegato non manda niente e lascia tutto in coda.
 */
export async function elaboraSequenze(admin: SupabaseClient, baseUrl: string, limite = 80) {
  if (!emailPronta()) return { inviate: 0, errori: 0, inAttesa: true };
  const { data: lista } = await admin.from("prospect")
    .select("id, nome, citta, email, passo, token, sequenza_id, sequenze(passi, attiva)")
    .eq("stato", "in_sequenza").lte("prossimo_invio", new Date().toISOString()).not("email", "is", null).limit(limite);
  let inviate = 0, errori = 0;
  for (const p of (lista ?? []) as unknown as { id: number; nome: string; citta: string | null; email: string; passo: number; token: string; sequenze: { passi: Passo[]; attiva: boolean } | null }[]) {
    const passi = (p.sequenze?.passi ?? []).filter((x) => x.canale === "email");
    if (!p.sequenze?.attiva) continue;
    const passo = passi[p.passo];
    if (!passo) { await admin.from("prospect").update({ stato: "nuovo", prossimo_invio: null }).eq("id", p.id); continue; }
    try {
      const oggetto = personalizza(passo.oggetto, p);
      await inviaEmail(p.email, oggetto, personalizza(passo.testo, p), `${baseUrl}/disiscriviti?t=${p.token}`);
      const succ = passi[p.passo + 1];
      await admin.from("prospect").update({
        passo: p.passo + 1, ultimo_contatto: new Date().toISOString(),
        prossimo_invio: succ ? new Date(Date.now() + Math.max(1, succ.giorno - passo.giorno) * 86400000).toISOString() : null,
        stato: succ ? "in_sequenza" : "nuovo",
      }).eq("id", p.id);
      await admin.from("prospect_attivita").insert({ prospect_id: p.id, tipo: "email_inviata", passo: p.passo, oggetto });
      inviate++;
    } catch (e) {
      errori++;
      await admin.from("prospect_attivita").insert({ prospect_id: p.id, tipo: "errore", passo: p.passo, dettaglio: String(e).slice(0, 200) });
    }
  }
  return { inviate, errori, inAttesa: false };
}
