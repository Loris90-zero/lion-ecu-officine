"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
  const { data: nuova, error } = await sb.from("officine").insert(dati).select("id").single();
  if (error || !nuova) return { errore: "Non sono riuscito a salvare i dati. Riprova tra poco." };
  // Se l'officina aveva fatto il quiz sul sito, il suo score passa sul profilo
  const admin = supabaseAdmin();
  const { data: lead } = await admin.from("lead").select("id, score").eq("email", String(dati.email).toLowerCase()).is("officina_id", null).order("creato_il", { ascending: false }).limit(1).maybeSingle();
  if (lead) {
    await admin.from("lead").update({ officina_id: nuova.id }).eq("id", lead.id);
    await admin.from("officine").update({ score: lead.score }).eq("id", nuova.id);
  }
  redirect("/?benvenuto=1");
}
