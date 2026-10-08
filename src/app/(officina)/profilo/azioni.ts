"use server";
import { revalidatePath } from "next/cache";
import { richiediOfficina } from "@/lib/sessione";
import { TIPI_MEZZO } from "@/lib/fasi";

export type StatoProfilo = { ok?: string; errore?: string };

export async function salvaProfilo(_: StatoProfilo, fd: FormData): Promise<StatoProfilo> {
  const { sb, officina } = await richiediOfficina();
  const t = (k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
  const dati = {
    ragione_sociale: t("ragione_sociale"),
    partita_iva: t("partita_iva").replace(/\s/g, "") || null,
    referente: t("referente"),
    telefono: t("telefono", 40),
    email: t("email") || null,
    indirizzo_ritiro: t("indirizzo_ritiro") || null,
    citta: t("citta") || null,
    sede_legale: t("sede_legale") || null,
    pec: t("pec").toLowerCase() || null,
    codice_sdi: t("codice_sdi", 7).toUpperCase() || null,
    orari_ritiro: t("orari_ritiro", 300) || null,
    mezzi: fd.getAll("mezzi").map(String).filter((m) => (TIPI_MEZZO as readonly string[]).includes(m)),
    consenso_whatsapp: fd.get("consenso_whatsapp") === "on",
  };
  if (!dati.ragione_sociale || !dati.referente || !dati.telefono)
    return { errore: "Nome dell'officina, referente e cellulare non possono restare vuoti." };
  if (dati.partita_iva && !/^\d{11}$/.test(dati.partita_iva)) return { errore: "La partita IVA deve avere 11 cifre." };
  if (dati.codice_sdi && !/^[A-Z0-9]{7}$/.test(dati.codice_sdi)) return { errore: "Il codice SDI deve avere 7 caratteri (lettere e numeri)." };
  if (dati.pec && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dati.pec)) return { errore: "Controlla l'indirizzo PEC." };
  if (dati.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dati.email)) return { errore: "Controlla l'indirizzo email." };
  const { error } = await sb.from("officine").update(dati).eq("id", officina.id);
  if (error) return { errore: "Salvataggio non riuscito. Riprova tra poco." };
  revalidatePath("/profilo");
  revalidatePath("/", "layout");
  return { ok: "Dati salvati." };
}

export async function salvaFatturazione(_: StatoProfilo, fd: FormData): Promise<StatoProfilo> {
  const { sb, officina } = await richiediOfficina();
  const t = (k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
  const dati = {
    ragione_sociale: t("ragione_sociale") || officina.ragione_sociale,
    partita_iva: t("partita_iva").replace(/\s/g, "").replace(/^IT/i, ""),
    sede_legale: t("sede_legale"),
    codice_sdi: t("codice_sdi", 7).toUpperCase() || null,
    pec: t("pec").toLowerCase() || null,
  };
  if (!/^\d{11}$/.test(dati.partita_iva)) return { errore: "La partita IVA deve avere 11 cifre." };
  if (!dati.sede_legale) return { errore: "Scrivi la sede legale (via, numero, CAP, città)." };
  if (!dati.codice_sdi && !dati.pec) return { errore: "Serve il codice SDI oppure la PEC per la fattura elettronica." };
  if (dati.codice_sdi && !/^[A-Z0-9]{7}$/.test(dati.codice_sdi)) return { errore: "Il codice SDI deve avere 7 caratteri (lettere e numeri)." };
  if (dati.pec && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dati.pec)) return { errore: "Controlla l'indirizzo PEC." };
  const { error } = await sb.from("officine").update(dati).eq("id", officina.id);
  if (error) return { errore: "Salvataggio non riuscito. Riprova tra poco." };
  revalidatePath("/", "layout");
  return { ok: "Dati di fatturazione salvati." };
}
