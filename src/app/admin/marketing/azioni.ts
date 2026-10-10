"use server";
import { revalidatePath } from "next/cache";
import { richiediTitolare } from "@/lib/sessione";
import { oraRoma } from "@/lib/marketing";
import { trovaAttivita, bozzaSequenza, type Passo } from "@/lib/prospezione";

export type Esito = { ok?: string; errore?: string };
const t = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const PIATT = ["meta", "google", "tiktok", "linkedin", "altro"];
const TARGET = ["officine", "flotte", "partner", "tutti"];

/** Spesa ads inserita a mano, finché i connettori non la portano da soli. */
export async function salvaSpesa(_: Esito, fd: FormData): Promise<Esito> {
  const { sb } = await richiediTitolare();
  const giorno = t(fd, "giorno", 10), piattaforma = t(fd, "piattaforma", 20), target = t(fd, "target", 20);
  const spesa = Number(t(fd, "spesa", 20).replace(",", "."));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(giorno)) return { errore: "Scegli il giorno." };
  if (!PIATT.includes(piattaforma) || !TARGET.includes(target)) return { errore: "Scegli piattaforma e target." };
  if (!isFinite(spesa) || spesa < 0) return { errore: "Scrivi la spesa in euro." };
  const num = (k: string) => { const v = Number(t(fd, k, 12)); return isFinite(v) && v > 0 ? Math.round(v) : null; };
  const { error } = await sb.from("marketing_spesa").upsert({
    giorno, piattaforma, target, campagna: t(fd, "campagna", 80), spesa_eur: spesa,
    click: num("click"), impression: num("impression"), lead_piattaforma: num("lead"), fonte: "manuale",
  }, { onConflict: "giorno,piattaforma,campagna" });
  if (error) return { errore: "Non salvata. Riprova." };
  revalidatePath("/admin/marketing", "layout");
  return { ok: "Spesa salvata." };
}

export async function eliminaSpesa(fd: FormData) {
  const { sb } = await richiediTitolare();
  await sb.from("marketing_spesa").delete().eq("id", Number(fd.get("id")));
  revalidatePath("/admin/marketing", "layout");
}

/** Post nel calendario social. Li pubblica Metricool quando è collegato. */
export async function salvaPost(_: Esito, fd: FormData): Promise<Esito> {
  const { sb } = await richiediTitolare();
  const testo = t(fd, "testo", 2200);
  const canali = fd.getAll("canali").map(String).filter((c) => ["instagram", "facebook", "tiktok", "linkedin", "youtube"].includes(c));
  const quando = t(fd, "quando", 20);
  if (!testo) return { errore: "Scrivi il testo del post." };
  if (!canali.length) return { errore: "Scegli almeno un canale." };
  const data = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(quando) ? oraRoma(quando) : null;
  const { error } = await sb.from("social_post").insert({
    testo, canali, media_url: t(fd, "media", 400) || null,
    programmato_il: data && !isNaN(+data) ? data.toISOString() : null, stato: data ? "programmato" : "bozza",
  });
  if (error) return { errore: "Non salvato. Riprova." };
  revalidatePath("/admin/marketing/social");
  return { ok: data ? "Post messo in calendario." : "Bozza salvata." };
}

export async function eliminaPost(fd: FormData) {
  const { sb } = await richiediTitolare();
  await sb.from("social_post").delete().eq("id", Number(fd.get("id")));
  revalidatePath("/admin/marketing/social");
}

