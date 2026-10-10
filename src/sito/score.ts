/** Domande del quiz per le officine e calcolo dello score (0–100). */
export const DOMANDE = [
  { id: "centraline", testo: "Quante centraline guaste vedete in un mese?", multipla: false, opzioni: [["0-1", "Nessuna o una"], ["2-5", "Da 2 a 5"], ["6-15", "Da 6 a 15"], ["15+", "Più di 15"]] },
  { id: "oggi", testo: "Oggi cosa fate quando una centralina è guasta?", multipla: false, opzioni: [["nuova", "La sostituiamo con una nuova"], ["altro", "La mandiamo a un altro riparatore"], ["altrove", "Mandiamo il cliente altrove"], ["noi", "La ripariamo noi"]] },
  { id: "mezzi", testo: "Su quali mezzi lavorate di più?", multipla: true, opzioni: [["camion", "Camion"], ["bus", "Bus"], ["movimento-terra", "Movimento terra"], ["gru", "Gru"], ["agricole", "Macchine agricole"], ["industriali", "Macchine industriali"], ["barche", "Barche"]] },
  { id: "meccanici", testo: "Quanti meccanici lavorano in officina?", multipla: false, opzioni: [["1-2", "1 o 2"], ["3-5", "Da 3 a 5"], ["6+", "6 o più"]] },
  { id: "adesso", testo: "Avete una centralina guasta in questo momento?", multipla: false, opzioni: [["si", "Sì"], ["no", "No"]] },
] as const;

const PUNTI: Record<string, Record<string, number>> = {
  centraline: { "0-1": 0, "2-5": 15, "6-15": 30, "15+": 40 },
  oggi: { nuova: 25, altro: 20, altrove: 15, noi: 5 },
  meccanici: { "1-2": 5, "3-5": 10, "6+": 15 },
  adesso: { si: 15, no: 0 },
};
const PESANTI = ["camion", "bus", "movimento-terra"];

export type Risposte = Record<string, string | string[]>;

export function calcolaScore(r: Risposte) {
  let s = 0;
  for (const k of Object.keys(PUNTI)) s += PUNTI[k][String(r[k] ?? "")] ?? 0;
  const mezzi = Array.isArray(r.mezzi) ? r.mezzi : [];
  s += Math.min(15, mezzi.reduce((t, m) => t + (PESANTI.includes(m) ? 10 : 5), 0));
  return Math.round((s / 110) * 100);
}

export const SOGLIA_CALDO = 70;
