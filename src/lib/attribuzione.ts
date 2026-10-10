/**
 * Da dove arriva una persona: annuncio (Meta, Google, TikTok), ricerca organica, social, diretto.
 * Il middleware lo salva in un cookie al primo arrivo sul sito; lead, registrazioni ed eventi lo leggono.
 * Nessuna dipendenza dal server: gira anche nel middleware.
 */

export const COOKIE_SORGENTE = "el_src";
export const DURATA_COOKIE = 60 * 60 * 24 * 60; // 60 giorni

export type Sorgente = "meta" | "google_ads" | "tiktok" | "linkedin" | "google" | "bing" | "social" | "whatsapp" | "email" | "referral" | "diretto";
export type Target = "officine" | "flotte" | "partner" | "altro";

export type Attribuzione = {
  s: Sorgente;          // sorgente
  m: "ads" | "organico" | "diretto"; // mezzo
  c?: string;           // campagna
  t?: Target;           // target dichiarato nell'annuncio (parametro t= o nome campagna)
  r?: string;           // dominio di provenienza
  l?: string;           // pagina di arrivo
  d: string;            // quando (ISO)
};

export const NOMI_SORGENTE: Record<Sorgente, string> = {
  meta: "Meta Ads", google_ads: "Google Ads", tiktok: "TikTok Ads", linkedin: "LinkedIn Ads",
  google: "Google (organico)", bing: "Bing (organico)", social: "Social (organico)", whatsapp: "WhatsApp",
  email: "Email", referral: "Altri siti", diretto: "Diretto",
};

export const PIATTAFORMA_SORGENTE: Record<string, Sorgente> = { meta: "meta", google: "google_ads", tiktok: "tiktok", linkedin: "linkedin" };

export function targetDa(testo?: string | null): Target | undefined {
  const x = (testo ?? "").toLowerCase();
  if (!x) return undefined;
  if (/flott|trasport|fleet/.test(x)) return "flotte";
  if (/partner/.test(x)) return "partner";
  if (/offic|mecca|meccatron/.test(x)) return "officine";
  return undefined;
}

/** Classifica un arrivo dai parametri dell'indirizzo e dal sito di provenienza. */
export function classifica(q: URLSearchParams, referrer?: string | null, pagina?: string): Attribuzione | null {
  const src = (q.get("utm_source") ?? "").toLowerCase();
  const med = (q.get("utm_medium") ?? "").toLowerCase();
  const camp = q.get("utm_campaign") ?? undefined;
  const t = (targetDa(q.get("t")) ?? targetDa(camp)) as Target | undefined;
  let host = "";
  try { host = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : ""; } catch { host = ""; }
  const base = { c: camp?.slice(0, 80), t, r: host || undefined, l: pagina?.slice(0, 120), d: new Date().toISOString() };
  const pagato = /cpc|ppc|paid|ads|cpm|display|video/.test(med);

  if (q.get("fbclid") && !src) return { s: "meta", m: "ads", ...base };
  if (q.get("gclid") || q.get("gbraid") || q.get("wbraid")) return { s: "google_ads", m: "ads", ...base };
  if (q.get("ttclid")) return { s: "tiktok", m: "ads", ...base };
  if (src) {
    if (/facebook|instagram|meta|^fb$|^ig$/.test(src)) return { s: pagato || camp ? "meta" : "social", m: pagato || camp ? "ads" : "organico", ...base };
    if (/google/.test(src)) return { s: pagato ? "google_ads" : "google", m: pagato ? "ads" : "organico", ...base };
    if (/tiktok/.test(src)) return { s: pagato || camp ? "tiktok" : "social", m: pagato || camp ? "ads" : "organico", ...base };
    if (/linkedin/.test(src)) return { s: pagato ? "linkedin" : "social", m: pagato ? "ads" : "organico", ...base };
    if (/whatsapp|wa/.test(src)) return { s: "whatsapp", m: "organico", ...base };
    if (/mail|newsletter/.test(src) || med === "email") return { s: "email", m: "organico", ...base };
    return { s: "referral", m: pagato ? "ads" : "organico", ...base };
  }
  if (!host) return null;
  if (/eculion\.it$|vercel\.app$/.test(host)) return null; // navigazione interna
  if (/google\./.test(host)) return { s: "google", m: "organico", ...base };
  if (/bing\.com|duckduckgo|yahoo|ecosia/.test(host)) return { s: "bing", m: "organico", ...base };
  if (/facebook|instagram|fb\.|tiktok|linkedin|youtube|t\.co|twitter|x\.com/.test(host)) return { s: "social", m: "organico", ...base };
  if (/whatsapp|wa\.me/.test(host)) return { s: "whatsapp", m: "organico", ...base };
  return { s: "referral", m: "organico", ...base };
}

/** Il nuovo arrivo sostituisce il vecchio solo se è un annuncio, o se prima non c'era niente. */
export function daAggiornare(vecchia: Attribuzione | null, nuova: Attribuzione | null) {
  if (!nuova) return false;
  if (!vecchia) return true;
  return nuova.m === "ads";
}

export function leggiAttribuzione(valore?: string | null): Attribuzione | null {
  if (!valore) return null;
  try {
    const a = JSON.parse(decodeURIComponent(valore));
    return a && typeof a.s === "string" ? (a as Attribuzione) : null;
  } catch { return null; }
}

export const scriviAttribuzione = (a: Attribuzione) => encodeURIComponent(JSON.stringify(a));

/** Dominio del cookie: condiviso tra sito e app quando sono sotto eculion.it. */
export const dominioCookie = (host: string) => (host.endsWith("eculion.it") ? ".eculion.it" : undefined);
