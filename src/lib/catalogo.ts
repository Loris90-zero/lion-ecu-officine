import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { completa } from "@/lib/completa";
import { testiCentralina } from "@/lib/contenuti";
import { slugify } from "@/sito/config";
import type { Impostazioni } from "@/lib/prezzo";
import type { RisultatoCerca } from "@/lib/types";

/** Crea la bozza di una pagina catalogo da una ricerca già fatta (o nuova, se serve). */
export async function creaDaRisultato(r: RisultatoCerca, q: string, chiave: string | null) {
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


/** Esiste già una pagina (bozza o pubblicata) per questa ricerca o questo codice? */
export async function paginaPerChiave(chiave: string) {
  const { data } = await supabaseAdmin().from("pagine_centraline").select("slug, stato").eq("ricerca_chiave", chiave).limit(1).maybeSingle();
  return data as { slug: string; stato: string } | null;
}
