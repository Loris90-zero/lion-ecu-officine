"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { richiediStaff } from "@/lib/sessione";
import { eur } from "@/lib/fasi";
import { livelloOfficina, scontato } from "@/lib/fedelta";
import { testoMessaggio, preparaMessaggio, type MessaggioPronto, type TipoMessaggio } from "@/lib/messaggi";
import type { Officina, Pratica } from "@/lib/types";

export type EsitoPasso = { ok?: string; errore?: string; messaggio?: MessaggioPronto };

const CORRIERI = ["BRT", "GLS", "SDA", "DHL", "UPS", "FedEx/TNT", "Poste", "Altro"];

async function base() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  return `https://${h.get("x-forwarded-host") ?? h.get("host")}`;
}

/** Un passo della pratica con un tocco: aggiorna la fase e prepara il WhatsApp per l'officina. */
export async function avanzaPratica(_: EsitoPasso, fd: FormData): Promise<EsitoPasso> {
  const { sb, user, nome } = await richiediStaff();
  const id = String(fd.get("id"));
  const passo = String(fd.get("passo"));
  const { data } = await sb.from("pratiche").select("*, officine(*)").eq("id", id).maybeSingle();
  if (!data) return { errore: "Pratica non trovata." };
  const p = data as Pratica & { officine: Officina };
  const o = p.officine;
  const pezzo = p.centralina || p.codice_etichetta || "inviata";
  const comune = { referente: o.referente, numero: p.numero, pezzo };
  const autore = nome ?? user.email ?? "staff";
  const link = `${await base()}/pratica/${p.id}`;
  let agg: Record<string, unknown> = {};
  let tipo: TipoMessaggio;
  let testo: string;

  if (passo === "arrivata") {
    if (p.fase !== 0) return { errore: "La centralina risulta già arrivata." };
    agg = { fase: 1 }; tipo = "arrivata"; testo = testoMessaggio(tipo, comune);
  } else if (passo === "diagnosi") {
    if (p.fase !== 1) return { errore: "La diagnosi si inizia dopo l'arrivo della centralina." };
    agg = { fase: 2 }; tipo = "diagnosi"; testo = testoMessaggio(tipo, comune);
  } else if (passo === "riparabile" || passo === "non_riparabile") {
    if (p.fase !== 2 || p.esito) return { errore: "L'esito è già stato registrato." };
    const nota = String(fd.get("nota") ?? "").trim().slice(0, 600) || null;
    if (passo === "riparabile") {
      const prezzo = Number(String(fd.get("prezzo") ?? "").replace(",", "."));
      if (!(prezzo > 0)) return { errore: "Scrivi il prezzo della riparazione (IVA esclusa)." };
      const liv = await livelloOfficina(sb, o.id);
      const importo = scontato(prezzo, liv.sconto);
      agg = { esito: "riparabile", prezzo_confermato_eur: prezzo, nota_laboratorio: nota };
      tipo = "riparabile";
      testo = testoMessaggio(tipo, { ...comune, nota, link, importo: eur(importo), piuAlto: !!p.prezzo_accettato_eur && prezzo > Number(p.prezzo_accettato_eur) });
    } else {
      agg = { esito: "non_riparabile", prezzo_confermato_eur: null, nota_laboratorio: nota };
      tipo = "non_riparabile"; testo = testoMessaggio(tipo, { ...comune, nota });
    }
  } else if (passo === "spedita") {
    if (p.fase !== 2 || !p.esito) return { errore: "Prima registra l'esito della diagnosi." };
    if (p.esito === "riparabile" && !p.pagato) return { errore: "La pratica non risulta ancora pagata." };
    const corriere = String(fd.get("corriere") ?? "");
    const tracking = String(fd.get("tracking") ?? "").trim().slice(0, 80);
    if (!CORRIERI.includes(corriere)) return { errore: "Scegli il corriere." };
    if (!tracking) return { errore: "Scrivi il numero di tracking." };
    agg = { fase: 3, corriere, tracking };
    tipo = p.esito === "riparabile" ? "spedita" : "rispedita";
    testo = testoMessaggio(tipo, { ...comune, corriere, tracking, link: p.esito === "riparabile" ? link : undefined });
  } else return { errore: "Passo non valido." };

  const { error } = await sb.from("pratiche").update(agg).eq("id", id);
  if (error) return { errore: "Aggiornamento non riuscito. Riprova." };
  const messaggio = await preparaMessaggio(sb, o, p.id, tipo, testo, autore);
  revalidatePath(`/lab/pratica/${id}`);
  revalidatePath("/lab");
  return { ok: "Fatto.", messaggio };
}

/** Il tecnico ha mandato il WhatsApp dal suo telefono. */
export async function segnaInviato(fd: FormData) {
  const { sb } = await richiediStaff();
  const id = Number(fd.get("messaggio"));
  if (id) await sb.from("messaggi").update({ stato: "inviato_a_mano", inviato_il: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/lab/pratica/${String(fd.get("pratica"))}`);
}
