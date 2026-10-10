"use client";
import { useActionState } from "react";
import { inviaCandidatura, type StatoCand } from "./azioni";

export function FormCandidatura() {
  const [s, azione, inCorso] = useActionState<StatoCand, FormData>(inviaCandidatura, {});
  if (s.ok) return <p className="s-ok" style={{ fontSize: 20 }}>Candidatura ricevuta. Ti ricontattiamo noi.</p>;
  return (
    <form action={azione} className="s-form">
      <div className="s-campo"><label htmlFor="c-ruolo">Per quale ruolo</label><select id="c-ruolo" name="ruolo" defaultValue="tecnico"><option value="tecnico">Tecnico elettronico</option><option value="venditore">Venditore a provvigione</option><option value="altro">Altro</option></select></div>
      <div className="s-campo"><label htmlFor="c-nome">Nome e cognome</label><input id="c-nome" name="nome" autoComplete="name" /></div>
      <div className="s-campo"><label htmlFor="c-email">Email</label><input id="c-email" name="email" type="email" autoComplete="email" /></div>
      <div className="s-campo"><label htmlFor="c-tel">Cellulare</label><input id="c-tel" name="telefono" type="tel" autoComplete="tel" /></div>
      <div className="s-campo"><label htmlFor="c-msg">Raccontaci la tua esperienza</label><textarea id="c-msg" name="messaggio" /></div>
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}><label>Sito web<input name="sito_web" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="s-check"><input type="checkbox" name="privacy" /><span>Ho letto l&apos;<a href="/privacy" target="_blank">informativa privacy</a>.</span></label>
      {s.errore ? <p className="s-err" role="alert">{s.errore}</p> : null}
      <button className="s-btn s-btn-p" type="submit" disabled={inCorso}>{inCorso ? "Invio…" : "Invia la candidatura"}</button>
    </form>
  );
}
