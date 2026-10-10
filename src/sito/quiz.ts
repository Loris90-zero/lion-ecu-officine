/**
 * Questionario dinamico di scoring: ogni risposta decide la domanda successiva.
 * Usato dal sito (quiz officine, pagina partner) e dalla registrazione nell'app.
 * Lo score e il profilo si calcolano sul server ripercorrendo il flusso.
 */

export type Opzione = { v: string; t: string };
export type Nodo = { id: string; testo: string; aiuto?: string; multipla?: boolean; max?: number; opzioni: Opzione[] };
export type Risposte = Record<string, string | string[]>;

const MEZZI: Opzione[] = [
  { v: "camion", t: "Camion" }, { v: "bus", t: "Bus" }, { v: "movimento-terra", t: "Movimento terra" },
  { v: "gru", t: "Gru" }, { v: "agricole", t: "Macchine agricole" }, { v: "industriali", t: "Macchine industriali" }, { v: "barche", t: "Barche" },
];

export const NODI: Record<string, Nodo> = {
  chi: { id: "chi", testo: "Chi sei?", opzioni: [
    { v: "officina", t: "Officina meccanica o meccatronica" },
    { v: "flotta", t: "Azienda con una flotta di mezzi" },
    { v: "altro", t: "Concessionario, rivenditore o altro" },
  ] },
  mezzi: { id: "mezzi", testo: "Su quali mezzi lavorate di più?", aiuto: "Puoi sceglierne più di uno.", multipla: true, opzioni: MEZZI },
  volume: { id: "volume", testo: "Quante centraline guaste vi capitano in un mese?", opzioni: [
    { v: "0-1", t: "Nessuna o una" }, { v: "2-5", t: "Da 2 a 5" }, { v: "6-15", t: "Da 6 a 15" }, { v: "15+", t: "Più di 15" },
  ] },
  oggi: { id: "oggi", testo: "Oggi, quando arriva una centralina guasta, cosa fate?", opzioni: [
    { v: "ripariamo", t: "La ripariamo noi in officina" },
    { v: "terzi", t: "La mandiamo a riparare fuori" },
    { v: "nuova", t: "La sostituiamo con una nuova" },
    { v: "altrove", t: "Mandiamo il cliente da un'altra parte" },
  ] },
  rip_quanto: { id: "rip_quanto", testo: "Riuscite a riparare tutte quelle che vi arrivano?", opzioni: [
    { v: "tutte", t: "Quasi tutte" },
    { v: "alcune", t: "Solo alcune: le altre le mandiamo fuori o le sostituiamo" },
    { v: "poche", t: "Poche, solo i guasti semplici" },
  ] },
  rip_difficili: { id: "rip_difficili", testo: "Quali centraline vi danno più problemi?", aiuto: "Puoi sceglierne più di una.", multipla: true, opzioni: [
    { v: "motore", t: "Motore" }, { v: "cambio", t: "Cambio" }, { v: "freni", t: "Freni EBS e ABS" },
    { v: "sospensioni", t: "Sospensioni" }, { v: "idraulica", t: "Idraulica e gru" }, { v: "cruscotto", t: "Cruscotti e body controller" },
  ] },
  terzi_chi: { id: "terzi_chi", testo: "A chi le mandate di solito?", opzioni: [
    { v: "bosch", t: "Al servizio di riparazione Bosch" },
    { v: "riparatore", t: "A un riparatore indipendente" },
    { v: "ricondizionata", t: "Le cambiamo con una ricondizionata" },
    { v: "vari", t: "Dipende, a laboratori diversi" },
  ] },
  terzi_voto: { id: "terzi_voto", testo: "Come vi trovate?", opzioni: [
    { v: "bene", t: "Bene" }, { v: "cosi", t: "Così così" }, { v: "male", t: "Male" },
  ] },
  terzi_problema: { id: "terzi_problema", testo: "Cosa non funziona?", aiuto: "Puoi sceglierne più di uno.", multipla: true, opzioni: [
    { v: "tempi", t: "Tempi troppo lunghi" }, { v: "prezzo", t: "Prezzi alti" },
    { v: "garanzia", t: "Garanzia assente o breve" }, { v: "preventivo", t: "Preventivo lento o poco chiaro" },
    { v: "spedizione", t: "La spedizione è a carico nostro" }, { v: "durata", t: "Riparazioni che non durano" },
  ] },
  nuova_perche: { id: "nuova_perche", testo: "Perché scegliete la nuova?", opzioni: [
    { v: "non_sapevo", t: "Non sapevamo che si potesse riparare" },
    { v: "fiducia", t: "Non ci fidiamo delle riparazioni" },
    { v: "tempi", t: "La riparazione è troppo lenta" },
    { v: "cliente", t: "La chiede il cliente" },
  ] },
  altrove_perche: { id: "altrove_perche", testo: "Perché lo mandate altrove?", opzioni: [
    { v: "elettronica", t: "Non facciamo elettronica" },
    { v: "tempo", t: "Non abbiamo tempo di seguirlo" },
    { v: "laboratorio", t: "Non conoscevamo un laboratorio affidabile" },
  ] },
  f_mezzi_n: { id: "f_mezzi_n", testo: "Quanti mezzi ha la flotta?", opzioni: [
    { v: "1-5", t: "Da 1 a 5" }, { v: "6-20", t: "Da 6 a 20" }, { v: "21-50", t: "Da 21 a 50" }, { v: "50+", t: "Più di 50" },
  ] },
  f_tipi: { id: "f_tipi", testo: "Che mezzi avete?", aiuto: "Puoi sceglierne più di uno.", multipla: true, opzioni: MEZZI },
  f_officina: { id: "f_officina", testo: "Chi fa la manutenzione dei mezzi?", opzioni: [
    { v: "interna", t: "Abbiamo un'officina interna" },
    { v: "esterna", t: "Un'officina esterna di fiducia" },
    { v: "varie", t: "Officine diverse, dipende" },
  ] },
  f_guasti: { id: "f_guasti", testo: "Negli ultimi 12 mesi, quanti guasti alle centraline avete avuto?", opzioni: [
    { v: "0", t: "Nessuno" }, { v: "1-3", t: "Da 1 a 3" }, { v: "4-10", t: "Da 4 a 10" }, { v: "10+", t: "Più di 10" },
  ] },
  f_fermo: { id: "f_fermo", testo: "Quanto vi costa un mezzo fermo per un giorno?", opzioni: [
    { v: "<200", t: "Meno di 200 €" }, { v: "200-500", t: "Tra 200 e 500 €" }, { v: "500-1000", t: "Tra 500 e 1.000 €" }, { v: ">1000", t: "Più di 1.000 €" },
  ] },
  scelta: { id: "scelta", testo: "Cosa vi farebbe scegliere un laboratorio per le centraline?", aiuto: "Scegli fino a 3 cose.", multipla: true, max: 3, opzioni: [
    { v: "prezzo", t: "Il prezzo più basso" }, { v: "tempi", t: "Tempi rapidi" }, { v: "garanzia", t: "Una garanzia seria" },
    { v: "preventivo", t: "Il preventivo subito, prima di spedire" }, { v: "ritiro", t: "Ritiro e spedizione gratis" },
    { v: "supporto", t: "Un tecnico che risponde ai dubbi" }, { v: "app", t: "Seguire tutto da un'app" },
  ] },
  decide: { id: "decide", testo: "Chi decide dove mandare le centraline?", opzioni: [
    { v: "io", t: "Io" }, { v: "titolare", t: "Il titolare" }, { v: "capo", t: "Il capo officina" }, { v: "cliente", t: "Il cliente finale" },
  ] },
  f_decide: { id: "f_decide", testo: "Chi decide sulle riparazioni dei mezzi?", opzioni: [
    { v: "io", t: "Io" }, { v: "titolare", t: "Il titolare" }, { v: "responsabile", t: "Il responsabile della flotta" }, { v: "officina", t: "L'officina" },
  ] },
  meccanici: { id: "meccanici", testo: "Quanti siete in officina?", opzioni: [
    { v: "1-2", t: "1 o 2" }, { v: "3-5", t: "Da 3 a 5" }, { v: "6-10", t: "Da 6 a 10" }, { v: "10+", t: "Più di 10" },
  ] },
  adesso: { id: "adesso", testo: "Avete una centralina guasta in questo momento?", opzioni: [
    { v: "si", t: "Sì, adesso" }, { v: "presto", t: "Ne aspettiamo a breve" }, { v: "no", t: "No" },
  ] },
  partner: { id: "partner", testo: "Vi interessa entrare nella rete delle officine partner, che consigliamo a camionisti e flotte della vostra zona?", opzioni: [
    { v: "si", t: "Sì" }, { v: "forse", t: "Vorrei saperne di più" }, { v: "no", t: "Per ora no" },
  ] },
};

