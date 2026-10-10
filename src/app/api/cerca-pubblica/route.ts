import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cercaCentralina } from "@/lib/cerca";
import { completa } from "@/lib/completa";
import { fontiPreferite } from "@/lib/riferimenti";
import { creaDaRisultato, paginaPerChiave } from "@/lib/catalogo";
import { notificaStaff } from "@/lib/notifiche";
import type { Impostazioni } from "@/lib/prezzo";
import type { RisultatoCerca } from "@/lib/types";

export const maxDuration = 120;

/** Solo quello che serve al visitatore: niente fonti, link o prezzi dei singoli negozi. */
function pubblico(r: RisultatoCerca, pagina: string | null) {
  return {
    trovata: r.trovata, marca: r.marca, modello: r.modello, tipo: r.tipo, famiglia: r.famiglia,
    codici: (r.codici ?? []).slice(0, 4), veicoli: (r.veicoli ?? []).slice(0, 8),
    problemi_comuni: (r.problemi_comuni ?? []).slice(0, 5),
    prezzo: r.prezzo ? { base: r.prezzo.base, prezzo: r.prezzo.prezzo, risparmio: r.prezzo.risparmio } : null,
    generico: r.generico ?? false, pagina,
  };
}

/**
 * Ricerca centralina dal sito pubblico: stesso agente dell'app, con cache, limite per visitatore
 * e tetto giornaliero complessivo per tenere sotto controllo i costi.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (body?.sito_web) return NextResponse.json({ errore: "Richiesta non valida." }, { status: 400 });
  const q = typeof body.q === "string" ? body.q.trim().slice(0, 60) : "";
  const chiave = q.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (chiave.length < 4) return NextResponse.json({ errore: "Scrivi il codice che trovi sull'etichetta della centralina." }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: imp } = await admin.from("impostazioni").select("*").eq("id", 1).single();
  const pagina = await paginaPerChiave(chiave);
  const linkPagina = pagina?.stato === "pubblicata" ? pagina.slug : null;

  // 1. Cache: stessa centralina cercata nelle ultime 2 settimane (dall'app o dal sito)
  const da = new Date(Date.now() - 14 * 864e5).toISOString();
  const { data: c } = await admin.from("ricerche").select("risultato").eq("chiave", chiave).eq("risultato->>v", "3").gte("creato_il", da).order("creato_il", { ascending: false }).limit(1).maybeSingle();
  if (c?.risultato) {
    const r = await completa(admin, c.risultato as RisultatoCerca, imp as Impostazioni, q, false);
    return NextResponse.json(pubblico(r, linkPagina));
  }

  // 2. Limiti: per visitatore e totale del giorno sul sito
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "sconosciuto";
  const ipHash = createHash("sha256").update(`${ip}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`).digest("hex").slice(0, 32);
  const giorno = new Date(Date.now() - 864e5).toISOString();
  const perVisitatore = Number(process.env.LIMITE_RICERCHE_SITO_VISITATORE || 5);
  const totaleGiorno = Number(process.env.LIMITE_RICERCHE_SITO_GIORNO || 150);
  const [{ count: mie }, { count: tutte }] = await Promise.all([
    admin.from("ricerche").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("creato_il", giorno),
    admin.from("ricerche").select("id", { count: "exact", head: true }).eq("origine", "sito").gte("creato_il", giorno),
  ]);
  if ((mie ?? 0) >= perVisitatore || (tutte ?? 0) >= totaleGiorno)
    return NextResponse.json({ errore: "Hai fatto molte ricerche oggi. Entra nell'app gratis per continuare a cercare.", limite: true }, { status: 429 });

  // 3. Ricerca nuova
  try {
    const grezzo = await cercaCentralina(q, undefined, await fontiPreferite(admin));
    await admin.from("ricerche").insert({ chiave, risultato: grezzo, ip_hash: ipHash, origine: "sito" });
    const r = await completa(admin, grezzo, imp as Impostazioni, q, true);
    // Una centralina nuova trovata dal sito diventa una bozza del catalogo, da controllare e pubblicare
    if (r.trovata && !pagina) {
      const b = await creaDaRisultato(grezzo, q, chiave).catch(() => null);
      if (b && "slug" in b && b.slug) await notificaStaff(admin, { per_ruolo: "admin", tipo: "catalogo", titolo: "Nuova bozza nel catalogo", testo: `Cercata dal sito: ${q}. Controllala e pubblicala.`, link: `/lab/sito/centralina/${b.slug}` });
    }
    return NextResponse.json(pubblico(r, linkPagina));
  } catch (e) {
    console.error("cerca-pubblica", e);
    await admin.from("ricerche").insert({ chiave: null, risultato: null, ip_hash: ipHash, origine: "sito" });
    return NextResponse.json({ errore: "Non siamo riusciti a completare l'analisi. Riprova tra poco o entra nell'app." }, { status: 502 });
  }
}
