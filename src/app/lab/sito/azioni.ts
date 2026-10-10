"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { richiediAdmin } from "@/lib/sessione";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { completa } from "@/lib/completa";
import { cercaCentralina } from "@/lib/cerca";
import { fontiPreferite } from "@/lib/riferimenti";
import { testiCentralina, bozzaGuida } from "@/lib/contenuti";
import { slugify, MEZZI } from "@/sito/config";
import type { Impostazioni } from "@/lib/prezzo";
import type { RisultatoCerca } from "@/lib/types";

export type StatoSito = { ok?: string; errore?: string };

function aggiorna(slug?: string) {
  revalidatePath("/lab/sito");
  revalidatePath("/sito", "layout");
  if (slug) revalidatePath(`/sito/centraline/${slug}`);
}

/** Crea la bozza di una pagina catalogo da una ricerca già fatta (o nuova, se serve). */
async function creaDaRisultato(r: RisultatoCerca, q: string, chiave: string | null) {
  const admin = supabaseAdmin();
  const { data: imp } = await admin.from("impostazioni").select("*").eq("id", 1).single();
  const c = await completa(admin, r, imp as Impostazioni, q, false);
  if (!c.trovata) return { errore: "La ricerca non ha identificato la centralina: non creo la pagina." };
  const titolo = [c.marca, c.modello || c.famiglia].filter(Boolean).join(" ").trim() || q;
  const guasti = (c.problemi_comuni ?? []).slice(0, 6).map((p) => ({ titolo: p.problema, sintomi: p.sintomi ?? "" }));
  let testi: Awaited<ReturnType<typeof testiCentralina>> = { descrizione: "", faq: [], mezzi: [] };
  try { testi = await testiCentralina({ titolo, tipo: c.tipo, marca: c.marca, famiglia: c.famiglia, veicoli: c.veicoli ?? [], guasti }); } catch { /* resta modificabile a mano */ }
  const base = slugify(`${titolo} ${c.codici?.[0] ?? ""}`) || slugify(q);
  let slug = base;
  for (let i = 2; (await admin.from("pagine_centraline").select("slug").eq("slug", slug).maybeSingle()).data; i++) slug = `${base}-${i}`;
  const { error } = await admin.from("pagine_centraline").insert({
    slug, titolo, codice: (c.codici ?? []).slice(0, 3).join(" / ") || q, marca: c.marca ?? null, famiglia: c.famiglia ?? null, tipo: c.tipo ?? null,
    veicoli: (c.veicoli ?? []).slice(0, 12), mezzi: testi.mezzi, descrizione: testi.descrizione, guasti, faq: testi.faq,
    prezzo_da: c.prezzo?.prezzo ?? null, prezzo_nuovo: c.prezzo?.base ?? null, ricerca_chiave: chiave,
  });
  if (error) return { errore: "Pagina non creata." };
  return { slug };
}

export async function creaDaRicerca(fd: FormData) {
  await richiediAdmin();
  const chiave = String(fd.get("chiave") ?? "");
  const { data } = await supabaseAdmin().from("ricerche").select("risultato").eq("chiave", chiave).not("risultato", "is", null).order("creato_il", { ascending: false }).limit(1).maybeSingle();
  if (!data?.risultato) return;
  const r = await creaDaRisultato(data.risultato as RisultatoCerca, chiave, chiave);
  aggiorna();
  if ("slug" in r && r.slug) redirect(`/lab/sito/centralina/${r.slug}`);
}

export async function creaDaCodice(_: StatoSito, fd: FormData): Promise<StatoSito> {
  await richiediAdmin();
  const q = String(fd.get("codice") ?? "").trim().slice(0, 80);
  if (q.length < 3) return { errore: "Scrivi un codice centralina." };
  const chiave = q.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const admin = supabaseAdmin();
  let { data } = await admin.from("ricerche").select("risultato").eq("chiave", chiave).not("risultato", "is", null).order("creato_il", { ascending: false }).limit(1).maybeSingle();
  if (!data?.risultato) {
    try {
      const grezzo = await cercaCentralina(q, undefined, await fontiPreferite(admin));
      await admin.from("ricerche").insert({ chiave, risultato: grezzo });
      data = { risultato: grezzo };
    } catch { return { errore: "Ricerca non riuscita. Riprova tra poco." }; }
  }
  const r = await creaDaRisultato(data.risultato as RisultatoCerca, q, chiave);
  if ("errore" in r) return { errore: r.errore };
  aggiorna();
  redirect(`/lab/sito/centralina/${r.slug}`);
}

const righe = (t: string) => t.split("\n").map((x) => x.trim()).filter(Boolean);
const num = (v: FormDataEntryValue | null) => { const n = Number(String(v ?? "").replace(/\./g, "").replace(",", ".")); return isFinite(n) && n > 0 ? n : null; };