export const INIZIO = "chi";

/** La domanda che viene dopo, in base alle risposte date finora. null = finito. */
export function prossimo(id: string, r: Risposte): string | null {
  const v = r[id];
  const flotta = r.chi === "flotta";
  switch (id) {
    case "chi": return v === "flotta" ? "f_mezzi_n" : "mezzi";
    case "mezzi": return "volume";
    case "volume": return "oggi";
    case "oggi": return v === "ripariamo" ? "rip_quanto" : v === "terzi" ? "terzi_chi" : v === "nuova" ? "nuova_perche" : "altrove_perche";
    case "rip_quanto": return v === "tutte" ? "scelta" : "rip_difficili";
    case "rip_difficili": return "scelta";
    case "terzi_chi": return "terzi_voto";
    case "terzi_voto": return v === "bene" ? "scelta" : "terzi_problema";
    case "terzi_problema": return "scelta";
    case "nuova_perche": return "scelta";
    case "altrove_perche": return "scelta";
    case "f_mezzi_n": return "f_tipi";
    case "f_tipi": return "f_officina";
    case "f_officina": return "f_guasti";
    case "f_guasti": return "f_fermo";
    case "f_fermo": return "scelta";
    case "scelta": return flotta ? "f_decide" : "decide";
    case "decide": return "meccanici";
    case "f_decide": return "adesso";
    case "meccanici": return "adesso";
    case "adesso": return flotta ? null : "partner";
    case "partner": return null;
    default: return null;
  }
}

