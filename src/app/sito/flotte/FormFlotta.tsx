"use client";
import { useActionState } from "react";
import { inviaFlotta, type StatoFlotta } from "./azioni";

export function FormFlotta() {
  const [s, azione, inCorso] = useActionState<StatoFlotta, FormData>(inviaFlotta, {});
  if (s.ok) return <p className="s-ok" style={{ fontSize: 20 }}>Ricevuto. Ti chiamiamo noi per capire come lavorano i tuoi mezzi.</p>;
  return (
    <form action={azione} className="s-form">
      <div className="s-campo"><label htmlFor="f-az">Azienda</label><input id="f-az" name="azienda" autoComplete="organization" /></div>
      <div className="s-campo"><label htmlFor="f-nome">Nome e cognome</label><input id="f-nome" name="nome" autoComplete="name" /></div>
      <div className="s-campo"><label htmlFor="f-tel">Cellulare</label><input id="f-tel" name="telefono" type="tel" autoComplete="tel" /></div>
      <div className="s-campo"><label htmlFor="f-email">Email</label><input id="f-email" name="email" type="email" autoComplete="email" /></div>
      <div className="s-due" style={{ gap: 16 }}>
        <div className="s-campo"><label htmlFor="f-mezzi">Quanti mezzi avete</label><input id="f-mezzi" name="mezzi" inputMode="numeric" /></div>
        <div className="s-campo"><label htmlFor="f-prov">Provincia</label><input id="f-prov" name="provincia" /></div>
      </div>
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}><label>Sito web<input name="sito_web" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="s-check"><input type="checkbox" name="privacy" /><span>Ho letto l&apos;<a href="/privacy" target="_blank">informativa privacy</a> e accetto di essere ricontattato.</span></label>
      {s.errore ? <p className="s-err" role="alert">{s.errore}</p> : null}
      <button className="s-btn s-btn-p" type="submit" disabled={inCorso}>{inCorso ? "Invio…" : "Parla con noi della tua flotta"}</button>
    </form>
  );
}
