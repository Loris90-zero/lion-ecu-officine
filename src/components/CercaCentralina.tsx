"use client";
import { Fragment, useRef, useState } from "react";
import { eur } from "@/lib/fasi";
import { aBase64, ridimensiona } from "@/lib/foto";
import type { RisultatoCerca } from "@/lib/types";

export type Prefill = { centralina?: string; codice?: string; stima?: number | null; base?: number | null; nota?: string };

export function CercaCentralina({ onPrenota }: { onPrenota: (p: Prefill) => void }) {
  const [q, setQ] = useState("");
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [stato, setStato] = useState<"idle" | "cerca">("idle");
  const [errore, setErrore] = useState<string | null>(null);
  const [r, setR] = useState<RisultatoCerca | null>(null);
  const [sceltaFoto, setSceltaFoto] = useState(false);
  const ctl = useRef<AbortController | null>(null);

  async function cerca(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim() && !foto) return setErrore("Scrivi il codice dell'etichetta, oppure aggiungi una foto.");
    setErrore(null); setStato("cerca"); setR(null);
    ctl.current = new AbortController();
    try {
      const body: Record<string, unknown> = { q: q.trim() };
      if (foto) body.immagine = { data: await aBase64(foto.blob), tipo: "image/jpeg" };
      const res = await fetch("/api/cerca", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctl.current.signal });
      const j = await res.json();
      if (!res.ok) setErrore(j.errore || "La ricerca non è andata a buon fine.");
      else setR(j as RisultatoCerca);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setErrore("Connessione persa. Riprova.");
    } finally { setStato("idle"); }
  }

  async function scegliFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = "";
    setSceltaFoto(false);
    if (!f) return;
    const blob = await ridimensiona(f);
    setFoto({ blob, url: URL.createObjectURL(blob) });
  }

  const prefill = (x: RisultatoCerca): Prefill => ({
    centralina: [x.marca, x.modello].filter(Boolean).join(" "),
    codice: x.codici[0] || q,
    stima: x.prezzo?.prezzo ?? null,
    base: x.prezzo?.base ?? null,
  });

  return (
    <div className="section" style={{ gap: 14 }}>
      <form className="search" onSubmit={cerca} noValidate style={{ flexDirection: "row" }}>
        <input className="mono" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Es. 0281020459 o EDC17CV41" autoComplete="off" disabled={stato === "cerca"} aria-label="Codice centralina" />
        <button type="button" className="btn btn-ghost" style={{ padding: "0 12px" }} aria-label="Aggiungi foto dell'etichetta" aria-expanded={sceltaFoto} onClick={() => setSceltaFoto((v) => !v)} disabled={stato === "cerca"}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h3l2-3h6l2 3h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
        </button>
        <button className="btn btn-primary" type="submit" disabled={stato === "cerca"}>Cerca</button>
      </form>
      {sceltaFoto ? (
        <div className="grid2">
          <label className="btn btn-ghost">Scatta foto<input type="file" accept="image/*" capture="environment" hidden onChange={scegliFoto} /></label>
          <label className="btn btn-ghost">Carica dalla galleria<input type="file" accept="image/*" hidden onChange={scegliFoto} /></label>
        </div>
      ) : null}
      <details className="box" style={{ padding: "10px 14px" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Dove trovo il codice?</summary>
        <div className="section" style={{ gap: 8, marginTop: 10, fontSize: 14 }}>
          <p>Sull&apos;<b>etichetta della centralina</b> ci sono di solito più codici. Va bene uno qualsiasi:</p>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
            <li><b>Codice del costruttore della centralina</b>, es. Bosch <span className="mono">0281020459</span></li>
            <li><b>Codice ricambio del mezzo</b>, es. Iveco <span className="mono">5802061525</span>: spesso trova più prezzi</li>
            <li><b>Famiglia</b>, se stampata, es. <span className="mono">EDC17CV41</span></li>
          </ul>
          <p>Più codici e non sai quale scrivere? <b>Fotografa l&apos;etichetta</b> con il pulsante della fotocamera: li leggiamo noi.</p>
          <p>Etichetta illeggibile o centralina difficile da raggiungere? Leggi il codice con la <b>diagnosi</b> (identificazione centralina), oppure <button type="button" className="linkbtn" onClick={() => onPrenota({})}>prenota direttamente il ritiro</button>: la identifichiamo al banco.</p>
        </div>
      </details>
      {foto ? (
        <div className="row" style={{ justifyContent: "flex-start" }}>
          <img src={foto.url} alt="Foto da analizzare" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} />
          <button className="linkbtn" onClick={() => setFoto(null)}>Togli foto</button>
        </div>
      ) : null}
      {errore ? <p className="err">{errore}</p> : null}
      {stato === "cerca" ? (
        <div className="box">
          <b>Stiamo analizzando la tua centralina…</b>
          <p className="muted" style={{ fontSize: 14 }}>Identifichiamo il modello e prepariamo il preventivo di riparazione. Di solito ci vuole meno di un minuto.</p>
          <button className="btn btn-ghost btn-sm" onClick={() => ctl.current?.abort()}>Ferma</button>
        </div>
      ) : null}
      {r && !r.trovata ? (
        <div className="res">
          <h3>Non ho trovato questa centralina</h3>
          <p className="muted">Controlla il codice sull&apos;etichetta, oppure prenota il ritiro: la identifica il nostro tecnico al banco.</p>
          <button className="btn btn-primary btn-block" onClick={() => onPrenota({ codice: q })}>Prenota il ritiro: la identifichiamo noi</button>
        </div>
      ) : null}
      {r && r.trovata ? (
        <div className="res">
          <div className="section" style={{ gap: 6 }}>
            <span className="label">{r.tipo || "Centralina"}</span>
            <h2>{[r.marca, r.modello].filter(Boolean).join(" ")}</h2>
            {r.codici.length ? <div className="codes">{r.codici.map((c) => <span key={c}>{c}</span>)}</div> : null}
            {r.veicoli.length ? <p className="muted" style={{ fontSize: 13 }}>Montata su: {r.veicoli.join(", ")}</p> : null}
          </div>
          {foto ? <img className="preview-img" src={foto.url} alt="La tua foto della centralina" /> : null}
          {r.generico ? <p className="err" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>Hai cercato una famiglia di centraline: i prezzi possono riferirsi a modelli diversi. Per un prezzo preciso scrivi il codice completo dell&apos;etichetta o fotografala.</p> : null}
          <div className="prices">
            <div className="pnew">
              <span className="label">Centralina nuova</span>
              {r.prezzo ? (
                <><b>{eur(r.prezzo.base)}</b><span className="hint">Prezzo indicativo del ricambio nuovo</span></>
              ) : (<><b>—</b><span className="hint">Prezzo del nuovo non disponibile</span></>)}
            </div>
            <div className="prep">
              <span className="label">Riparazione Lion ECU</span>
              {r.prezzo ? (
                <><b>{eur(r.prezzo.prezzo)}</b>{r.prezzo.risparmio > 0 ? <span className="save">Risparmi circa il {r.prezzo.risparmio}%</span> : null}</>
              ) : (<><b style={{ fontSize: 20 }}>Su richiesta</b><span className="hint">Il prezzo te lo diamo noi, subito</span></>)}
            </div>
          </div>
          <button className="btn btn-primary btn-block" onClick={() => onPrenota(prefill(r))}>Prenota il ritiro di questa centralina</button>
          <p className="hint">Prezzo confermato dal tecnico dopo la diagnosi. Paghi solo se la centralina è riparabile, altrimenti te la rispediamo gratis.</p>
          {r.problemi_comuni.length ? (
            <div className="section" style={{ gap: 8 }}>
              <span className="label">Guasti più comuni</span>
              <ul className="probs">{r.problemi_comuni.map((p, i) => <li key={i}>{p.problema}{p.sintomi ? <span>{p.sintomi}</span> : null}</li>)}</ul>
              <p className="hint">Indicazioni generali: il guasto vero lo conferma la diagnosi al banco.</p>
            </div>
          ) : null}
          {r.dati_tecnici.length ? (
            <div className="box" style={{ padding: 12 }}><span className="label">Dati tecnici</span>
              <dl>{r.dati_tecnici.map((d, i) => <Fragment key={i}><dt>{d.voce}</dt><dd>{d.valore}</dd></Fragment>)}</dl>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