/** Ripercorre il flusso con le risposte: tiene solo quelle valide sul percorso e dice se è completo. */
export function percorri(input: Risposte) {
  const r: Risposte = {};
  const percorso: string[] = [];
  let id: string | null = INIZIO;
  while (id) {
    const n: Nodo = NODI[id];
    const valide = n.opzioni.map((o) => o.v);
    const x = input[id];
    if (n.multipla) {
      const arr = (Array.isArray(x) ? x : []).filter((v) => valide.includes(v)).slice(0, n.max ?? 10);
      if (!arr.length) return { risposte: r, percorso, completo: false, manca: id };
      r[id] = arr;
    } else {
      if (typeof x !== "string" || !valide.includes(x)) return { risposte: r, percorso, completo: false, manca: id };
      r[id] = x;
    }
    percorso.push(id);
    id = prossimo(id, r);
  }
  return { risposte: r, percorso, completo: true, manca: null as string | null };
}

const LEVA: Record<string, string> = {
  prezzo: "Prezzo: circa un terzo del nuovo", tempi: "Tempi: 3 giorni dal ritiro alla riconsegna", garanzia: "Garanzia a vita con certificato verificabile",
  preventivo: "Preventivo immediato dal codice", ritiro: "Ritiro e rispedizione gratuiti", supporto: "Un tecnico di riferimento", app: "Tutto dall'app",
};
const etichetta = (id: string, v: string) => NODI[id]?.opzioni.find((o) => o.v === v)?.t ?? v;
const lista = (id: string, r: Risposte) => (Array.isArray(r[id]) ? (r[id] as string[]) : []);

