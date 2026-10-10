"use client";
import { useActionState, useEffect, useState } from "react";
import { inviaQuiz, type StatoQuiz } from "./azioni";
import { DOMANDE } from "@/sito/score";

/** Quiz a passi: una domanda per schermata, poi i contatti. Le risposte restano nel modulo. */
export function Quiz({ appUrl }: { appUrl: string }) {
  const [s, azione, inCorso] = useActionState<StatoQuiz, FormData>(inviaQuiz, {});
  const [passo, setPasso] = useState(0);
  const [utm, setUtm] = useState<Record<string, string>>({});
  const tot = DOMANDE.length + 1;
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setUtm(Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid"].map((k) => [k, q.get(k) ?? ""]).filter(([, v]) => v)));
  }, []);

  if (s.ok)
    return (
      <div className="s-form">
        <h3 className="s-h3">Grazie, ci siamo.</h3>
        <p>Il prossimo passo è entrare nell&apos;app con <b>{s.email}</b>: da lì cerchi le centraline e prenoti il primo ritiro gratuito. Ti chiamiamo anche noi per conoscerci.</p>
        <a className="s-btn s-btn-p" href={`${appUrl}/accedi`}>Entra nell&apos;app</a>
      </div>
    );

  return (
    <form action={azione} className="s-form" noValidate>
      <div className="s-barra" role="progressbar" aria-valuemin={1} aria-valuemax={tot} aria-valuenow={passo + 1} aria-label={`Passo ${passo + 1} di ${tot}`}><i style={{ width: `${((passo + 1) / tot) * 100}%` }} /></div>
      {Object.entries(utm).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {DOMANDE.map((d, i) => (
        <fieldset key={d.id} hidden={passo !== i} style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="s-h3" style={{ marginBottom: 16 }}>{d.testo}</legend>
          {d.multipla ? <p className="s-muted" style={{ margin: "0 0 12px" }}>Puoi sceglierne più di uno.</p> : null}
          <div className="s-scelte">
            {d.opzioni.map(([v, n]) => (
              <label key={v} className="s-scelta">
                <input type={d.multipla ? "checkbox" : "radio"} name={d.id} value={v} onChange={() => { if (!d.multipla) setTimeout(() => setPasso(i + 1), 150); }} />
                <span>{n}</span>
              </label>
            ))}
          </div>
          <div className="s-azioni" style={{ marginTop: 20 }}>
            {i > 0 ? <button type="button" className="s-btn s-btn-g" onClick={() => setPasso(i - 1)}>Indietro</button> : null}
            <button type="button" className="s-btn s-btn-p" onClick={() => setPasso(i + 1)}>{d.multipla ? "Avanti" : "Salta"}</button>
          </div>
        </fieldset>
      ))}
      <fieldset hidden={passo !== DOMANDE.length} style={{ border: 0, padding: 0, margin: 0, display: passo === DOMANDE.length ? "flex" : undefined, flexDirection: "column", gap: 16 }}>
        <legend className="s-h3" style={{ marginBottom: 16 }}>Dove ti mandiamo l&apos;accesso all&apos;app?</legend>
        <div className="s-campo"><label htmlFor="q-off">Nome dell&apos;officina</label><input id="q-off" name="nome_officina" autoComplete="organization" required /></div>
        <div className="s-campo"><label htmlFor="q-nome">Il tuo nome e cognome</label><input id="q-nome" name="nome" autoComplete="name" required /></div>
        <div className="s-campo"><label htmlFor="q-tel">Cellulare</label><input id="q-tel" name="telefono" type="tel" autoComplete="tel" required /></div>
        <div className="s-campo"><label htmlFor="q-email">Email</label><input id="q-email" name="email" type="email" autoComplete="email" required /></div>
        <div className="s-campo"><label htmlFor="q-prov">Provincia</label><input id="q-prov" name="provincia" placeholder="Es. Pescara" /></div>
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}><label>Sito web<input name="sito_web" tabIndex={-1} autoComplete="off" /></label></div>
        <label className="s-check"><input type="checkbox" name="privacy" /><span>Ho letto l&apos;<a href="/privacy" target="_blank">informativa privacy</a> e accetto di essere ricontattato da EcuLion.</span></label>
        {s.errore ? <p className="s-err" role="alert">{s.errore}</p> : null}
        <div className="s-azioni">
          <button type="button" className="s-btn s-btn-g" onClick={() => setPasso(DOMANDE.length - 1)}>Indietro</button>
          <button className="s-btn s-btn-p" type="submit" disabled={inCorso}>{inCorso ? "Invio…" : "Invia e ricevi l'accesso"}</button>
        </div>
      </fieldset>
    </form>
  );
}
