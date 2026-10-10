"use server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type Verifica = { esito?: "valida" | "non_trovata"; dati?: { centralina: string; guasto: string; data: string }; errore?: string };

/** Verifica pubblica di un certificato: servono numero pratica e ultime 4 cifre del codice centralina. Non mostra il cliente. */
export async function verificaCertificato(_: Verifica, fd: FormData): Promise<Verifica> {
  const numero = String(fd.get("numero") ?? "").trim().toUpperCase().replace(/\s/g, "");
  const cifre = String(fd.get("cifre") ?? "").trim().replace(/\s/g, "").toUpperCase();
  if (!/^LES-\d{2}-\d{4,}$/.test(numero)) return { errore: "Il numero pratica ha questo formato: LES-26-0012." };
  if (!/^[A-Z0-9]{4}$/.test(cifre)) return { errore: "Scrivi le ultime 4 cifre del codice della centralina." };
  const { data: p } = await supabaseAdmin().from("pratiche").select("numero, centralina, codice_etichetta, guasto_riparato, certificato, esito, fase, aggiornato_il").eq("numero", numero).maybeSingle();
  const codice = (p?.codice_etichetta ?? "").replace(/\s/g, "").toUpperCase();
  if (!p || p.esito !== "riparabile" || p.fase < 4 || !codice.endsWith(cifre)) return { esito: "non_trovata" };
  const cert = p.certificato as { guasto?: string } | null;
  return { esito: "valida", dati: { centralina: [p.centralina, p.codice_etichetta].filter(Boolean).join(", "), guasto: cert?.guasto || p.guasto_riparato || "—", data: new Date(p.aggiornato_il).toLocaleDateString("it-IT") } };
}
