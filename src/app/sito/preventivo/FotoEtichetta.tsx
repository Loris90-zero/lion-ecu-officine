"use client";
import { useRef, useState } from "react";
import { ridimensiona, aBase64 } from "@/lib/foto";
import { Wa } from "@/sito/Whatsapp";
import { Risultato, type R } from "./Risultato";

/** Preventivo dalla foto dell'etichetta: l'AI legge marca, modello e codici. */
export function FotoEtichetta({ base, app }: { base: string; app: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [stato, setStato] = useState<"scegli" | "invio" | "fatto">("scegli");
  const [anteprima, setAnteprima] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [r, setR] = useState<(R & { codice?: string }) | null>(null);

  async function scelta(f?: File | null) {
    if (!f) return;
    setErrore(null);
    try {
      const blob = await ridimensiona(f, 1600);
      setAnteprima(URL.createObjectURL(blob));
      setStato("invio");
      const res = await fetch("/api/cerca-pubblica", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ immagine: { data: await aBase64(blob), tipo: "image/jpeg" } }) });
      const j = await res.json();
      if (!res.ok || j.errore) { setErrore(j.errore ?? "Non siamo riusciti a leggere la foto."); setStato("scegli"); return; }
      setR(j); setStato("fatto");
    } catch {
      setErrore("Non siamo riusciti a leggere la foto. Riprova o scrivi il codice."); setStato("scegli");
    }
  }

  if (stato === "fatto" && r) {
    if (!r.trovata)
      return (
        <div className="pv-card">
          <h1 className="pv-nome">Dalla foto non riusciamo a leggere la centralina</h1>
          <p>Prova con una foto più vicina e dritta all&apos;etichetta, oppure scegli il tipo di centralina: ti diamo comunque il prezzo.</p>
          <a className="s-btn s-btn-p pv-avanti" href={`${base}/preventivo/senza-codice`}>Non ho il codice: scegli il tipo</a>
          <button type="button" className="s-btn s-btn-g" onClick={() => { setR(null); setStato("scegli"); }}>Rifai la foto</button>
          <Wa testo="Ciao EcuLion, vi mando la foto dell'etichetta della mia centralina." />
        </div>
      );
    return <Risultato q={r.codice || "dalla foto"} base={base} app={app} iniziale={r} />;
  }

  return (
    <div className="pv-card">
      <p className="pv-codice">Preventivo dalla foto</p>
      <h1 className="pv-nome">Fotografa l&apos;etichetta della centralina</h1>
      <p className="s-muted" style={{ margin: 0 }}>Avvicinati finché codici e scritte si leggono bene, senza riflessi. Il resto lo fa l&apos;AI.</p>
      {anteprima ? <img src={anteprima} alt="La tua foto" className="pv-foto" /> : null}
      {stato === "invio" ? (
        <div aria-live="polite"><p style={{ fontWeight: 600, margin: "6px 0" }}>Stiamo leggendo l&apos;etichetta…</p><div className="s-barra s-attesa" aria-hidden="true"><i /></div></div>
      ) : (
        <>
          <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={(e) => scelta(e.target.files?.[0])} />
          <button type="button" className="s-btn s-btn-p pv-avanti" onClick={() => input.current?.click()}>{anteprima ? "Rifai la foto" : "Scatta o scegli la foto"}</button>
        </>
      )}
      {errore ? <p className="s-err" role="alert">{errore}</p> : null}
      <Wa testo="Ciao EcuLion, vi mando la foto dell'etichetta della mia centralina." />
    </div>
  );
}
