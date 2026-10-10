import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Cruscotto di gestione: stime per decidere, non contabilità ufficiale. */
export type ImpFinanza = {
  corriere_per_pratica: number; materiali_per_pratica: number; iva_vendite: number; iva_costi_variabili: number;
  commissione_pct: number; commissione_fissa: number; aliquota_tasse: number; mesi_cliente: number; quota_cac: number;
};

export const CATEGORIE: Record<string, string> = {
  operai: "Operai", affitto_utenze: "Affitto e utenze", commercialista: "Commercialista", software: "Software e abbonamenti",
  pubblicita: "Pubblicità", assicurazioni: "Assicurazioni", corriere: "Corriere", materiali: "Materiali tecnici",
  attrezzature: "Attrezzature", ammortamenti: "Ammortamenti", commissioni: "Commissioni pagamenti", altro: "Altro",
};

type PraticaF = { id: string; officina_id: string; esito: string | null; pagato: boolean; pagato_il: string | null; prezzo_pagato_eur: number | null; prezzo_confermato_eur: number | null; stripe_session_id: string | null };
type CostoR = { categoria: string; importo_mensile: number; iva: number; dal: string; al: string | null; attivo: boolean };
type Costo = { data: string; categoria: string; importo: number; iva: number };
type Bene = { costo: number; anni: number; acquistato_il: string };

export type Dati = { imp: ImpFinanza; pratiche: PraticaF[]; spedite: { pratica_id: string; creato_il: string }[]; ricorrenti: CostoR[]; costi: Costo[]; beni: Bene[] };

export async function caricaDati(sb: SupabaseClient): Promise<Dati> {
  const [imp, pr, ev, cr, c, b] = await Promise.all([
    sb.from("impostazioni_finanza").select("*").eq("id", 1).single(),
    sb.from("pratiche").select("id, officina_id, esito, pagato, pagato_il, prezzo_pagato_eur, prezzo_confermato_eur, stripe_session_id"),
    sb.from("eventi").select("pratica_id, creato_il").eq("fase", 3).eq("testo", "Reinvio confermato"),
    sb.from("costi_ricorrenti").select("categoria, importo_mensile, iva, dal, al, attivo"),
    sb.from("costi").select("data, categoria, importo, iva"),
    sb.from("beni_ammortizzabili").select("costo, anni, acquistato_il"),
  ]);
  return {
    imp: imp.data as ImpFinanza,
    pratiche: (pr.data ?? []) as PraticaF[],
    spedite: (ev.data ?? []) as { pratica_id: string; creato_il: string }[],
    ricorrenti: (cr.data ?? []) as CostoR[],
    costi: (c.data ?? []) as Costo[],
    beni: (b.data ?? []) as Bene[],
  };
}

export type Periodo = { da: Date; a: Date; nome: string };

export function periodo(chiave: string | undefined, oggi = new Date()): Periodo {
  const y = oggi.getFullYear(), m = oggi.getMonth();
  switch (chiave) {
    case "mese_scorso": return { da: new Date(y, m - 1, 1), a: new Date(y, m, 1), nome: "Mese scorso" };
    case "trimestre": { const q = Math.floor(m / 3) * 3; return { da: new Date(y, q, 1), a: new Date(y, q + 3, 1), nome: "Trimestre in corso" }; }
    case "anno": return { da: new Date(y, 0, 1), a: new Date(y + 1, 0, 1), nome: `Anno ${y}` };
    case "12mesi": return { da: new Date(y, m - 11, 1), a: new Date(y, m + 1, 1), nome: "Ultimi 12 mesi" };
    default: return { da: new Date(y, m, 1), a: new Date(y, m + 1, 1), nome: "Mese in corso" };
  }
}

const dentro = (iso: string | null, p: Periodo) => !!iso && new Date(iso) >= p.da && new Date(iso) < p.a;
const imponibile = (x: PraticaF) => Number(x.prezzo_pagato_eur ?? x.prezzo_confermato_eur ?? 0);

/** Mesi (inizio mese) del periodo che cadono tra dal e al. */
function mesiAttivi(p: Periodo, dal: Date, al: Date | null) {
  let n = 0;
  for (let d = new Date(p.da); d < p.a; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const fineMese = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    if (fineMese > dal && (!al || d <= al)) n++;
  }
  return n;
}

export type Conto = ReturnType<typeof calcola>;