/** Score 0-100, profilo leggibile e leve commerciali da usare in chiamata. */
export function valuta(r: Risposte) {
  const flotta = r.chi === "flotta";
  let s = 0;
  const leve: string[] = [];
  const note: string[] = [];

  // Volume e dimensione
  if (flotta) {
    s += ({ "0": 0, "1-3": 10, "4-10": 25, "10+": 35 } as Record<string, number>)[String(r.f_guasti)] ?? 0;
    s += ({ "1-5": 2, "6-20": 6, "21-50": 10, "50+": 15 } as Record<string, number>)[String(r.f_mezzi_n)] ?? 0;
    s += ({ "<200": 0, "200-500": 3, "500-1000": 6, ">1000": 8 } as Record<string, number>)[String(r.f_fermo)] ?? 0;
    if (r.f_officina === "esterna" || r.f_officina === "varie") leve.push("Coinvolgi la loro officina: può diventare partner");
  } else {
    s += ({ "0-1": 0, "2-5": 15, "6-15": 28, "15+": 35 } as Record<string, number>)[String(r.volume)] ?? 0;
    s += ({ "1-2": 3, "3-5": 7, "6-10": 10, "10+": 12 } as Record<string, number>)[String(r.meccanici)] ?? 0;
  }
  const mezzi = flotta ? lista("f_tipi", r) : lista("mezzi", r);
  s += Math.min(10, mezzi.reduce((t, m) => t + (["camion", "bus", "movimento-terra"].includes(m) ? 4 : 2), 0));

  // Opportunità: come lavorano oggi
  if (r.oggi === "terzi") {
    s += 18;
    if (r.terzi_chi === "bosch") { s += 7; leve.unshift("Usano il servizio Bosch, che chiude per le officine indipendenti: proponiti come alternativa"); }
    if (r.terzi_voto === "male") s += 5; else if (r.terzi_voto === "cosi") s += 3; else if (r.terzi_voto === "bene") s -= 3;
    for (const p of lista("terzi_problema", r)) note.push(`Problema con l'attuale: ${etichetta("terzi_problema", p).toLowerCase()}`);
  } else if (r.oggi === "nuova") {
    s += r.nuova_perche === "non_sapevo" ? 25 : 20;
    if (r.nuova_perche === "non_sapevo") leve.unshift("Non sapevano che si ripara: mostra il confronto nuova contro riparata");
    if (r.nuova_perche === "fiducia") leve.unshift("Non si fidano: insisti su garanzia a vita e certificato verificabile");
    if (r.nuova_perche === "tempi") leve.unshift("Temono i tempi: 3 giorni e preventivo immediato");
  } else if (r.oggi === "altrove") {
    s += 16;
    if (r.altrove_perche === "elettronica") leve.unshift("Non fanno elettronica: con noi tengono il cliente e il margine");
  } else if (r.oggi === "ripariamo") {
    s += ({ tutte: 2, alcune: 14, poche: 18 } as Record<string, number>)[String(r.rip_quanto)] ?? 0;
    const diff = lista("rip_difficili", r);
    if (diff.length) leve.unshift(`Riparano da soli, ma non: ${diff.map((d) => etichetta("rip_difficili", d).toLowerCase()).join(", ")}. Proponiti per queste`);
  }

  // Urgenza, decisione, interesse
  s += ({ si: 15, presto: 8, no: 0 } as Record<string, number>)[String(r.adesso)] ?? 0;
  s += ({ io: 6, titolare: 6, responsabile: 6, capo: 4, cliente: 2, officina: 2 } as Record<string, number>)[String(flotta ? r.f_decide : r.decide)] ?? 0;
  if (!flotta) s += ({ si: 6, forse: 3, no: 0 } as Record<string, number>)[String(r.partner)] ?? 0;
  for (const c of lista("scelta", r)) if (LEVA[c]) leve.push(LEVA[c]);

  const score = Math.max(0, Math.min(100, Math.round(s)));
  const meseMedio = flotta
    ? (({ "0": 0, "1-3": 2, "4-10": 7, "10+": 14 } as Record<string, number>)[String(r.f_guasti)] ?? 0) / 12
    : ({ "0-1": 0.5, "2-5": 3.5, "6-15": 10, "15+": 20 } as Record<string, number>)[String(r.volume)] ?? 0;
  const tipo = etichetta("chi", String(r.chi));
  const oggi = flotta
    ? `${etichetta("f_mezzi_n", String(r.f_mezzi_n))} mezzi, manutenzione: ${etichetta("f_officina", String(r.f_officina)).toLowerCase()}`
    : `Oggi: ${etichetta("oggi", String(r.oggi)).toLowerCase()}${r.terzi_chi ? ` (${etichetta("terzi_chi", String(r.terzi_chi)).replace(/^./, (c) => c.toLowerCase())}, si trovano ${etichetta("terzi_voto", String(r.terzi_voto)).toLowerCase()})` : ""}`;
  const riassunto = `${tipo}. ${oggi}. Circa ${meseMedio < 1 ? "meno di 1" : Math.round(meseMedio)} centraline al mese. ${r.adesso === "si" ? "Ha una centralina guasta adesso." : r.adesso === "presto" ? "Ne aspetta una a breve." : ""}`.replace(/\s+/g, " ").trim();
  return { score, profilo: { tipo: r.chi, riassunto, leve: [...new Set(leve)].slice(0, 6), note, centraline_mese: Math.round(meseMedio * 10) / 10, partner: r.partner ?? null } };
}
