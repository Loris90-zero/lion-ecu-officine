export const STATI_CRM = [
  { v: "nuova", nome: "Nuova" },
  { v: "contattata", nome: "Contattata" },
  { v: "attiva", nome: "Attiva" },
  { v: "ferma", nome: "Ferma" },
  { v: "persa", nome: "Persa" },
] as const;
export type StatoCrm = (typeof STATI_CRM)[number]["v"];
export const nomeStato = (v: string | null | undefined) => STATI_CRM.find((s) => s.v === (v ?? "nuova"))?.nome ?? "Nuova";

/** Numero per i link WhatsApp: solo cifre, prefisso 39 se manca. */
export function numeroWa(tel: string) {
  let d = tel.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length <= 10 && d.startsWith("3")) d = "39" + d;
  return d;
}
