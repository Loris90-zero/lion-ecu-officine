"use server";
import { revalidatePath } from "next/cache";
import { richiediStaff } from "@/lib/sessione";
import { STATI_CRM } from "./stati";

export type StatoCrmForm = { ok?: string; errore?: string };

export async function salvaCrm(_: StatoCrmForm, fd: FormData): Promise<StatoCrmForm> {
  const { sb } = await richiediStaff();
  const officina_id = String(fd.get("officina_id"));
  const stato = String(fd.get("stato"));
  const prossimo = String(fd.get("prossimo_contatto") ?? "").trim();
  if (!STATI_CRM.some((s) => s.v === stato)) return { errore: "Stato non valido." };
  if (prossimo && !/^\d{4}-\d{2}-\d{2}$/.test(prossimo)) return { errore: "Data non valida." };
  const { error } = await sb.from("officine_crm").upsert({
    officina_id, stato,
    note: String(fd.get("note") ?? "").trim().slice(0, 4000) || null,
    prossimo_contatto: prossimo || null,
    aggiornato_il: new Date().toISOString(),
  });
  if (error) return { errore: "Salvataggio non riuscito." };
  revalidatePath(`/lab/officine/${officina_id}`);
  revalidatePath("/lab/officine");
  return { ok: "Salvato." };
}
