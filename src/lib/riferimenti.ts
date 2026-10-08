import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RisultatoCerca } from "./types";

export type Riferimento = {
  id: number; codici: string[]; descrizione: string | null; prezzo_eur: number; valuta: string;
  prezzo_originale: number | null; fonte_nome: string | null; fonte_url: string | null;
  origine: "ricerca" | "laboratorio"; attivo: boolean; aggiornato_il: string;
};

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Codici con cui cercare in tabella: il testo cercato e ogni codice trovato (anche senza il nome della marca). */
export function candidati(q: string, codici: string[] = []) {
  const out = new Set<string>();
  for (const c of [q, ...codici]) {
    if (!c) continue;
    const intero = norm(c);
    if (intero.length >= 5) out.add(intero);
    for (const t of c.split(/[\s/,;–-]+/)) { const n = norm(t); if (n.length >= 5 && /\d/.test(n)) out.add(n); }
  }
  return [...out].slice(0, 20);
}

export async function fontiPreferite(admin: SupabaseClient) {
  const { data } = await admin.from("fonti_preferite").select("dominio, categoria").eq("attivo", true).order("categoria");
  return (data ?? []) as { dominio: string; categoria: string }[];
}

/** Prezzi in tabella per questi codici: prima quelli inseriti dal laboratorio. */
export async function trovaRiferimenti(admin: SupabaseClient, cand: string[]) {
  if (!cand.length) return { laboratorio: [] as Riferimento[], ricerca: [] as Riferimento[] };
  const { data } = await admin.from("prezzi_riferimento").select("*").overlaps("codici", cand).eq("attivo", true).order("aggiornato_il", { ascending: false }).limit(20);
  const righe = (data ?? []) as Riferimento[];
  return { laboratorio: righe.filter((r) => r.origine === "laboratorio"), ricerca: righe.filter((r) => r.origine === "ricerca") };
}

/** Salva i prezzi del nuovo originale trovati online, così la prossima volta sono subito disponibili. */
export async function salvaDaRicerca(admin: SupabaseClient, r: RisultatoCerca, cand: string[]) {
  if (!cand.length) return;
  const descrizione = [r.marca, r.modello].filter(Boolean).join(" ").slice(0, 160) || null;
  for (const p of r.prezzi_nuova) {
    const { data: esiste } = await admin.from("prezzi_riferimento").select("id, codici").eq("fonte_url", p.url).eq("origine", "ricerca").maybeSingle();
    const riga = {
      codici: esiste ? [...new Set([...(esiste.codici as string[]), ...cand])].slice(0, 30) : cand,
      descrizione, prezzo_eur: p.prezzo_eur, valuta: p.valuta || "EUR", prezzo_originale: p.prezzo_originale ?? p.prezzo_eur,
      fonte_nome: (p.venditore || "").slice(0, 120) || null, fonte_url: p.url, origine: "ricerca", aggiornato_il: new Date().toISOString(),
    };
    if (esiste) await admin.from("prezzi_riferimento").update(riga).eq("id", esiste.id);
    else await admin.from("prezzi_riferimento").insert(riga);
  }
}
