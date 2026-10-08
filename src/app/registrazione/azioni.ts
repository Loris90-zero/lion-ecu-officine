"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

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
  const { error } = await sb.from("officine").insert(dati);
  if (error) return { errore: "Non sono riuscito a salvare i dati. Riprova tra poco." };
  redirect("/?benvenuto=1");
}
