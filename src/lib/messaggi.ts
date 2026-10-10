import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { numeroWa } from "@/app/lab/officine/stati";

export type TipoMessaggio = "arrivata" | "diagnosi" | "riparabile" | "non_riparabile" | "spedita" | "rispedita" | "garanzia";

type Dati = {
  referente: string; numero: string; pezzo: string; link?: string;
  importo?: string; nota?: string | null; corriere?: string | null; tracking?: string | null; piuAlto?: boolean;
};

const nomeBreve = (r: string) => r.trim().split(/\s+/)[0] || "";

/** Testi dei WhatsApp all'officina, uno per ogni passaggio della pratica. */
export function testoMessaggio(tipo: TipoMessaggio, d: Dati) {
  const ciao = `Ciao ${nomeBreve(d.referente)},`.replace(" ,", ",");
  const firma = "\n\nEcuLion · Laboratorio centraline";
  const nota = d.nota ? `\n\nNota del tecnico: ${d.nota}` : "";
  switch (tipo) {
    case "arrivata":
      return `${ciao} la centralina ${d.pezzo} (pratica ${d.numero}) è arrivata nel nostro laboratorio. Ti scriviamo appena iniziamo la diagnosi.${firma}`;
    case "diagnosi":
      return `${ciao} abbiamo iniziato la diagnosi della centralina ${d.pezzo} (pratica ${d.numero}). Ti mandiamo l'esito appena è pronto.${firma}`;
    case "riparabile":
      return `${ciao} diagnosi completata: la centralina ${d.pezzo} (pratica ${d.numero}) è riparabile.${nota}\n\nPrezzo della riparazione: ${d.importo} + IVA.${d.piuAlto ? " È più alto della stima iniziale: procediamo solo se lo confermi pagando." : ""}\nPer procedere paga da qui: ${d.link}${firma}`;
    case "non_riparabile":
      return `${ciao} diagnosi completata: purtroppo la centralina ${d.pezzo} (pratica ${d.numero}) non è riparabile.${nota}\n\nTe la rispediamo gratis, senza nessun costo.${firma}`;
    case "spedita":
      return `${ciao} riparazione completata! La centralina ${d.pezzo} (pratica ${d.numero}) è stata spedita${d.corriere ? ` con ${d.corriere}` : ""}.${d.tracking ? `\nTracking: ${d.tracking}` : ""}\n\nIl certificato di garanzia a vita sul guasto riparato lo trovi nell'app.${d.link ? ` ${d.link}` : ""}${firma}`;
    case "rispedita":
      return `${ciao} ti abbiamo rispedito la centralina ${d.pezzo} (pratica ${d.numero})${d.corriere ? ` con ${d.corriere}` : ""}, senza costi.${d.tracking ? `\nTracking: ${d.tracking}` : ""}${firma}`;
    case "garanzia":
      return `${ciao} il certificato di garanzia della centralina ${d.pezzo} (pratica ${d.numero}) è pronto nell'app: ${d.link}${firma}`;
  }
}

export type MessaggioPronto = { testo: string; wa: string; consenso: boolean };

/**
 * Registra il messaggio da mandare all'officina. Finché non c'è un canale WhatsApp ufficiale collegato,
 * il tecnico lo invia con un tocco (link wa.me con il testo già scritto).
 */
export async function preparaMessaggio(sb: SupabaseClient, o: { id: string; telefono: string; consenso_whatsapp: boolean }, praticaId: string, tipo: TipoMessaggio, testo: string, autore: string): Promise<MessaggioPronto> {
  const consenso = !!o.consenso_whatsapp;
  await sb.from("messaggi").insert({
    pratica_id: praticaId, officina_id: o.id, canale: "whatsapp", destinatario: o.telefono, tipo, testo,
    stato: consenso ? "da_inviare" : "senza_consenso", creato_da: autore,
  });
  return { testo, wa: `https://wa.me/${numeroWa(o.telefono)}?text=${encodeURIComponent(testo)}`, consenso };
}
