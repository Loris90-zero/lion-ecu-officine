"use client";
import { useActionState } from "react";
import { salvaFatturazione, type StatoProfilo } from "./azioni";
import type { Officina } from "@/lib/types";

/** Chiesto una volta sola, al primo pagamento. I dati restano nel profilo. */
export function FormFattura({ o }: { o: Officina }) {
  const [stato, azione, inCorso] = useActionState<StatoProfilo, FormData>(salvaFatturazione, {});
  return (
    <form action={azione} className="section" style={{ gap: 0 }}>
      <p style={{ fontSize: 14 }}>Prima del pagamento ci servono i dati per la fattura elettronica. Li chiediamo solo questa volta.</p>
      <div className="field"><label htmlFor="f_ragione_sociale">Ragione sociale completa</label><input id="f_ragione_sociale" name="ragione_sociale" defaultValue={o.ragione_sociale} required placeholder="Es. Rossi Truck Service S.r.l." /></div>
      <div className="field"><label htmlFor="f_partita_iva">Partita IVA</label><input id="f_partita_iva" name="partita_iva" className="mono" inputMode="numeric" maxLength={13} defaultValue={o.partita_iva ?? ""} required placeholder="11 cifre" /></div>
      <div className="field"><label htmlFor="f_sede_legale">Sede legale</label><input id="f_sede_legale" name="sede_legale" defaultValue={o.sede_legale ?? o.indirizzo_ritiro ?? ""} required placeholder="Via, numero, CAP, città (provincia)" /></div>
      <div className="grid2">
        <div className="field"><label htmlFor="f_codice_sdi">Codice SDI</label><input id="f_codice_sdi" name="codice_sdi" className="mono" maxLength={7} defaultValue={o.codice_sdi ?? ""} placeholder="7 caratteri" style={{ textTransform: "uppercase" }} /></div>
        <div className="field"><label htmlFor="f_pec">oppure PEC</label><input id="f_pec" name="pec" type="email" defaultValue={o.pec ?? ""} placeholder="nome@pec.it" /></div>
      </div>
      {stato.errore ? <p className="err">{stato.errore}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={inCorso}>{inCorso ? "Salvataggio…" : "Salva e continua al pagamento"}</button>
    </form>
  );
}
