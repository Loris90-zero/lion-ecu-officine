"use client";
import { useActionState, useState } from "react";
import { creaOfficina, type StatoForm } from "./azioni";
import { QuizDinamico } from "@/components/QuizDinamico";

export function FormRegistrazione({ email, nome, leadToken }: { email: string; nome: string; leadToken: string | null }) {
  const quizFatto = !!leadToken;
  const [stato, azione, inCorso] = useActionState<StatoForm, FormData>(creaOfficina, {});
  const [quizOk, setQuizOk] = useState(quizFatto);
  return (
    <form action={azione}>
      <div className="field"><label htmlFor="ragione_sociale">Nome dell&apos;officina</label><input id="ragione_sociale" name="ragione_sociale" autoComplete="organization" required placeholder="Es. Rossi Truck Service" /></div>
      <div className="field"><label htmlFor="referente">Il tuo nome e cognome</label><input id="referente" name="referente" autoComplete="name" defaultValue={nome} required /></div>
      <div className="field"><label htmlFor="telefono">Cellulare</label><input id="telefono" name="telefono" type="tel" autoComplete="tel" required placeholder="+39 3…" /></div>
      <input type="hidden" name="email" value={email} />
      {leadToken ? <input type="hidden" name="lead" value={leadToken} /> : null}
      <p className="hint" style={{ margin: 0 }}>Accedi con <b>{email}</b></p>
      {quizFatto ? null : (
        <div className="box">
          <h2 style={{ margin: 0 }}>Qualche domanda sulla tua officina</h2>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>Un minuto: ci serve per proporti il servizio giusto.</p>
          <QuizDinamico onCompleto={() => setQuizOk(true)} />
        </div>
      )}
      <label className="check"><input type="checkbox" name="privacy" /><span>Ho letto e accetto l&apos;<a href="/privacy" target="_blank">informativa privacy</a>.</span></label>
      <label className="check"><input type="checkbox" name="consenso_whatsapp" /><span>Voglio ricevere su WhatsApp gli aggiornamenti sulle mie riparazioni.</span></label>
      {stato.errore ? <p className="err">{stato.errore}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={inCorso || !quizOk}>{inCorso ? "Salvataggio…" : "Entra nell'app"}</button>
    </form>
  );
}
