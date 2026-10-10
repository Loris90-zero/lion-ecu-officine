"use client";
import { useActionState, useEffect, useState } from "react";
import { inviaQuiz, type StatoQuiz } from "./azioni";
import { QuizDinamico } from "@/components/QuizDinamico";
import { Wa } from "@/sito/Whatsapp";

/** Questionario dinamico, poi i contatti, poi l'accesso all'app. */
export function Quiz({ appUrl, origine = "sito_quiz" }: { appUrl: string; origine?: string }) {
  const [s, azione, inCorso] = useActionState<StatoQuiz, FormData>(inviaQuiz, {});
  const [completo, setCompleto] = useState(false);
  const [utm, setUtm] = useState<Record<string, string>>({});
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setUtm(Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid"].map((k) => [k, q.get(k) ?? ""]).filter(([, v]) => v)));
  }, []);

  if (s.ok)
    return (
      <div className="s-form">
        <h3 className="s-h3">Grazie, ci siamo.</h3>
        <p>Il prossimo passo è entrare nell&apos;app con <b>{s.email}</b>: da lì calcoli i preventivi e prenoti i ritiri gratuiti. Ti chiamiamo anche noi per conoscerci.</p>
        <a className="s-btn s-btn-p" href={`${appUrl}/accedi`}>Entra nell&apos;app</a>
        <Wa />
      </div>
    );

  return (
    <form action={azione} className="s-form" noValidate>
      <input type="hidden" name="origine" value={origine} />
      {Object.entries(utm).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <QuizDinamico onCompleto={() => setCompleto(true)} />
      {completo ? (
        <>
          <h3 className="s-h3" style={{ marginTop: 8 }}>Dove ti mandiamo l&apos;accesso all&apos;app?</h3>
          <div className="s-campo"><label htmlFor="q-off">Nome dell&apos;officina o dell&apos;azienda</label><input id="q-off" name="nome_officina" autoComplete="organization" /></div>
          <div className="s-campo"><label htmlFor="q-nome">Il tuo nome e cognome</label><input id="q-nome" name="nome" autoComplete="name" /></div>
          <div className="s-campo"><label htmlFor="q-tel">Cellulare</label><input id="q-tel" name="telefono" type="tel" autoComplete="tel" /></div>
          <div className="s-campo"><label htmlFor="q-email">Email</label><input id="q-email" name="email" type="email" autoComplete="email" /></div>
          <div className="s-campo"><label htmlFor="q-prov">Provincia</label><input id="q-prov" name="provincia" placeholder="Es. Pescara" /></div>
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}><label>Sito web<input name="sito_web" tabIndex={-1} autoComplete="off" /></label></div>
          <label className="s-check"><input type="checkbox" name="privacy" /><span>Ho letto l&apos;<a href="/privacy" target="_blank">informativa privacy</a> e accetto di essere ricontattato da EcuLion.</span></label>
          {s.errore ? <p className="s-err" role="alert">{s.errore}</p> : null}
          <button className="s-btn s-btn-p" type="submit" disabled={inCorso}>{inCorso ? "Invio…" : "Invia e ricevi l'accesso"}</button>
          <Wa />
        </>
      ) : null}
    </form>
  );
}
