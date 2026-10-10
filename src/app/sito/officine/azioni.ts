"use server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notificaStaff } from "@/lib/notifiche";
import { DOMANDE, calcolaScore, SOGLIA_CALDO, type Risposte } from "@/sito/score";

export type StatoQuiz = { errore?: string; ok?: boolean; email?: string };

export async function inviaQuiz(_: StatoQuiz, fd: FormData): Promise<StatoQuiz> {
  if (String(fd.get("sito_web") ?? "")) return { ok: true }; // campo trappola per i bot
  const t = (k: string, max = 120) => String(fd.get(k) ?? "").trim().slice(0, max);
  const nome_officina = t("nome_officina"), nome = t("nome"), telefono = t("telefono", 30), email = t("email").toLowerCase(), provincia = t("provincia", 40);
  if (!nome_officina || !nome || !telefono) return { errore: "Scrivi nome dell'officina, il tuo nome e il cellulare." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { errore: "Controlla l'indirizzo email." };
  if (fd.get("privacy") !== "on") return { errore: "Per continuare accetta l'informativa privacy." };
  const risposte: Risposte = {};
  for (const d of DOMANDE) {
    const valide = d.opzioni.map(([v]) => v as string);
    if (d.multipla) risposte[d.id] = fd.getAll(d.id).map(String).filter((v) => valide.includes(v));
    else { const v = String(fd.get(d.id) ?? ""); if (valide.includes(v)) risposte[d.id] = v; }
  }
  const score = calcolaScore(risposte);
  const h = await headers();
  const utm = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid"].map((k) => [k, t(k, 200)]).filter(([, v]) => v));
  const admin = supabaseAdmin();
  const { error } = await admin.from("lead").insert({ nome_officina, nome, telefono, email, provincia: provincia || null, risposte, score, origine: "sito_quiz", utm: Object.keys(utm).length ? { ...utm, ref: h.get("referer") } : null });
  if (error) return { errore: "Invio non riuscito. Riprova tra poco." };
  await notificaStaff(admin, {
    per_ruolo: "admin",
    tipo: "lead",
    titolo: score >= SOGLIA_CALDO ? `Officina calda: score ${score}` : `Nuova officina dal sito: score ${score}`,
    testo: `${nome_officina}${provincia ? ` (${provincia})` : ""}: ${nome}, ${telefono}.`,
    link: "/lab/officine",
  });
  return { ok: true, email };
}
