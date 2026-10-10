"use client";
import { useActionState } from "react";
import { chiediAccesso, type StatoRichiesta } from "./azioni";

export function FormRichiesta({ nome }: { nome: string }) {
  const [s, azione, inCorso] = useActionState<StatoRichiesta, FormData>(chiediAccesso, {});
  return (
    <form action={azione}>
      <div className="field"><label htmlFor="nome">Nome e cognome</label><input id="nome" name="nome" autoComplete="name" defaultValue={nome} required /></div>
      <div className="field"><label htmlFor="telefono">Cellulare</label><input id="telefono" name="telefono" type="tel" autoComplete="tel" required placeholder="+39 3…" /></div>
      {s.errore ? <p className="err">{s.errore}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={inCorso}>{inCorso ? "Invio…" : "Chiedi l'accesso"}</button>
    </form>
  );
}
