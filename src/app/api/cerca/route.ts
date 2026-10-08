import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cercaCentralina } from "@/lib/cerca";
import { calcolaPrezzo, normalizzaPrezzi, type Impostazioni } from "@/lib/prezzo";
import type { RisultatoCerca } from "@/lib/types";
import { candidati, fontiPreferite, salvaDaRicerca, trovaRiferimenti } from "@/lib/riferimenti";
import type { SupabaseClient } from "@supabase/supabase-js";

export const maxDuration = 120;

const TIPI_IMG = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ errore: "Accedi per cercare." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const q = typeof body.q === "string" ? body.q.trim().slice(0, 200) : "";
  const img = body.immagine && typeof body.immagine.data === "string" && TIPI_IMG.includes(body.immagine.tipo)
    ? { data: String(body.immagine.data), tipo: String(body.immagine.tipo) } : undefined;
  if (!q && !img) return NextResponse.json({ errore: "Scrivi un codice o aggiungi una foto." }, { status: 400 });
  if (img && img.data.length > 6_000_000) return NextResponse.json({ errore: "La foto è troppo grande." }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: imp } = await admin.from("impostazioni").select("*").eq("id", 1).single();
  const impostazioni = imp as Impostazioni;
  const chiave = q ? q.toUpperCase().replace(/[^A-Z0-9]/g, "") : null;

  // Cache: stessa ricerca nelle ultime 2 settimane, senza foto
  if (chiave && !img) {
    const da = new Date(Date.now() - 14 * 864e5).toISOString();
    const { data: c } = await admin.from("ricerche").select("risultato").eq("chiave", chiave).eq("risultato->>v", "3")
      .gte("creato_il", da).order("creato_il", { ascending: false }).limit(1).maybeSingle();
    if (c?.risultato) {
      const r = await completa(admin, c.risultato as RisultatoCerca, impostazioni, q, false);
      r.dallaCache = true;
      return NextResponse.json(r);
    }
  }

  // Limite giornaliero per utente
  const limite = Number(process.env.LIMITE_RICERCHE_GIORNO || 30);
  const { count } = await admin.from("ricerche").select("id", { count: "exact", head: true })
    .eq("user_id", user.id).gte("creato_il", new Date(Date.now() - 864e5).toISOString());
  if ((count ?? 0) >= limite) return NextResponse.json({ errore: "Hai raggiunto il limite di ricerche di oggi. Riprova domani o scrivici." }, { status: 429 });

  try {
    const grezzo = await cercaCentralina(q, img, await fontiPreferite(admin));
    await admin.from("ricerche").insert({ user_id: user.id, chiave: img ? null : chiave, risultato: grezzo });
    return NextResponse.json(await completa(admin, grezzo, impostazioni, q, true));
  } catch (e) {
    console.error("cerca", e);
    await admin.from("ricerche").insert({ user_id: user.id, chiave: null, risultato: null });
    return NextResponse.json({ errore: "La ricerca non è andata a buon fine. Riprova tra poco." }, { status: 502 });
  }
}

/** Normalizza i prezzi, li confronta con la tabella dei prezzi di riferimento e calcola il nostro prezzo. */
async function completa(admin: SupabaseClient, grezzo: RisultatoCerca, imp: Impostazioni, q: string, salva: boolean): Promise<RisultatoCerca> {
  const r = normalizzaPrezzi(grezzo, imp);
  const cand = candidati(q, r.codici);
  if (salva && r.trovata) await salvaDaRicerca(admin, r, cand).catch((e) => console.error("salva riferimenti", e));
  const rif = await trovaRiferimenti(admin, cand);
  if (rif.laboratorio.length) {
    // Il prezzo inserito dal laboratorio vince sempre
    const l = rif.laboratorio[0];
    r.prezzo = calcolaPrezzo([Number(l.prezzo_eur)], imp);
    r.baseDa = "laboratorio";
    r.baseFonte = { nome: l.fonte_nome, url: l.fonte_url };
  } else {
    const prezzi = new Map<string, number>();
    for (const p of r.prezzi_nuova) prezzi.set(p.url, p.prezzo_eur);
    for (const x of rif.ricerca) if (x.fonte_url && !prezzi.has(x.fonte_url)) {
      prezzi.set(x.fonte_url, Number(x.prezzo_eur));
      r.prezzi_nuova.push({ prezzo_eur: Number(x.prezzo_eur), valuta: x.valuta, prezzo_originale: Number(x.prezzo_originale ?? x.prezzo_eur), venditore: `${x.fonte_nome || "fonte salvata"} (salvato il ${new Date(x.aggiornato_il).toLocaleDateString("it-IT")})`, url: x.fonte_url });
    }
    r.prezzo = calcolaPrezzo([...prezzi.values()], imp);
    r.baseDa = r.prezzo ? "ricerca" : null;
  }
  const fam = (r.famiglia || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const cod = q.toUpperCase().replace(/[^A-Z0-9]/g, "");
  r.generico = !!fam && cod === fam;
  return r;
}
