import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Letture pubbliche del sito: solo contenuti pubblicati e parametri non riservati. */
type Parametri = { percentuale: number; minimo_eur: number; fedelta_mesi: number; soglia_partner_eur: number; sconto_partner: number; soglia_gold_eur: number; sconto_gold: number };
const PREDEFINITI: Parametri = { percentuale: 0.35, minimo_eur: 150, fedelta_mesi: 12, soglia_partner_eur: 3000, sconto_partner: 0.1, soglia_gold_eur: 6000, sconto_gold: 0.15 };

export async function parametriPubblici(): Promise<Parametri> {
  try {
    const { data } = await supabaseAdmin().from("impostazioni").select("percentuale, minimo_eur, fedelta_mesi, soglia_partner_eur, sconto_partner, soglia_gold_eur, sconto_gold").eq("id", 1).single();
    return (data as Parametri | null) ?? PREDEFINITI;
  } catch { return PREDEFINITI; }
}

export type PaginaCentralina = {
  slug: string; titolo: string; codice: string | null; marca: string | null; famiglia: string | null; tipo: string | null;
  veicoli: string[]; mezzi: string[]; descrizione: string | null; guasti: { titolo: string; sintomi: string }[];
  faq: { domanda: string; risposta: string }[]; prezzo_da: number | null; prezzo_nuovo: number | null; aggiornato_il: string;
};

export async function centralinePubblicate(q?: string) {
  let query = supabaseAdmin().from("pagine_centraline").select("slug, titolo, codice, marca, famiglia, tipo, prezzo_da, mezzi").eq("stato", "pubblicata").order("titolo").limit(300);
  if (q) {
    const pulito = q.replace(/[%,()]/g, "").replace(/\s+/g, "").slice(0, 40);
    const conSpazi = q.replace(/[%,()]/g, "").trim().slice(0, 40);
    query = query.or(`codice.ilike.%${pulito}%,titolo.ilike.%${conSpazi}%,famiglia.ilike.%${conSpazi}%,marca.ilike.%${conSpazi}%`);
  }
  const { data } = await query;
  return (data ?? []) as Pick<PaginaCentralina, "slug" | "titolo" | "codice" | "marca" | "famiglia" | "tipo" | "prezzo_da" | "mezzi">[];
}

export async function centralina(slug: string) {
  const { data } = await supabaseAdmin().from("pagine_centraline").select("*").eq("slug", slug).eq("stato", "pubblicata").maybeSingle();
  return data as PaginaCentralina | null;
}

export type Articolo = { slug: string; titolo: string; sommario: string | null; corpo: string; categoria: string | null; centralina_slug: string | null; pubblicato_il: string | null };

export async function articoliPubblicati(limite = 100) {
  const { data } = await supabaseAdmin().from("articoli").select("slug, titolo, sommario, categoria, centralina_slug, pubblicato_il").eq("stato", "pubblicata").order("pubblicato_il", { ascending: false }).limit(limite);
  return (data ?? []) as Omit<Articolo, "corpo">[];
}

export async function articolo(slug: string) {
  const { data } = await supabaseAdmin().from("articoli").select("*").eq("slug", slug).eq("stato", "pubblicata").maybeSingle();
  return data as Articolo | null;
}
