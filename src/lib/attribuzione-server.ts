import "server-only";
import { cookies } from "next/headers";
import { COOKIE_SORGENTE, leggiAttribuzione, type Attribuzione } from "./attribuzione";

/** Attribuzione della persona che sta facendo la richiesta (cookie del sito). */
export async function attribuzioneCorrente(): Promise<Attribuzione | null> {
  const c = await cookies();
  return leggiAttribuzione(c.get(COOKIE_SORGENTE)?.value);
}
