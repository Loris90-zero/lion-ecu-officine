"use client";
import { useActionState } from "react";
import { creaOfficina, type StatoForm } from "./azioni";

export function FormRegistrazione({ email, nome }: { email: string; nome: string }) {
  const [stato, azione, inCorso] = useActionState<StatoForm, FormData>(creaOfficina, {});
  return (
    <form action={azione}>
      <div className="field"><label htmlFor="ragione_sociale">Ragione sociale</label><input id="ragione_sociale" name="ragione_sociale" autoComplete="organization" required placeholder="Es. Rossi Truck Service S.r.l." /></div>
      <div className="grid2">
        <div className="field"><label htmlFor="partita_iva">Partita IVA</label><input id="partita_iva" name="partita_iva" className="mono" inputMode="numeric" maxLength={13} placeholder="11 cifre" /></div>
        <div className="field"><label htmlFor="citta">Città e provincia</label><input id="citta" name="citta" placeholder="Es. Pescara (PE)" /></div>
      </div>
      <div className="field"><label htmlFor="referente">Nome e cognome del referente</label><input id="referente" name="referente" autoComplete="name" defaultValue={nome} required /></div>
      <div className="grid2">
        <div className="field"><label htmlFor="telefono">Cellulare</label><input id="telefono" name="telefono" type="tel" autoComplete="tel" required placeholder="+39 3…" /></div>
        <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={email} /></div>
      </div>
      <div className="field"><label htmlFor="indirizzo_ritiro">Indirizzo dove il corriere ritira</label><input id="indirizzo_ritiro" name="indirizzo_ritiro" autoComplete="street-address" required placeholder="Via, numero, CAP, città" /></div>
      <label className="check"><input type="checkbox" name="privacy" /><span>Ho letto e accetto l&apos;<a href="/privacy" target="_blank">informativa privacy</a>.</span></label>
      <label className="check"><input type="checkbox" name="consenso_whatsapp" /><span>Voglio ricevere su WhatsApp gli aggiornamenti sulle mie riparazioni.</span></label>
      {stato.errore ? <p className="err">{stato.errore}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={inCorso}>{inCorso ? "Salvataggio…" : "Entra nell'app"}</button>
    </form>
  );
}
