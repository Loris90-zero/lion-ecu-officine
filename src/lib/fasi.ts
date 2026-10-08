export const FASI = [
  "Ritiro prenotato",
  "Centralina arrivata",
  "Diagnosi",
  "Reinvio confermato",
  "Garanzia disponibile",
  "Fattura inviata",
] as const;

export const TIPI_MEZZO = ["Camion", "Bus", "Gru", "Movimento terra", "Barca", "Macchina industriale", "Macchina agricola"] as const;

export const FASCE = ["8:00 – 12:00", "14:00 – 18:00"] as const;

export function classeFase(fase: number) {
  return fase >= 3 ? "p-ok" : fase === 2 ? "p-warn" : "p-info";
}

export function eur(v: number | null | undefined) {
  if (v === null || v === undefined || !isFinite(Number(v))) return "—";
  return Math.round(Number(v)).toLocaleString("it-IT") + " €";
}

export function dataBreve(iso: string) {
  return new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });
}

export function dataLunga(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Rome" });
}
