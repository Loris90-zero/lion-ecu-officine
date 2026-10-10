"use client";
import { useEffect, useState } from "react";

type R = {
  trovata: boolean; marca?: string; modello?: string; tipo?: string; famiglia?: string; codici: string[]; veicoli: string[];
  problemi_comuni: { problema: string; sintomi?: string }[]; prezzo: { base: number; prezzo: number; risparmio: number } | null;
  generico: boolean; pagina: string | null; errore?: string; limite?: boolean;
};
const eur = (n: number) => `${Math.round(n).toLocaleString("it-IT")} €`;

/** La stessa ricerca dell'app, sul sito: identifica la centralina, guasti comuni e prezzi. */
export function RicercaLive({ q, base, app }: { q: string; base: string; app: string }) {
  const [r, setR] = useState<R | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch("/api/cerca-pubblica", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q }) })
      .then(async (res) => { const j = await res.json(); if (!vivo) return; if (!res.ok || j.errore) setErrore(j.errore ?? "Analisi non riuscita."); else setR(j); })
      .catch(() => vivo && setErrore("Analisi non riuscita. Riprova tra poco."));
    return () => { vivo = false; };
  }, [q]);

  if (errore)
    return (
      <div className="s-vuoto" role="alert">
        <h2 className="s-h3">{errore}</h2>
        <p>Nell&apos;app puoi cercare senza limiti, anche fotografando l&apos;etichetta.</p>
        <a className="s-btn s-btn-p" href={`${app}/accedi`}>Entra nell&apos;app</a>
      </div>
    );
  if (!r)
    return (
      <div className="s-vuoto" aria-live="polite" style={{ borderStyle: "solid" }}>
        <h2 className="s-h3">Stiamo analizzando la tua centralina…</h2>
        <p className="s-muted">Identifichiamo modello, guasti più comuni e prezzi. Può volerci fino a un minuto.</p>
        <div className="s-barra s-attesa" aria-hidden="true"><i /></div>
      </div>
    );
  if (!r.trovata)
    return (
      <div className="s-vuoto">
        <h2 className="s-h3">Non riusciamo a identificare «{q}»</h2>
        <p>Controlla il codice sull&apos;etichetta, oppure prenota il ritiro: la identifichiamo noi al banco, gratis.</p>
        <a className="s-btn s-btn-p" href={`${app}/accedi`}>Prenota un ritiro gratuito</a>
      </div>
    );

  const nome = [r.marca, r.modello || r.famiglia].filter(Boolean).join(" ") || q;
  const prenota = `${app}/ritiro?centralina=${encodeURIComponent(nome)}&codice=${encodeURIComponent(q)}${r.prezzo ? `&stima=${r.prezzo.prezzo}&base=${r.prezzo.base}` : ""}`;
  return (
    <div className="s-due" aria-live="polite">
      <div className="s-testa" style={{ marginBottom: 0 }}>
        <h2 className="s-h2">{nome}</h2>
        {r.tipo ? <p className="s-lead" style={{ margin: 0 }}>{r.tipo}</p> : null}
        {r.codici.length ? <p className="s-mono" style={{ margin: 0 }}>{r.codici.join(" · ")}</p> : null}
        {r.generico ? <p className="s-muted">Hai cercato una famiglia di centraline: per un prezzo preciso scrivi il codice completo dell&apos;etichetta.</p> : null}
        {r.problemi_comuni.length ? (
          <>
            <h3 className="s-h3" style={{ marginTop: 16 }}>Guasti più comuni</h3>
            <ul className="s-elenco">{r.problemi_comuni.map((p) => <li key={p.problema}><b>{p.problema}</b>{p.sintomi}</li>)}</ul>
          </>
        ) : null}
        {r.veicoli.length ? <p className="s-muted">Montata su: {r.veicoli.join(", ")}.</p> : null}
        {r.pagina ? <p><a href={`${base}/centraline/${r.pagina}`}>Scheda completa di questa centralina</a></p> : null}
      </div>
      <div style={{ background: "var(--bi)", border: "2px solid var(--as)", borderRadius: 10, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="s-prezzo">
          {r.prezzo ? <div><b>{eur(r.prezzo.prezzo)}</b>riparazione, + IVA</div> : <div><b>Su richiesta</b>prezzo dopo la diagnosi gratuita</div>}
          {r.prezzo?.base ? <div><b className="s-muted">{eur(r.prezzo.base)}</b>nuova, indicativo</div> : null}
        </div>
        {r.prezzo && r.prezzo.risparmio > 0 ? <p className="s-ok" style={{ margin: 0 }}>Risparmi circa il {r.prezzo.risparmio}% rispetto al nuovo.</p> : null}
        <p className="s-muted" style={{ margin: 0 }}>Prezzo indicativo: lo conferma il tecnico dopo la diagnosi. Ritiro, diagnosi e rispedizione sono gratuiti, e paghi solo se è riparabile.</p>
        <a className="s-btn s-btn-p" href={prenota}>Prenota il ritiro di questa centralina</a>
      </div>
    </div>
  );
}
