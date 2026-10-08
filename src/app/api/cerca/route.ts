import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { cercaCentralina } from "@/lib/cerca";
import { calcolaPrezzo, normalizzaPrezzi, type Impostazioni } from "@/lib/prezzo";
import type { RisultatoCerca } from "@/lib/types";

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
    const { data: c } = await admin.from("ricerche").select("risultato").eq("chiave", chiave).eq("risultato->>v", "2")
      .gte("creato_il", da).order("creato_il", { ascending: false }).limit(1).maybeSingle();
    if (c?.risultato) {
      const r = completa(c.risultato as RisultatoCerca, impostazioni, q);
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
    const grezzo = await cercaCentralina(q, img);
    await admin.from("ricerche").insert({ user_id: user.id, chiave: img ? null : chiave, risultato: grezzo });
    return NextResponse.json(completa(grezzo, impostazioni, q));
  } catch (e) {
    console.error("cerca", e);
    await admin.from("ricerche").insert({ user_id: user.id, chiave: null, risultato: null });
    return NextResponse.json({ errore: "La ricerca non è andata a buon fine. Riprova tra poco." }, { status: 502 });
  }
}

/** Normalizza i prezzi (valute, pagine di elenco, anomalie) e calcola il nostro prezzo. */
function completa(grezzo: RisultatoCerca, imp: Impostazioni, q: string): RisultatoCerca {
  const r = normalizzaPrezzi(grezzo, imp);
  r.prezzo = calcolaPrezzo(r.prezzi_nuova.map((p) => p.prezzo_eur), imp);
  // Ricerca per sola famiglia (es. "EDC17CV41") invece del codice dell'etichetta
  const fam = (r.famiglia || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const cod = q.toUpperCase().replace(/[^A-Z0-9]/g, "");
  r.generico = !!fam && cod === fam;
  return r;
}
