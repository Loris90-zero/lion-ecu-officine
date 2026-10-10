import type { SupabaseClient } from "@supabase/supabase-js";

/** Programma punti: 1 € speso (IVA esclusa, riparazioni pagate) = 1 punto, sugli ultimi N mesi. */
export type RegoleFedelta = {
  fedelta_mesi: number;
  soglia_partner_eur: number;
  sconto_partner: number;
  soglia_gold_eur: number;
  sconto_gold: number;
};

export type Livello = {
  nome: "Base" | "Partner" | "Partner Gold";
  sconto: number;
  punti: number;
  mesi: number;
  prossimo: { nome: string; soglia: number; sconto: number; mancano: number } | null;
};

export const REGOLE_PREDEFINITE: RegoleFedelta = { fedelta_mesi: 12, soglia_partner_eur: 3000, sconto_partner: 0.1, soglia_gold_eur: 6000, sconto_gold: 0.15 };

export function livelloDa(punti: number, r: RegoleFedelta = REGOLE_PREDEFINITE): Livello {
  const p = Math.floor(Math.max(0, punti));
  const sp = Number(r.soglia_partner_eur), sg = Number(r.soglia_gold_eur);
  const mesi = Number(r.fedelta_mesi);
  if (p >= sg) return { nome: "Partner Gold", sconto: Number(r.sconto_gold), punti: p, mesi, prossimo: null };
  if (p >= sp) return { nome: "Partner", sconto: Number(r.sconto_partner), punti: p, mesi, prossimo: { nome: "Partner Gold", soglia: sg, sconto: Number(r.sconto_gold), mancano: sg - p } };
  return { nome: "Base", sconto: 0, punti: p, mesi, prossimo: { nome: "Partner", soglia: sp, sconto: Number(r.sconto_partner), mancano: sp - p } };
}

export const scontato = (prezzo: number, sconto: number) => Math.round(Number(prezzo) * (1 - sconto) * 100) / 100;
export const pct = (s: number) => `${Math.round(s * 100)}%`;

/** Livello attuale di un'officina. Con il client dell'officina vede solo le sue pratiche (RLS). */
export async function livelloOfficina(sb: SupabaseClient, officinaId: string): Promise<Livello> {
  const { data: imp } = await sb.from("impostazioni").select("fedelta_mesi, soglia_partner_eur, sconto_partner, soglia_gold_eur, sconto_gold").eq("id", 1).maybeSingle();
  const r = (imp as RegoleFedelta | null) ?? REGOLE_PREDEFINITE;
  const da = new Date();
  da.setMonth(da.getMonth() - Number(r.fedelta_mesi || 12));
  const { data } = await sb.from("pratiche").select("prezzo_pagato_eur, prezzo_confermato_eur")
    .eq("officina_id", officinaId).eq("pagato", true).gte("pagato_il", da.toISOString());
  const punti = (data ?? []).reduce((s, x) => s + Number(x.prezzo_pagato_eur ?? x.prezzo_confermato_eur ?? 0), 0);
  return livelloDa(punti, r);
}

/** Livello di tutte le officine in una volta (per il pannello laboratorio, client dello staff). */
export async function livelliOfficine(sb: SupabaseClient): Promise<{ regole: RegoleFedelta; livelli: Map<string, Livello> }> {
  const { data: imp } = await sb.from("impostazioni").select("fedelta_mesi, soglia_partner_eur, sconto_partner, soglia_gold_eur, sconto_gold").eq("id", 1).maybeSingle();
  const regole = (imp as RegoleFedelta | null) ?? REGOLE_PREDEFINITE;
  const da = new Date();
  da.setMonth(da.getMonth() - Number(regole.fedelta_mesi || 12));
  const { data } = await sb.from("pratiche").select("officina_id, prezzo_pagato_eur, prezzo_confermato_eur").eq("pagato", true).gte("pagato_il", da.toISOString());
  const somme = new Map<string, number>();
  for (const x of data ?? []) somme.set(x.officina_id, (somme.get(x.officina_id) ?? 0) + Number(x.prezzo_pagato_eur ?? x.prezzo_confermato_eur ?? 0));
  const livelli = new Map<string, Livello>();
  for (const [id, s] of somme) livelli.set(id, livelloDa(s, regole));
  return { regole, livelli };
}