/** L'AI cerca online le attività di una zona e le aggiunge alla lista (senza doppioni). */
export async function cercaProspect(_: Esito, fd: FormData): Promise<Esito> {
  const { sb } = await richiediTitolare();
  const zona = t(fd, "zona", 80), categoria = t(fd, "categoria", 20);
  if (zona.length < 2) return { errore: "Scrivi una provincia o una città." };
  if (!["officine", "flotte", "partner"].includes(categoria)) return { errore: "Scegli cosa cercare." };
  if (!process.env.ANTHROPIC_API_KEY) return { errore: "Manca la chiave dell'AI sul server." };
  let trovati;
  try { trovati = await trovaAttivita(zona, categoria); } catch { return { errore: "La ricerca non è riuscita. Riprova tra poco." }; }
  const { data: ric } = await sb.from("ricerche_prospect").insert({ zona, categoria, trovati: trovati.length }).select("id").single();
  let nuovi = 0;
  for (const r of trovati) {
    const { error } = await sb.from("prospect").insert({
      nome: r.nome, categoria, citta: r.citta ?? null, provincia: r.provincia ?? null, indirizzo: r.indirizzo ?? null,
      telefono: r.telefono ?? null, email: r.email ?? null, sito: r.sito ?? null, fonte: "ricerca_ai", fonte_url: r.fonte_url ?? null,
      note: r.note ?? null, ricerca_id: ric?.id ?? null,
    });
    if (!error) nuovi++;
  }
  if (ric) await sb.from("ricerche_prospect").update({ nuovi }).eq("id", ric.id);
  revalidatePath("/admin/marketing/prospezione");
  return { ok: trovati.length ? `Trovate ${trovati.length} attività a ${zona}: ${nuovi} nuove in lista${trovati.length - nuovi ? `, ${trovati.length - nuovi} c'erano già` : ""}.` : `Nessuna attività trovata a ${zona}. Prova con la provincia intera.` };
}

export async function aggiungiProspect(_: Esito, fd: FormData): Promise<Esito> {
  const { sb } = await richiediTitolare();
  const nome = t(fd, "nome", 120);
  if (!nome) return { errore: "Scrivi il nome dell'attività." };
  const email = t(fd, "email", 120).toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { errore: "Controlla l'email." };
  const { error } = await sb.from("prospect").insert({ nome, categoria: t(fd, "categoria", 20) || "officine", citta: t(fd, "citta", 60) || null, telefono: t(fd, "telefono", 30) || null, email, fonte: "manuale" });
  if (error) return { errore: error.code === "23505" ? "C'è già un contatto con questa email o questo telefono." : "Non salvato." };
  revalidatePath("/admin/marketing/prospezione");
  return { ok: "Aggiunto." };
}

/** Stato del contatto, o inserimento in una sequenza email. */
export async function aggiornaProspect(fd: FormData) {
  const { sb } = await richiediTitolare();
  const id = Number(fd.get("id")), azione = String(fd.get("azione") ?? "");
  if (azione === "sequenza") {
    const seq = Number(fd.get("sequenza_id"));
    if (seq) await sb.from("prospect").update({ sequenza_id: seq, passo: 0, stato: "in_sequenza", prossimo_invio: new Date().toISOString() }).eq("id", id).not("email", "is", null).in("stato", ["nuovo", "risposto"]);
  } else if (["interessato", "escluso", "risposto", "nuovo"].includes(azione)) {
    await sb.from("prospect").update({ stato: azione, ...(azione !== "nuovo" ? { prossimo_invio: null } : {}) }).eq("id", id);
    if (azione === "risposto") await sb.from("prospect_attivita").insert({ prospect_id: id, tipo: "risposta" });
  } else if (azione === "opposizioni") {
    await sb.from("prospect").update({ opposizione_verificata: true }).eq("id", id);
  }
  revalidatePath("/admin/marketing/prospezione");
}

/** Tutti i nuovi con email entrano nella sequenza scelta. */
export async function avviaSequenzaPerTutti(fd: FormData) {
  const { sb } = await richiediTitolare();
  const seq = Number(fd.get("sequenza_id")), categoria = String(fd.get("categoria") ?? "");
  if (!seq) return;
  let q = sb.from("prospect").update({ sequenza_id: seq, passo: 0, stato: "in_sequenza", prossimo_invio: new Date().toISOString() }).eq("stato", "nuovo").not("email", "is", null);
  if (categoria) q = q.eq("categoria", categoria);
  await q;
  revalidatePath("/admin/marketing/prospezione");
}

export async function creaSequenzaAI(_: Esito, fd: FormData): Promise<Esito> {
  const { sb } = await richiediTitolare();
  const target = t(fd, "target", 20) || "officine", nome = t(fd, "nome", 80) || `Sequenza ${target}`;
  let passi: Passo[] = [];
  try { passi = await bozzaSequenza(target, t(fd, "idea", 500)); } catch { /* sotto */ }
  if (!passi.length) return { errore: "L'AI non è riuscita a scrivere la sequenza. Riprova." };
  const { error } = await sb.from("sequenze").insert({ nome, target, passi, attiva: false });
  if (error) return { errore: "Non salvata." };
  revalidatePath("/admin/marketing/prospezione");
  return { ok: "Bozza pronta: rileggila e attivala quando ti convince." };
}

export async function salvaSequenza(_: Esito, fd: FormData): Promise<Esito> {
  const { sb } = await richiediTitolare();
  const id = Number(fd.get("id"));
  const n = Number(fd.get("n")) || 0;
  const passi: Passo[] = [];
  for (let i = 0; i < n; i++) {
    const oggetto = t(fd, `oggetto_${i}`, 140), testo = t(fd, `testo_${i}`, 2000);
    if (oggetto && testo) passi.push({ giorno: Math.max(0, Number(t(fd, `giorno_${i}`, 3)) || 0), canale: "email", oggetto, testo });
  }
  passi.sort((a, b) => a.giorno - b.giorno);
  const { error } = await sb.from("sequenze").update({ nome: t(fd, "nome", 80), passi, attiva: fd.get("attiva") === "on" }).eq("id", id);
  if (error) return { errore: "Non salvata." };
  revalidatePath("/admin/marketing/prospezione");
  return { ok: "Sequenza salvata." };
}
