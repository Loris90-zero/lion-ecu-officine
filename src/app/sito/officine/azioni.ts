"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notificaStaff } from "@/lib/notifiche";
import { percorri, valuta } from "@/sito/quiz";
import { SOGLIA_CALDO } from "@/sito/score";
import { app } from "@/sito/config";
import { classifica } from "@/lib/attribuzione";
import { attribuzioneCorrente } from "@/lib/attribuzione-server";

export type StatoQuiz = { errore?: string };

/**
 * Fine del questionario sul sito: salva subito contatto e score, poi porta all'app per creare l'accesso
 * (link via email o Google). Nome, officina e cellulare li chiede l'app, una volta sola.
 */
export async function concludiQuiz(_: StatoQuiz, fd: FormData): Promise<StatoQuiz> {
  if (String(fd.get("sito_web") ?? "")) return {};
  const t = (k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
  const via = t("via", 10) === "google" ? "google" : "email";
  const email = t("email").toLowerCase();
  if (via === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { errore: "Scrivi un indirizzo email valido." };
  if (fd.get("privacy") !== "on") return { errore: "Per continuare accetta l'informativa privacy." };
  let grezze = {};
  try { grezze = JSON.parse(String(fd.get("quiz") ?? "{}")); } catch { /* vuoto */ }
  const p = percorri(grezze);
  if (!p.completo) return { errore: "Completa prima il questionario." };
  const { score, profilo } = valuta(p.risposte);
  const o = t("origine", 30);
  const origine = ["sito_partner", "sito_prenota"].includes(o) ? o : "sito_quiz";
  const prenota = Object.fromEntries(["centralina", "codice", "stima", "base"].map((k) => [k, t(`ritiro_${k}`, 120)]).filter(([, v]) => v));
  const h = await headers();
  const utm = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid", "t"].map((k) => [k, t(k)]).filter(([, v]) => v));
  const attr = (Object.keys(utm).length ? classifica(new URLSearchParams(utm as Record<string, string>), null, "/sito/officine") : null) ?? (await attribuzioneCorrente());
  const admin = supabaseAdmin();
  const { data, error } = await admin.from("lead").insert({
    email: email || null, risposte: { flusso: p.risposte, profilo, ...(Object.keys(prenota).length ? { prenota } : {}) }, score, origine,
    utm: attr ? { ...attr, ref_pagina: h.get("referer") } : null,
  }).select("token").single();
  if (error || !data) return { errore: "Non siamo riusciti a salvare le risposte. Riprova tra poco." };
  await notificaStaff(admin, {
    per_ruolo: "admin", tipo: "lead",
    titolo: `${Object.keys(prenota).length ? "Vuole prenotare un ritiro · " : ""}${score >= SOGLIA_CALDO ? `contatto caldo, score ${score}` : `questionario completato, score ${score}`}`.replace(/^./, (c) => c.toUpperCase()),
    testo: `${email || "Accesso con Google in corso"}. ${profilo.riassunto}`,
    link: "/lab/officine",
  });
  const q = new URLSearchParams({ lead: data.token, via });
  if (email) q.set("email", email);
  redirect(app(`/accedi?${q.toString()}`));
}
