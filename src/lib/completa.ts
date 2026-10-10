import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { calcolaPrezzo, normalizzaPrezzi, type Impostazioni } from "@/lib/prezzo";
import { candidati, salvaDaRicerca, trovaRiferimenti } from "@/lib/riferimenti";
import type { RisultatoCerca } from "@/lib/types";

/** Normalizza i prezzi, li confronta con la tabella dei prezzi di riferimento e calcola il nostro prezzo. */
export async function completa(admin: SupabaseClient, grezzo: RisultatoCerca, imp: Impostazioni, q: string, salva: boolean): Promise<RisultatoCerca> {
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
