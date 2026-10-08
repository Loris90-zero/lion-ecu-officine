"use server";
import { revalidatePath } from "next/cache";
import { richiediStaff } from "@/lib/sessione";

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
  const { error } = await sb.from("pratiche").update({
    fase,
    esito,
    prezzo_confermato_eur: esito === "riparabile" ? prezzoNum : null,
    nota_laboratorio: t("nota_laboratorio"),
    guasto_riparato: t("guasto_riparato"),
    corriere: t("corriere"),
    tracking: t("tracking"),
    ...(fd.get("pagato_manuale") === "on" ? { pagato: true, pagato_il: new Date().toISOString() } : {}),
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
  if (!(percentuale > 0 && percentuale < 1)) return { errore: "La percentuale deve essere tra 1 e 99." };
  if (!(minimo_eur >= 0) || !(arrotonda_eur >= 1)) return { errore: "Controlla minimo e arrotondamento." };
  if (!["mediana", "minimo", "massimo"].includes(base)) return { errore: "Base non valida." };
  const { error } = await sb.from("impostazioni").update({ percentuale, minimo_eur, arrotonda_eur, base, aggiornato_il: new Date().toISOString() }).eq("id", 1);
  if (error) return { errore: "Salvataggio non riuscito." };
  revalidatePath("/lab/impostazioni");
  return { ok: "Impostazioni salvate. Valgono dalla prossima ricerca." };
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
