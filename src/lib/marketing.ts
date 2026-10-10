import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NOMI_SORGENTE, PIATTAFORMA_SORGENTE, type Sorgente } from "./attribuzione";

/** Numeri del marketing: spesa ads, contatti, app, ritiri, per sorgente e per target. */

export const PERIODI_MK = [["oggi", "Oggi"], ["ieri", "Ieri"], ["7", "7 giorni"], ["30", "30 giorni"], ["90", "90 giorni"]] as const;
export type ChiavePeriodo = (typeof PERIODI_MK)[number][0];
export const NOMI_TARGET: Record<string, string> = { officine: "Officine e meccatronici", flotte: "Flotte e trasporti", partner: "Partner", altro: "Altro", tutti: "Tutti i target" };

const TZ = "Europe/Rome";
const giornoRoma = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // YYYY-MM-DD
function mezzanotteRoma(giorno: string) {
  const prova = new Date(`${giorno}T12:00:00Z`);
  const off = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "shortOffset" }).formatToParts(prova).find((p) => p.type === "timeZoneName")?.value ?? "GMT+1";
  const h = Number(off.replace("GMT", "")) || 0;
  return new Date(`${giorno}T00:00:00${h >= 0 ? "+" : "-"}${String(Math.abs(h)).padStart(2, "0")}:00`);
}
/** "2026-10-12T09:30" letto come ora italiana. */
export function oraRoma(locale: string) {
  const [g, h = "00:00"] = locale.split("T");
  const m = mezzanotteRoma(g);
  const [hh, mm] = h.split(":").map(Number);
  return new Date(m.getTime() + ((hh || 0) * 60 + (mm || 0)) * 60000);
}
const piuGiorni = (giorno: string, n: number) => { const d = new Date(`${giorno}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

export type Periodo = { chiave: ChiavePeriodo; nome: string; da: Date; a: Date; giorni: string[]; prima: { da: Date; a: Date } };

export function periodoMk(k?: string): Periodo {
  const chiave = (PERIODI_MK.find(([c]) => c === k)?.[0] ?? "7") as ChiavePeriodo;
  const oggi = giornoRoma(new Date());
  const n = chiave === "oggi" || chiave === "ieri" ? 1 : Number(chiave);
  const ultimo = chiave === "ieri" ? piuGiorni(oggi, -1) : oggi;
  const primo = piuGiorni(ultimo, -(n - 1));
  const giorni = Array.from({ length: n }, (_, i) => piuGiorni(primo, i));
  const da = mezzanotteRoma(primo), a = mezzanotteRoma(piuGiorni(ultimo, 1));
  return { chiave, nome: PERIODI_MK.find(([c]) => c === chiave)![1], da, a, giorni, prima: { da: mezzanotteRoma(piuGiorni(primo, -n)), a: da } };
}

type Utm = { s?: string; t?: string; c?: string } | null;
type Lead = { creato_il: string; origine: string | null; utm: Utm; officina_id: string | null; risposte: { flusso?: { chi?: string } } | null };
type Off = { id: string; creato_il: string; utm: Utm; app_installata_il: string | null };
type Spesa = { giorno: string; piattaforma: string; target: string; spesa_eur: number; click: number | null; impression: number | null; campagna: string };
type Evento = { tipo: string; sorgente: string | null; target: string | null; creato_il: string };

export type Riga = { visite: number; whatsapp: number; lead: number; registrati: number; app: number; ritiri: number; spesa: number; click: number; impression: number };
const vuota = (): Riga => ({ visite: 0, whatsapp: 0, lead: 0, registrati: 0, app: 0, ritiri: 0, spesa: 0, click: 0, impression: 0 });

function targetLead(l: Lead) {
  if (l.utm?.t) return l.utm.t;
  if (l.origine === "sito_flotta") return "flotte";
  if (l.origine === "sito_partner") return "partner";
  const chi = l.risposte?.flusso?.chi;
  if (chi === "flotta") return "flotte";
  if (chi === "altro") return "altro";
  return "officine";
}
const sorg = (u: Utm) => (u?.s as Sorgente) || "diretto";

export async function caricaMarketing(sb: SupabaseClient, p: Periodo) {
  const da = p.prima.da.toISOString(), a = p.a.toISOString();
  const [spesa, lead, off, prat, ev, ric] = await Promise.all([
    sb.from("marketing_spesa").select("giorno, piattaforma, target, spesa_eur, click, impression, campagna").gte("giorno", giornoRoma(p.prima.da)).lt("giorno", giornoRoma(p.a)),
    sb.from("lead").select("creato_il, origine, utm, officina_id, risposte").gte("creato_il", da).lt("creato_il", a),
    sb.from("officine").select("id, creato_il, utm, app_installata_il"),
    sb.from("pratiche").select("officina_id, creato_il").order("creato_il"),
    sb.from("marketing_eventi").select("tipo, sorgente, target, creato_il").gte("creato_il", da).lt("creato_il", a).limit(20000),
    sb.from("ricerche").select("creato_il").eq("origine", "sito").gte("creato_il", da).lt("creato_il", a).limit(20000),
  ]);
  const officine = (off.data ?? []) as Off[];
  const leadOff = new Map<string, string>();
  // target di ogni officina: dal suo lead (anche fuori periodo)
  const { data: tuttiLead } = await sb.from("lead").select("officina_id, origine, utm, risposte").not("officina_id", "is", null);
  for (const l of (tuttiLead ?? []) as Lead[]) if (l.officina_id) leadOff.set(l.officina_id, targetLead(l));
  const primoRitiro = new Map<string, string>();
  for (const r of (prat.data ?? []) as { officina_id: string; creato_il: string }[]) if (!primoRitiro.has(r.officina_id)) primoRitiro.set(r.officina_id, r.creato_il);
  const offById = new Map(officine.map((o) => [o.id, o]));

  return {
    spesa: ((spesa.data ?? []) as Spesa[]).map((x) => ({ ...x, spesa_eur: Number(x.spesa_eur) || 0 })),
    lead: (lead.data ?? []) as Lead[],
    officine, leadOff, primoRitiro, offById,
    eventi: (ev.data ?? []) as Evento[],
    preventivi: (ric.data ?? []) as { creato_il: string }[],
  };
}
export type DatiMk = Awaited<ReturnType<typeof caricaMarketing>>;

const dentro = (iso: string | null | undefined, da: Date, a: Date) => !!iso && new Date(iso) >= da && new Date(iso) < a;
const dentroGiorno = (g: string, da: Date, a: Date) => g >= giornoRoma(da) && g < giornoRoma(a);

/** Totali, per sorgente e per target in un intervallo. */
export function calcolaMk(d: DatiMk, da: Date, a: Date) {
  const tot = vuota();
  const perS = new Map<string, Riga>(), perT = new Map<string, Riga>();
  const add = (m: Map<string, Riga>, k: string, f: (r: Riga) => void) => { if (!m.has(k)) m.set(k, vuota()); f(m.get(k)!); };
  let preventivi = 0, flotteForm = 0;

  for (const s of d.spesa) if (dentroGiorno(s.giorno, da, a)) {
    tot.spesa += s.spesa_eur; tot.click += s.click ?? 0; tot.impression += s.impression ?? 0;
    const so = PIATTAFORMA_SORGENTE[s.piattaforma] ?? "referral";
    add(perS, so, (r) => { r.spesa += s.spesa_eur; r.click += s.click ?? 0; r.impression += s.impression ?? 0; });
    add(perT, s.target, (r) => { r.spesa += s.spesa_eur; r.click += s.click ?? 0; });
  }
  for (const e of d.eventi) if (dentro(e.creato_il, da, a)) {
    const k = e.tipo === "visita" ? "visite" : e.tipo === "whatsapp" ? "whatsapp" : null;
    if (!k) continue;
    tot[k]++; add(perS, e.sorgente || "diretto", (r) => { r[k]++; });
    if (e.target) add(perT, e.target, (r) => { r[k]++; });
  }
  for (const l of d.lead) if (dentro(l.creato_il, da, a)) {
    tot.lead++; if (l.origine === "sito_flotta") flotteForm++;
    add(perS, sorg(l.utm), (r) => { r.lead++; }); add(perT, targetLead(l), (r) => { r.lead++; });
  }
  for (const o of d.officine) {
    const t = d.leadOff.get(o.id) ?? o.utm?.t ?? "officine", s = sorg(o.utm);
    if (dentro(o.creato_il, da, a)) { tot.registrati++; add(perS, s, (r) => { r.registrati++; }); add(perT, t, (r) => { r.registrati++; }); }
    if (dentro(o.app_installata_il, da, a)) { tot.app++; add(perS, s, (r) => { r.app++; }); add(perT, t, (r) => { r.app++; }); }
    if (dentro(d.primoRitiro.get(o.id), da, a)) { tot.ritiri++; add(perS, s, (r) => { r.ritiri++; }); add(perT, t, (r) => { r.ritiri++; }); }
  }
  for (const r of d.preventivi) if (dentro(r.creato_il, da, a)) preventivi++;
  return { tot, perS, perT, preventivi, flotteForm };
}

/** Serie giornaliera per il grafico. */
export function serieMk(d: DatiMk, giorni: string[]) {
  return giorni.map((g) => {
    const da = mezzanotteRoma(g), a = mezzanotteRoma(piuGiorni(g, 1));
    const c = calcolaMk(d, da, a);
    return { g, lead: c.tot.lead, spesa: c.tot.spesa, whatsapp: c.tot.whatsapp, ritiri: c.tot.ritiri, app: c.tot.app, visite: c.tot.visite };
  });
}

export const nomeSorgente = (k: string) => NOMI_SORGENTE[k as Sorgente] ?? k;
export const quota = (spesa: number, n: number) => (n > 0 && spesa > 0 ? spesa / n : null);

/** Testo del riepilogo che arriva ogni mattina sul telefono del titolare. */
export async function riepilogoIeri(sb: SupabaseClient) {
  const p = periodoMk("ieri");
  const d = await caricaMarketing(sb, p);
  const c = calcolaMk(d, p.da, p.a).tot;
  const eur = (v: number | null) => (v === null ? "—" : `${Math.round(v)} €`);
  const titolo = `Ieri: ${c.lead} contatti, ${c.ritiri} ritiri, costo per contatto ${eur(quota(c.spesa, c.lead))}`;
  const testo = `Spesa ads ${eur(c.spesa)} · ${c.whatsapp} WhatsApp · ${c.app} app installate · ${c.registrati} registrati · ${c.visite} visite al sito.`;
  return { titolo, testo };
}
