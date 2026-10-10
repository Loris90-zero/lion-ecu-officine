"use server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notificaStaff } from "@/lib/notifiche";
import { attribuzioneCorrente } from "@/lib/attribuzione-server";

export type StatoFlotta = { ok?: boolean; errore?: string };

/** Contatto da flotte e aziende di trasporto: entra nei lead con origine «flotta». */
export async function inviaFlotta(_: StatoFlotta, fd: FormData): Promise<StatoFlotta> {
  if (String(fd.get("sito_web") ?? "")) return { ok: true };
  const t = (k: string, max = 120) => String(fd.get(k) ?? "").trim().slice(0, max);
  const azienda = t("azienda"), nome = t("nome"), telefono = t("telefono", 30), email = t("email").toLowerCase(), mezzi = t("mezzi", 20), provincia = t("provincia", 40);
  if (!azienda || !nome || !telefono) return { errore: "Scrivi azienda, nome e cellulare." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { errore: "Controlla l'indirizzo email." };
  if (fd.get("privacy") !== "on") return { errore: "Per continuare accetta l'informativa privacy." };
  const n = Number(mezzi) || 0;
  const score = Math.min(100, n >= 50 ? 90 : n >= 20 ? 75 : n >= 5 ? 55 : 35);
  const admin = supabaseAdmin();
  const { error } = await admin.from("lead").insert({ nome_officina: azienda, nome, telefono, email, provincia: provincia || null, risposte: { tipo: "flotta", mezzi: n }, score, origine: "sito_flotta", utm: await attribuzioneCorrente() });
  if (error) return { errore: "Invio non riuscito. Riprova tra poco." };
  await notificaStaff(admin, { per_ruolo: "admin", tipo: "lead", titolo: `Flotta dal sito: ${azienda}${n ? `, ${n} mezzi` : ""}`, testo: `${nome}, ${telefono}${provincia ? `, ${provincia}` : ""}.`, link: "/lab/officine" });
  return { ok: true };
}
