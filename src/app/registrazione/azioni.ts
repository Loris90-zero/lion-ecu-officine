"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { percorri, valuta } from "@/sito/quiz";
import { SOGLIA_CALDO } from "@/sito/score";
import { notificaStaff } from "@/lib/notifiche";
import { attribuzioneCorrente } from "@/lib/attribuzione-server";

export type StatoForm = { errore?: string };

export async function creaOfficina(_: StatoForm, fd: FormData): Promise<StatoForm> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/accedi");
  const t = (k: string) => String(fd.get(k) ?? "").trim();
  const dati = {
    owner_id: user.id,
    ragione_sociale: t("ragione_sociale"),
    referente: t("referente"),
    telefono: t("telefono"),
    email: user.email || t("email") || null,
    consenso_whatsapp: fd.get("consenso_whatsapp") === "on",
  };
  if (!dati.ragione_sociale || !dati.referente || !dati.telefono || !dati.email)
    return { errore: "Servono nome dell'officina, il tuo nome e il cellulare." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dati.email)) return { errore: "Controlla l'indirizzo email." };
  if (fd.get("privacy") !== "on") return { errore: "Per continuare accetta l'informativa privacy." };
  // Questionario di scoring: obbligatorio, salvo se l'ha già fatto sul sito con la stessa email
  const admin = supabaseAdmin();
  const email = String(dati.email).toLowerCase();
  const token = String(fd.get("lead") ?? "");
  let lead: { id: number; score: number; utm: Record<string, unknown> | null; risposte: { prenota?: Record<string, string> } | null } | null = null;
  if (/^[0-9a-f-]{36}$/i.test(token)) lead = (await admin.from("lead").select("id, score, risposte, utm").eq("token", token).is("officina_id", null).maybeSingle()).data;
  if (!lead) lead = (await admin.from("lead").select("id, score, risposte, utm").eq("email", email).is("officina_id", null).order("creato_il", { ascending: false }).limit(1).maybeSingle()).data;
  let quiz: ReturnType<typeof valuta> | null = null;
  let flusso: Record<string, unknown> | null = null;
  if (!lead) {
    let grezze = {};
    try { grezze = JSON.parse(String(fd.get("quiz") ?? "{}")); } catch { /* vuoto */ }
    const p = percorri(grezze);
    if (!p.completo) return { errore: "Completa il questionario: mancano ancora alcune risposte." };
    quiz = valuta(p.risposte);
    flusso = p.risposte;
  }
  const attr = lead?.utm ?? (await attribuzioneCorrente());
  const { data: nuova, error } = await sb.from("officine").insert(dati).select("id").single();
  if (error || !nuova) return { errore: "Non sono riuscito a salvare i dati. Riprova tra poco." };
  // Lo score va sul profilo: dal quiz del sito, oppure da quello appena compilato
  let score: number;
  if (lead) {
    score = lead.score;
    await admin.from("lead").update({ officina_id: nuova.id, email, nome_officina: dati.ragione_sociale, nome: dati.referente, telefono: dati.telefono }).eq("id", lead.id);
  } else {
    score = quiz!.score;
    await admin.from("lead").insert({ nome_officina: dati.ragione_sociale, nome: dati.referente, telefono: dati.telefono, email, risposte: { flusso, profilo: quiz!.profilo }, score, origine: "app_registrazione", officina_id: nuova.id, utm: attr });
  }
  await admin.from("officine").update({ score, utm: attr }).eq("id", nuova.id);
  await notificaStaff(admin, {
    per_ruolo: "admin", tipo: "lead",
    titolo: score >= SOGLIA_CALDO ? `Officina calda registrata: score ${score}` : `Nuova officina registrata: score ${score}`,
    testo: `${dati.ragione_sociale}: ${dati.referente}, ${dati.telefono}.${quiz ? ` ${quiz.profilo.riassunto}` : ""}`, link: `/lab/officine/${nuova.id}`,
  });
  const prenota = lead?.risposte?.prenota;
  if (prenota && Object.keys(prenota).length) {
    const q = new URLSearchParams({ ritiro: "1", benvenuto: "1" });
    for (const k of ["centralina", "codice", "stima", "base"]) if (prenota[k]) q.set(k, String(prenota[k]).slice(0, 120));
    redirect(`/?${q.toString()}`);
  }
  redirect("/installa?benvenuto=1");
}
