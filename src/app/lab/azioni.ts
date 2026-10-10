"use server";
import { revalidatePath } from "next/cache";
import { richiediStaff } from "@/lib/sessione";
import { livelloOfficina, scontato } from "@/lib/fedelta";

export type StatoLab = { ok?: string; errore?: string };

export async function aggiornaPratica(_: StatoLab, fd: FormData): Promise<StatoLab> {
  const { sb } = await richiediStaff();
  const id = String(fd.get("id"));
  const t = (k: string) => { const v = String(fd.get(k) ?? "").trim(); return v || null; };
  const fase = Number(fd.get("fase"));
  const esito = t("esito");
  const prezzo = t("prezzo_confermato_eur");
  const prezzoNum = prezzo ? Number(prezzo.replace(",", ".")) : null;
  if (!(fase >= 0 && fase <= 5)) return { errore: "Fase non valida." };
  if (esito && !["riparabile", "non_riparabile"].includes(esito)) return { errore: "Esito non valido." };
  if (prezzoNum !== null && !(prezzoNum > 0)) return { errore: "Il prezzo deve essere un numero maggiore di zero." };
  if (esito === "riparabile" && !prezzoNum) return { errore: "Per una centralina riparabile serve il prezzo confermato." };
  let pagamento = {};
  if (fd.get("pagato_manuale") === "on" && esito === "riparabile" && prezzoNum) {
    const { data: pr } = await sb.from("pratiche").select("officina_id").eq("id", id).single();
    const liv = pr ? await livelloOfficina(sb, pr.officina_id) : null;
    const sconto = liv?.sconto ?? 0;
    pagamento = { pagato: true, pagato_il: new Date().toISOString(), sconto_pct: sconto, prezzo_pagato_eur: scontato(prezzoNum, sconto) };
  }
  const { error } = await sb.from("pratiche").update({
    fase,
    esito,
    prezzo_confermato_eur: esito === "riparabile" ? prezzoNum : null,
    nota_laboratorio: t("nota_laboratorio"),
    guasto_riparato: t("guasto_riparato"),
    corriere: t("corriere"),
    tracking: t("tracking"),
    ...pagamento,
  }).eq("id", id);
  if (error) return { errore: "Salvataggio non riuscito: " + error.message };
  revalidatePath(`/lab/pratica/${id}`);
  revalidatePath("/lab");
  return { ok: "Salvato." };
}

export async function salvaImpostazioni(_: StatoLab, fd: FormData): Promise<StatoLab> {
  const { sb } = await richiediStaff();
  const n = (k: string) => Number(String(fd.get(k) ?? "").replace(",", "."));
  const percentuale = n("percentuale") / 100;
  const minimo_eur = n("minimo_eur");
  const arrotonda_eur = n("arrotonda_eur");
  const base = String(fd.get("base"));
  const cambio_usd = n("cambio_usd");
  const cambio_gbp = n("cambio_gbp");
  const soglia_anomali = n("soglia_anomali") / 100;
  if (!(cambio_usd > 0) || !(cambio_gbp > 0)) return { errore: "Controlla i cambi di dollaro e sterlina." };
  if (!(soglia_anomali >= 0 && soglia_anomali < 1)) return { errore: "La soglia dei prezzi anomali deve essere tra 0 e 99." };
  if (!(percentuale > 0 && percentuale < 1)) return { errore: "La percentuale deve essere tra 1 e 99." };
  if (!(minimo_eur >= 0) || !(arrotonda_eur >= 1)) return { errore: "Controlla minimo e arrotondamento." };
  if (!["mediana", "minimo", "massimo"].includes(base)) return { errore: "Base non valida." };
  const { error } = await sb.from("impostazioni").update({ percentuale, minimo_eur, arrotonda_eur, base, cambio_usd, cambio_gbp, soglia_anomali, aggiornato_il: new Date().toISOString() }).eq("id", 1);
  if (error) return { errore: "Salvataggio non riuscito." };
  revalidatePath("/lab/impostazioni");
  return { ok: "Impostazioni salvate. Valgono dalla prossima ricerca." };
}

export async function salvaFedelta(_: StatoLab, fd: FormData): Promise<StatoLab> {
  const { sb } = await richiediStaff();
  const n = (k: string) => Number(String(fd.get(k) ?? "").replace(",", "."));
  const dati = {
    fedelta_mesi: Math.round(n("fedelta_mesi")),
    soglia_partner_eur: n("soglia_partner_eur"),
    sconto_partner: n("sconto_partner") / 100,
    soglia_gold_eur: n("soglia_gold_eur"),
    sconto_gold: n("sconto_gold") / 100,
  };
  if (!(dati.fedelta_mesi >= 1 && dati.fedelta_mesi <= 60)) return { errore: "I mesi devono essere tra 1 e 60." };
  if (!(dati.soglia_partner_eur > 0 && dati.soglia_gold_eur > dati.soglia_partner_eur)) return { errore: "La soglia Gold deve essere più alta di quella Partner." };
  if (!(dati.sconto_partner >= 0 && dati.sconto_gold >= dati.sconto_partner && dati.sconto_gold < 0.5)) return { errore: "Controlla gli sconti: Gold almeno quanto Partner, massimo 49%." };
  const { error } = await sb.from("impostazioni").update({ ...dati, aggiornato_il: new Date().toISOString() }).eq("id", 1);
  if (error) return { errore: "Salvataggio non riuscito." };
  revalidatePath("/lab/impostazioni");
  return { ok: "Programma punti aggiornato. Vale subito per tutte le officine." };
}

export async function aggiungiStaff(_: StatoLab, fd: FormData): Promise<StatoLab> {
  const { sb } = await richiediStaff();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const nome = String(fd.get("nome") ?? "").trim() || null;
  if (!email.includes("@")) return { errore: "Email non valida." };
  const { error } = await sb.from("staff").insert({ email, nome });
  if (error) return { errore: error.code === "23505" ? "Questa email è già nello staff." : "Non sono riuscito ad aggiungerla." };
  revalidatePath("/lab/impostazioni");
  return { ok: `${email} ora vede il pannello laboratorio.` };
}
