"use client";
import { useEffect, useState } from "react";
import { Wa } from "@/sito/Whatsapp";

type R = {
  trovata: boolean; marca?: string; modello?: string; tipo?: string; famiglia?: string; codici: string[]; veicoli: string[];
  problemi_comuni: { problema: string; sintomi?: string }[]; prezzo: { base: number; prezzo: number; risparmio: number } | null;
  generico: boolean; pagina: string | null;
};
const eur = (n: number) => `${Math.round(n).toLocaleString("it-IT")} €`;

/** Schermata del preventivo: risultato grande in alto, sotto il pulsante per andare avanti. */
export function Risultato({ q, base, app }: { q: string; base: string; app: string }) {
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
      <div className="pv-card" role="alert">
        <h1 className="pv-nome">{errore}</h1>
        <p>Nell&apos;app puoi cercare senza limiti, anche fotografando l&apos;etichetta.</p>
        <a className="s-btn s-btn-p pv-avanti" href={`${app}/accedi`}>Entra nell&apos;app</a>
        <Wa testo={`Ciao EcuLion, vorrei un preventivo per la centralina ${q}.`} />
      </div>
    );

  if (!r)
    return (
      <div className="pv-card pv-attesa" aria-live="polite">
        <p className="pv-codice">Codice {q}</p>
        <h1 className="pv-nome">Stiamo analizzando la tua centralina…</h1>
        <p className="s-muted">Identifichiamo modello, guasti più comuni e prezzo della riparazione. Di solito ci vuole meno di un minuto.</p>
        <div className="s-barra s-attesa" aria-hidden="true"><i /></div>
      </div>
    );

  if (!r.trovata)
    return (
      <div className="pv-card">
        <p className="pv-codice">Codice {q}</p>
        <h1 className="pv-nome">Non riusciamo a identificare questa centralina</h1>
        <p>Controlla il codice sull&apos;etichetta, oppure prenota il ritiro: la identifichiamo noi al banco, gratis.</p>
        <a className="s-btn s-btn-p pv-avanti" href={`${base}/prenota?codice=${encodeURIComponent(q)}`}>Prenota il ritiro gratuito</a>
        <Wa testo={`Ciao EcuLion, non trovo la centralina ${q}: potete aiutarmi?`} />
      </div>
    );

  const nome = [r.marca, r.modello || r.famiglia].filter(Boolean).join(" ") || q;
  const prenota = `${base}/prenota?centralina=${encodeURIComponent(nome)}&codice=${encodeURIComponent(q)}${r.prezzo ? `&stima=${r.prezzo.prezzo}&base=${r.prezzo.base}` : ""}`;
  return (
    <>
      <div className="pv-card">
        <p className="pv-codice">Preventivo per il codice {q}</p>
        <h1 className="pv-nome">{nome}</h1>
        {r.tipo ? <p className="pv-tipo">{r.tipo}</p> : null}

        <div className="pv-prezzi">
          <div className="pv-nostro">
            <span>Riparazione EcuLion</span>
            {r.prezzo ? <b>{eur(r.prezzo.prezzo)}<small> + IVA</small></b> : <b className="pv-richiesta">Prezzo dopo la diagnosi gratuita</b>}
          </div>
          {r.prezzo?.base ? (
            <div className="pv-nuova">
              <span>Centralina nuova</span>
              <b>circa {eur(r.prezzo.base)}</b>
            </div>
          ) : null}
        </div>
        {r.prezzo && r.prezzo.risparmio > 0 ? <p className="pv-risparmio">Risparmi circa il {r.prezzo.risparmio}% rispetto alla nuova</p> : null}
        {r.generico ? <p className="s-muted" style={{ margin: 0 }}>Hai cercato una famiglia di centraline: per un prezzo preciso scrivi il codice completo dell&apos;etichetta.</p> : null}

        <a className="s-btn s-btn-p pv-avanti" href={prenota}>Prenota il ritiro gratuito</a>
        <Wa testo={`Ciao EcuLion, ho visto il preventivo per ${nome} (${q}) e vorrei procedere.`} />
        <ul className="s-garanzie">
          <li>Ritiro gratuito</li>
          <li>Paghi solo se è riparabile</li>
          <li>Garanzia a vita sul guasto</li>
        </ul>
        <p className="pv-nota">Prezzo indicativo: lo conferma il tecnico dopo la diagnosi gratuita. Se cambia decidi tu, e se non procedi te la rispediamo gratis.</p>
      </div>

      {r.problemi_comuni.length || r.veicoli.length ? (
        <div className="pv-dettagli">
          {r.problemi_comuni.length ? (
            <>
              <h2 className="s-h3">Guasti più comuni di questa centralina</h2>
              <ul className="s-elenco">{r.problemi_comuni.map((p) => <li key={p.problema}><b>{p.problema}</b>{p.sintomi}</li>)}</ul>
            </>
          ) : null}
          {r.veicoli.length ? <p className="s-muted">Montata su: {r.veicoli.join(", ")}.</p> : null}
          {r.codici.length ? <p className="s-muted">Codici: <span className="s-mono">{r.codici.join(", ")}</span></p> : null}
          {r.pagina ? <p><a href={`${base}/centraline/${r.pagina}`}>Scheda completa di questa centralina</a></p> : null}
        </div>
      ) : null}
    </>
  );
}
