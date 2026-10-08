"use client";
import { useActionState } from "react";
import { salvaProfilo, type StatoProfilo } from "./azioni";
import { TIPI_MEZZO } from "@/lib/fasi";
import type { Officina } from "@/lib/types";

export function FormProfilo({ o }: { o: Officina }) {
  const [stato, azione, inCorso] = useActionState<StatoProfilo, FormData>(salvaProfilo, {});
  return (
    <form action={azione}>
      <div className="box">
        <span className="label">Azienda</span>
        <div className="field"><label htmlFor="ragione_sociale">Ragione sociale</label><input id="ragione_sociale" name="ragione_sociale" defaultValue={o.ragione_sociale} required /></div>
        <div className="grid2">
          <div className="field"><label htmlFor="partita_iva">Partita IVA</label><input id="partita_iva" name="partita_iva" className="mono" inputMode="numeric" maxLength={13} defaultValue={o.partita_iva ?? ""} /></div>
          <div className="field"><label htmlFor="citta">Città e provincia</label><input id="citta" name="citta" defaultValue={o.citta ?? ""} /></div>
        </div>
        <div className="field"><label htmlFor="sede_legale">Sede legale</label><input id="sede_legale" name="sede_legale" defaultValue={o.sede_legale ?? ""} placeholder="Via, numero, CAP, città (se diversa dall'indirizzo di ritiro)" /></div>
      </div>

      <div className="box">
        <span className="label">Fatturazione elettronica</span>
        <div className="grid2">
          <div className="field"><label htmlFor="codice_sdi">Codice SDI</label><input id="codice_sdi" name="codice_sdi" className="mono" maxLength={7} defaultValue={o.codice_sdi ?? ""} placeholder="7 caratteri" style={{ textTransform: "uppercase" }} /></div>
          <div className="field"><label htmlFor="pec">PEC</label><input id="pec" name="pec" type="email" defaultValue={o.pec ?? ""} /></div>
        </div>
        <span className="hint">Basta uno dei due: serve per mandarvi la fattura elettronica.</span>
      </div>

      <div className="box">
        <span className="label">Contatti</span>
        <div className="field"><label htmlFor="referente">Referente</label><input id="referente" name="referente" defaultValue={o.referente} required /></div>
        <div className="grid2">
          <div className="field"><label htmlFor="telefono">Cellulare</label><input id="telefono" name="telefono" type="tel" defaultValue={o.telefono} required /></div>
          <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={o.email ?? ""} /></div>
        </div>
        <label className="check"><input type="checkbox" name="consenso_whatsapp" defaultChecked={o.consenso_whatsapp} /><span>Voglio ricevere su WhatsApp gli aggiornamenti sulle mie riparazioni.</span></label>
      </div>

      <div className="box">
        <span className="label">Ritiri</span>
        <div className="field"><label htmlFor="indirizzo_ritiro">Indirizzo dove il corriere ritira</label><input id="indirizzo_ritiro" name="indirizzo_ritiro" defaultValue={o.indirizzo_ritiro} required /></div>
        <div className="field"><label htmlFor="orari_ritiro">Orari in cui siete aperti</label><input id="orari_ritiro" name="orari_ritiro" defaultValue={o.orari_ritiro ?? ""} placeholder="Es. lun-ven 8-12 e 14-18, sabato chiuso" /></div>
      </div>

      <div className="box">
        <span className="label">Su quali mezzi lavorate</span>
        <div className="chips">
          {TIPI_MEZZO.map((m) => (
            <label key={m} className="chip"><input type="checkbox" name="mezzi" value={m} defaultChecked={o.mezzi?.includes(m)} /><span>{m}</span></label>
          ))}
        </div>
      </div>

      {stato.errore ? <p className="err">{stato.errore}</p> : null}
      {stato.ok ? <p className="okmsg">{stato.ok}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={inCorso}>{inCorso ? "Salvataggio…" : "Salva i dati"}</button>
    </form>
  );
}
