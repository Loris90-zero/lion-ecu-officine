"use client";
import { useActionState, useEffect, useState } from "react";
import { concludiQuiz, type StatoQuiz } from "./azioni";
import { QuizDinamico } from "@/components/QuizDinamico";
import { Wa } from "@/sito/Whatsapp";

/** Questionario dinamico, poi l'accesso gratuito all'app (email o Google). */
export type DatiRitiro = { centralina?: string; codice?: string; stima?: string; base?: string };

export function Quiz({ origine = "sito_quiz", ritiro }: { appUrl?: string; origine?: string; ritiro?: DatiRitiro }) {
  const [s, azione, inCorso] = useActionState<StatoQuiz, FormData>(concludiQuiz, {});
  const [completo, setCompleto] = useState(false);
  const [utm, setUtm] = useState<Record<string, string>>({});
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setUtm(Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid"].map((k) => [k, q.get(k) ?? ""]).filter(([, v]) => v)));
  }, []);

  return (
    <form action={azione} className="s-form" noValidate>
      <input type="hidden" name="origine" value={origine} />
      {ritiro ? Object.entries(ritiro).filter(([, v]) => v).map(([k, v]) => <input key={k} type="hidden" name={`ritiro_${k}`} value={v} />) : null}
      {Object.entries(utm).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <QuizDinamico onCompleto={() => setCompleto(true)} />
      {completo ? (
        <div className="s-accesso">
          <h3 className="s-h3">{ritiro ? "Ultimo passo: entra e prenota il ritiro" : "Ultimo passo: crea il tuo accesso gratuito"}</h3>
          <p className="s-muted" style={{ margin: 0 }}>{ritiro ? "Ti ritroverai il modulo del ritiro già compilato con la tua centralina." : "Così entri subito nell'app e calcoli il primo preventivo."}</p>
          <label className="s-check"><input type="checkbox" name="privacy" defaultChecked={false} /><span>Ho letto l&apos;<a href="/privacy" target="_blank">informativa privacy</a> e accetto di essere ricontattato da EcuLion.</span></label>
          <button className="s-btn s-btn-g s-google" name="via" value="google" type="submit" disabled={inCorso}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.2a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>
            Continua con Google
          </button>
          <div className="s-oppure">oppure con la tua email</div>
          <div className="s-campo"><label htmlFor="q-email">Email</label><input id="q-email" name="email" type="email" autoComplete="email" inputMode="email" placeholder="officina@esempio.it" /></div>
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}><label>Sito web<input name="sito_web" tabIndex={-1} autoComplete="off" /></label></div>
          {s.errore ? <p className="s-err" role="alert">{s.errore}</p> : null}
          <button className="s-btn s-btn-p" name="via" value="email" type="submit" disabled={inCorso}>{inCorso ? "Un attimo…" : "Mandami il link per entrare"}</button>
          <Wa />
        </div>
      ) : null}
    </form>
  );
}