export async function salvaCentralina(_: StatoSito, fd: FormData): Promise<StatoSito> {
  const { sb } = await richiediAdmin();
  const slug = String(fd.get("slug"));
  const azione = String(fd.get("azione") ?? "salva");
  const guasti = righe(String(fd.get("guasti") ?? "")).map((r) => { const [t, ...s] = r.split(":"); return { titolo: t.trim(), sintomi: s.join(":").trim() }; }).filter((g) => g.titolo);
  const faq = righe(String(fd.get("faq") ?? "")).map((r) => { const [d, ...a] = r.split("|"); return { domanda: d.trim(), risposta: a.join("|").trim() }; }).filter((f) => f.domanda && f.risposta);
  const dati = {
    titolo: String(fd.get("titolo") ?? "").trim().slice(0, 140),
    codice: String(fd.get("codice") ?? "").trim().slice(0, 120) || null,
    tipo: String(fd.get("tipo") ?? "").trim().slice(0, 80) || null,
    descrizione: String(fd.get("descrizione") ?? "").trim().slice(0, 800) || null,
    veicoli: String(fd.get("veicoli") ?? "").split(",").map((v) => v.trim()).filter(Boolean).slice(0, 20),
    mezzi: fd.getAll("mezzi").map(String).filter((m) => MEZZI.some((x) => x.slug === m)),
    guasti, faq, prezzo_da: num(fd.get("prezzo_da")), prezzo_nuovo: num(fd.get("prezzo_nuovo")),
    aggiornato_il: new Date().toISOString(),
    ...(azione === "pubblica" ? { stato: "pubblicata" } : azione === "ritira" ? { stato: "bozza" } : {}),
  };
  if (!dati.titolo) return { errore: "Il titolo non può essere vuoto." };
  if (azione === "elimina") { await sb.from("pagine_centraline").delete().eq("slug", slug); aggiorna(slug); redirect("/lab/sito"); }
  const { error } = await sb.from("pagine_centraline").update(dati).eq("slug", slug);
  if (error) return { errore: "Non salvata." };
  aggiorna(slug);
  return { ok: azione === "pubblica" ? "Pubblicata sul sito." : azione === "ritira" ? "Tolta dal sito (resta in bozza)." : "Salvata." };
}

export async function creaGuida(_: StatoSito, fd: FormData): Promise<StatoSito> {
  const { sb } = await richiediAdmin();
  const argomento = String(fd.get("argomento") ?? "").trim().slice(0, 300);
  const centralina = String(fd.get("centralina") ?? "") || null;
  if (argomento.length < 8) return { errore: "Scrivi l'argomento della guida, per esempio «Iveco Stralis in recovery: la centralina motore»." };
  let contesto = "";
  if (centralina) {
    const { data } = await sb.from("pagine_centraline").select("titolo, codice, guasti, veicoli").eq("slug", centralina).maybeSingle();
    if (data) contesto = JSON.stringify(data);
  }
  // Casi reali dalla banca dati interventi, se ci sono
  const { data: casi } = await sb.from("interventi").select("centralina, struttura").not("struttura", "is", null).limit(5);
  if (casi?.length) contesto += "\nCasi riparati in laboratorio: " + JSON.stringify(casi.map((c) => ({ centralina: c.centralina, ...(c.struttura as object) }))).slice(0, 2000);
  let g;
  try { g = await bozzaGuida(argomento, contesto); } catch { return { errore: "La bozza non è stata scritta. Riprova tra poco." }; }
  const base = slugify(g.titolo) || slugify(argomento);
  let slug = base;
  for (let i = 2; (await sb.from("articoli").select("slug").eq("slug", slug).maybeSingle()).data; i++) slug = `${base}-${i}`;
  const { error } = await sb.from("articoli").insert({ slug, titolo: g.titolo, sommario: g.sommario, corpo: g.corpo, centralina_slug: centralina });
  if (error) return { errore: "Bozza non salvata." };
  revalidatePath("/lab/sito");
  redirect(`/lab/sito/guida/${slug}`);
}

export async function salvaGuida(_: StatoSito, fd: FormData): Promise<StatoSito> {
  const { sb } = await richiediAdmin();
  const slug = String(fd.get("slug"));
  const azione = String(fd.get("azione") ?? "salva");
  if (azione === "elimina") { await sb.from("articoli").delete().eq("slug", slug); revalidatePath("/lab/sito"); revalidatePath("/sito/guasti"); redirect("/lab/sito"); }
  const dati = {
    titolo: String(fd.get("titolo") ?? "").trim().slice(0, 140),
    sommario: String(fd.get("sommario") ?? "").trim().slice(0, 200) || null,
    corpo: String(fd.get("corpo") ?? "").trim().slice(0, 30000),
    aggiornato_il: new Date().toISOString(),
    ...(azione === "pubblica" ? { stato: "pubblicata", pubblicato_il: new Date().toISOString() } : azione === "ritira" ? { stato: "bozza" } : {}),
  };
  if (!dati.titolo || dati.corpo.length < 50) return { errore: "Servono titolo e testo." };
  const { error } = await sb.from("articoli").update(dati).eq("slug", slug);
  if (error) return { errore: "Non salvata." };
  revalidatePath("/lab/sito"); revalidatePath("/sito/guasti"); revalidatePath(`/sito/guasti/${slug}`);
  return { ok: azione === "pubblica" ? "Pubblicata sul sito." : azione === "ritira" ? "Tolta dal sito." : "Salvata." };
}
