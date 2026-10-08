"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { TIPI_MEZZO, FASCE } from "@/lib/fasi";

export type StatoRitiro = { errore?: string };

export async function creaPratica(_: StatoRitiro, fd: FormData): Promise<StatoRitiro> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/accedi");
  const { data: officina } = await sb.from("officine").select("id").eq("owner_id", user.id).maybeSingle();
  if (!officina) redirect("/registrazione");

  const t = (k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
  const num = (k: string) => { const n = Number(fd.get(k)); return isFinite(n) && n > 0 ? n : null; };
  const tipo = t("tipo_mezzo");
  const fascia = t("fascia_ritiro");
  const foto = fd.getAll("foto").map(String).filter((p) => p.startsWith(`${user.id}/`)).slice(0, 6);
  const dati = {
    officina_id: officina.id,
    tipo_mezzo: (TIPI_MEZZO as readonly string[]).includes(tipo) ? tipo : TIPI_MEZZO[0],
    mezzo: t("mezzo", 120),
    centralina: t("centralina", 120) || null,
    codice_etichetta: t("codice_etichetta", 80) || null,
    sintomo: t("sintomo", 1000),
    codici_errore: t("codici_errore", 300) || null,
    indirizzo_ritiro: t("indirizzo_ritiro", 200),
    giorno_ritiro: t("giorno_ritiro", 40) || "Domani",
    fascia_ritiro: (FASCE as readonly string[]).includes(fascia) ? fascia : FASCE[0],
    prezzo_stimato_eur: num("stima"),
    prezzo_nuovo_base_eur: num("base"),
    foto,
    accetta_preventivo: fd.get("accetta_preventivo") === "si",
    prezzo_accettato_eur: fd.get("accetta_preventivo") === "si" ? num("stima") : null,
  };
  if (!dati.accetta_preventivo) return { errore: "Per prenotare il ritiro spunta l'accettazione del preventivo." };
  if (!dati.mezzo || !dati.sintomo) return { errore: "Scrivi almeno marca e modello del mezzo e cosa succede." };
  if (!dati.indirizzo_ritiro) return { errore: "Manca l'indirizzo di ritiro." };
  const { data, error } = await sb.from("pratiche").insert(dati).select("id").single();
  if (error || !data) return { errore: "Non sono riuscito a registrare la richiesta. Riprova tra poco." };
  redirect(`/pratica/${data.id}?nuova=1`);
}