export function calcola(d: Dati, p: Periodo) {
  const i = d.imp;
  const pagate = d.pratiche.filter((x) => x.pagato && dentro(x.pagato_il, p));
  const ricavi = pagate.reduce((s, x) => s + imponibile(x), 0);
  const sconti = pagate.reduce((s, x) => s + Math.max(0, Number(x.prezzo_confermato_eur ?? 0) - imponibile(x)), 0);
  const ivaVendite = ricavi * i.iva_vendite;
  const conStripe = pagate.filter((x) => x.stripe_session_id);
  const commissioni = conStripe.reduce((s, x) => s + imponibile(x) * (1 + Number(i.iva_vendite)) * Number(i.commissione_pct) + Number(i.commissione_fissa), 0);

  const esitoDi = new Map(d.pratiche.map((x) => [x.id, x.esito]));
  const spedite = d.spedite.filter((e) => dentro(e.creato_il, p));
  const corriere = spedite.length * Number(i.corriere_per_pratica);
  const riparate = spedite.filter((e) => esitoDi.get(e.pratica_id) === "riparabile").length;
  const materiali = riparate * Number(i.materiali_per_pratica);

  const perCat: Record<string, number> = { corriere, materiali, commissioni };
  let ivaCosti = (corriere + materiali) * Number(i.iva_costi_variabili);
  for (const c of d.ricorrenti.filter((c) => c.attivo)) {
    const n = mesiAttivi(p, new Date(c.dal), c.al ? new Date(c.al) : null);
    const v = n * Number(c.importo_mensile);
    perCat[c.categoria] = (perCat[c.categoria] ?? 0) + v;
    ivaCosti += v * Number(c.iva);
  }
  for (const c of d.costi.filter((c) => dentro(c.data, p))) {
    perCat[c.categoria] = (perCat[c.categoria] ?? 0) + Number(c.importo);
    ivaCosti += Number(c.importo) * Number(c.iva);
  }
  let amm = 0;
  for (const b of d.beni) {
    const da = new Date(b.acquistato_il);
    const fine = new Date(da); fine.setMonth(fine.getMonth() + Math.round(Number(b.anni) * 12));
    amm += mesiAttivi(p, da, fine) * (Number(b.costo) / (Number(b.anni) * 12));
  }
  perCat.ammortamenti = amm;
  const costi = Object.values(perCat).reduce((s, v) => s + v, 0);
  const utile = ricavi - costi;
  const tasse = Math.max(0, utile) * Number(i.aliquota_tasse);
  const netto = utile - tasse;
  const ivaDaVersare = ivaVendite - ivaCosti;
  const inAttesa = d.pratiche.filter((x) => x.esito === "riparabile" && !x.pagato && x.prezzo_confermato_eur).reduce((s, x) => s + Number(x.prezzo_confermato_eur), 0);

  // Pubblicità: costo per officina acquisita vs quanto vale un'officina
  const primaPagata = new Map<string, string>();
  for (const x of d.pratiche.filter((x) => x.pagato && x.pagato_il)) {
    const v = primaPagata.get(x.officina_id);
    if (!v || x.pagato_il! < v) primaPagata.set(x.officina_id, x.pagato_il!);
  }
  const nuove = [...primaPagata.values()].filter((v) => dentro(v, p)).length;
  const ads = perCat.pubblicita ?? 0;
  const margineContrib = pagate.length ? (ricavi - corriere - materiali - commissioni) / pagate.length : null;
  const seiMesi: Periodo = { da: new Date(Date.now() - 182 * 864e5), a: new Date(), nome: "" };
  const recenti = d.pratiche.filter((x) => x.pagato && dentro(x.pagato_il, seiMesi));
  const attive = new Set(recenti.map((x) => x.officina_id)).size;
  const praticheMese = attive ? recenti.length / attive / 6 : null;
  const valoreOfficina = margineContrib !== null && praticheMese !== null ? praticheMese * margineContrib * Number(i.mesi_cliente) : null;
  const cacMax = valoreOfficina !== null ? valoreOfficina * Number(i.quota_cac) : null;
  const cac = nuove ? ads / nuove : null;

  return {
    ricavi, sconti, ivaVendite, ivaCosti, ivaDaVersare, perCat, costi, utile, tasse, netto, inAttesa,
    pratichePagate: pagate.length, spedite: spedite.length, riparate,
    ads, nuove, cac, cacMax, margineContrib, praticheMese, valoreOfficina, officineAttive: attive,
  };
}

/** Ultimi 12 mesi, uno per uno. */
export function andamento(d: Dati, oggi = new Date()) {
  const out: { mese: string; c: Conto }[] = [];
  for (let k = 11; k >= 0; k--) {
    const da = new Date(oggi.getFullYear(), oggi.getMonth() - k, 1);
    const a = new Date(da.getFullYear(), da.getMonth() + 1, 1);
    out.push({ mese: da.toLocaleDateString("it-IT", { month: "short", year: "2-digit" }), c: calcola(d, { da, a, nome: "" }) });
  }
  return out;
}
