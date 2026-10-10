"use client";
import { useActionState } from "react";
import { verificaCertificato, type Verifica } from "./azioni";

export function FormVerifica() {
  const [s, azione, inCorso] = useActionState<Verifica, FormData>(verificaCertificato, {});
  return (
    <form action={azione} className="s-form">
      <div className="s-campo"><label htmlFor="v-num">Numero pratica</label><input id="v-num" name="numero" placeholder="LES-26-0012" className="s-mono" autoComplete="off" /></div>
      <div className="s-campo"><label htmlFor="v-cif">Ultime 4 cifre del codice della centralina</label><input id="v-cif" name="cifre" maxLength={4} inputMode="text" className="s-mono" autoComplete="off" /></div>
      <button className="s-btn s-btn-p" type="submit" disabled={inCorso}>{inCorso ? "Verifica…" : "Verifica il certificato"}</button>
      <div aria-live="polite">
        {s.errore ? <p className="s-err">{s.errore}</p> : null}
        {s.esito === "non_trovata" ? <p className="s-err">Nessun certificato valido con questi dati. Controlla numero pratica e cifre del codice.</p> : null}
        {s.esito === "valida" && s.dati ? (
          <div style={{ border: "2px solid var(--ve)", borderRadius: 8, padding: 18, background: "var(--bi)" }}>
            <p className="s-ok" style={{ fontSize: 20 }}>Certificato valido: garanzia a vita attiva.</p>
            <p style={{ margin: "8px 0 0" }}>Centralina: <b>{s.dati.centralina || "—"}</b><br />Guasto riparato: <b>{s.dati.guasto}</b><br />Garanzia dal {s.dati.data}</p>
          </div>
        ) : null}
      </div>
    </form>
  );
}
