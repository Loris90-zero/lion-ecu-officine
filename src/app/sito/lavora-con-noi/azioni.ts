"use server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notificaStaff } from "@/lib/notifiche";

export type StatoCand = { ok?: boolean; errore?: string };

export async function inviaCandidatura(_: StatoCand, fd: FormData): Promise<StatoCand> {
  if (String(fd.get("sito_web") ?? "")) return { ok: true };
  const t = (k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
  const nome = t("nome", 80), email = t("email").toLowerCase(), telefono = t("telefono", 30), ruolo = t("ruolo", 40), messaggio = t("messaggio", 2000);
  if (!nome || !["tecnico", "venditore", "altro"].includes(ruolo)) return { errore: "Scrivi il nome e scegli il ruolo." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { errore: "Controlla l'indirizzo email." };
  if (fd.get("privacy") !== "on") return { errore: "Per continuare accetta l'informativa privacy." };
  const admin = supabaseAdmin();
  const { error } = await admin.from("candidature").insert({ nome, email, telefono: telefono || null, ruolo, messaggio: messaggio || null });
  if (error) return { errore: "Invio non riuscito. Riprova tra poco." };
  await notificaStaff(admin, { per_ruolo: "admin", tipo: "candidatura", titolo: `Nuova candidatura: ${ruolo}`, testo: `${nome}, ${email}${telefono ? `, ${telefono}` : ""}`, link: "/admin/accessi" });
  return { ok: true };
}
