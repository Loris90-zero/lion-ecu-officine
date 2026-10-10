"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DOMANDE, calcolaScore, SOGLIA_CALDO, type Risposte } from "@/sito/score";
import { notificaStaff } from "@/lib/notifiche";

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
    email: t("email") || user.email || null,
    consenso_whatsapp: fd.get("consenso_whatsapp") === "on",
  };
  if (!dati.ragione_sociale || !dati.referente || !dati.telefono || !dati.email)
    return { errore: "Servono nome dell'officina, il tuo nome, cellulare ed email." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dati.email)) return { errore: "Controlla l'indirizzo email." };
  if (fd.get("privacy") !== "on") return { errore: "Per continuare accetta l'informativa privacy." };
  // Questionario di scoring: obbligatorio, salvo se l'ha già fatto sul sito con la stessa email
  const admin = supabaseAdmin();
  const email = String(dati.email).toLowerCase();
  const { data: lead } = await admin.from("lead").select("id, score").eq("email", email).is("officina_id", null).order("creato_il", { ascending: false }).limit(1).maybeSingle();
  let risposte: Risposte | null = null;
  if (!lead) {
    risposte = {};
    for (const d of DOMANDE) {
      const valide = d.opzioni.map(([v]) => v as string);
      if (d.multipla) risposte[d.id] = fd.getAll(d.id).map(String).filter((v) => valide.includes(v));
      else { const v = String(fd.get(d.id) ?? ""); if (valide.includes(v)) risposte[d.id] = v; }
    }
    const mancanti = DOMANDE.filter((d) => (d.multipla ? !(risposte![d.id] as string[]).length : !risposte![d.id]));
    if (mancanti.length) return { errore: `Rispondi anche a: ${mancanti.map((d) => d.testo).join(" · ")}` };
  }
  const { data: nuova, error } = await sb.from("officine").insert(dati).select("id").single();
  if (error || !nuova) return { errore: "Non sono riuscito a salvare i dati. Riprova tra poco." };
  // Lo score va sul profilo: dal quiz del sito, oppure da quello appena compilato
  let score: number;
  if (lead) {
    score = lead.score;
    await admin.from("lead").update({ officina_id: nuova.id }).eq("id", lead.id);
  } else {
    score = calcolaScore(risposte!);
    await admin.from("lead").insert({ nome_officina: dati.ragione_sociale, nome: dati.referente, telefono: dati.telefono, email, risposte, score, origine: "app_registrazione", officina_id: nuova.id });
  }
  await admin.from("officine").update({ score }).eq("id", nuova.id);
  await notificaStaff(admin, {
    per_ruolo: "admin", tipo: "lead",
    titolo: score >= SOGLIA_CALDO ? `Officina calda registrata: score ${score}` : `Nuova officina registrata: score ${score}`,
    testo: `${dati.ragione_sociale}: ${dati.referente}, ${dati.telefono}.`, link: `/lab/officine/${nuova.id}`,
  });
  redirect("/?benvenuto=1");
}
