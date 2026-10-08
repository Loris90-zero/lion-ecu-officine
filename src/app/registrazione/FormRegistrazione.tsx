"use client";
import { useActionState } from "react";
import { creaOfficina, type StatoForm } from "./azioni";

export function FormRegistrazione({ email, nome }: { email: string; nome: string }) {
  const [stato, azione, inCorso] = useActionState<StatoForm, FormData>(creaOfficina, {});
  return (
    <form action={azione}>
      <div className="field"><label htmlFor="ragione_sociale">Nome dell&apos;officina</label><input id="ragione_sociale" name="ragione_sociale" autoComplete="organization" required placeholder="Es. Rossi Truck Service" /></div>
      <div className="field"><label htmlFor="referente">Il tuo nome e cognome</label><input id="referente" name="referente" autoComplete="name" defaultValue={nome} required /></div>
      <div className="field"><label htmlFor="telefono">Cellulare</label><input id="telefono" name="telefono" type="tel" autoComplete="tel" required placeholder="+39 3…" /></div>
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" defaultValue={email} required /></div>
      <label className="check"><input type="checkbox" name="privacy" /><span>Ho letto e accetto l&apos;<a href="/privacy" target="_blank">informativa privacy</a>.</span></label>
      <label className="check"><input type="checkbox" name="consenso_whatsapp" /><span>Voglio ricevere su WhatsApp gli aggiornamenti sulle mie riparazioni.</span></label>
      {stato.errore ? <p className="err">{stato.errore}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={inCorso}>{inCorso ? "Salvataggio…" : "Entra nell'app"}</button>
    </form>
  );
}
