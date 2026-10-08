/** Dati minimi per emettere la fattura elettronica. */
export function fatturazioneCompleta(o: { partita_iva: string | null; sede_legale: string | null; codice_sdi: string | null; pec: string | null }) {
  return !!(o.partita_iva && o.sede_legale && (o.codice_sdi || o.pec));
}
