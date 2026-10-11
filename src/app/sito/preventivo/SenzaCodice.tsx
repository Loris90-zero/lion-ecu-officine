"use client";
import { useState } from "react";
import { Wa } from "@/sito/Whatsapp";
import { CATEGORIE_CENTRALINA, type Categoria, type Fascia } from "@/lib/prezzo";

const TIPI: { c: Categoria; nome: string; esempi: string }[] = [
  { c: "motore", nome: "Motore", esempi: "Centralina motore, iniezione" },
  { c: "cambio", nome: "Cambio", esempi: "Cambio automatizzato o automatico" },
  { c: "freni", nome: "Freni", esempi: "EBS, ABS, retarder" },
  { c: "sospensioni", nome: "Sospensioni", esempi: "Sospensioni pneumatiche, ECAS" },
  { c: "idraulica", nome: "Idraulica e gru", esempi: "Comandi idraulici, limitatore di carico" },
  { c: "cruscotto", nome: "Cruscotto", esempi: "Quadro strumenti, display" },
  { c: "carrozzeria", nome: "Body controller", esempi: "Luci, porte, clima, moduli di cabina" },
];
const eur = (n: number) => `${Math.round(n).toLocaleString("it-IT")} €`;

/** «Non ho il codice»: mezzo e tipo di centralina bastano per il prezzo della fascia. */
export function SenzaCodice({ fasce, da, mezzi, base }: { fasce: Fascia[]; da: boolean; mezzi: string[]; base: string }) {
  const [mezzo, setMezzo] = useState<string | null>(null);
  const [tipo, setTipo] = useState<Categoria | null>(null);
  const [descr, setDescr] = useState("");
  const [aiuto, setAiuto] = useState<{ perche: string; sicuro: boolean } | null>(null);
  const [attesa, setAttesa] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const fascia = tipo ? fasce.find((f) => f.categorie.includes(tipo)) ?? fasce.find((f) => f.categorie.includes("altro")) ?? fasce[0] : null;
  const nomeTipo = tipo ? (TIPI.find((t) => t.c === tipo)?.nome ?? CATEGORIE_CENTRALINA[tipo]) : "";

  async function chiediAllAI() {
    setErrore(null); setAttesa(true);
    try {
      const res = await fetch("/api/tipo-centralina", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mezzo, descrizione: descr }) });
      const j = await res.json();
      if (!res.ok || j.errore) setErrore(j.errore ?? "Non sono riuscito a capirlo.");
      else { setTipo(j.categoria); setAiuto({ perche: j.perche, sicuro: j.sicuro }); }
    } catch { setErrore("Non sono riuscito a capirlo. Scegli tu il tipo."); }
    setAttesa(false);
  }

  if (fascia && tipo && mezzo) {
    const centralina = `Centralina ${nomeTipo.toLowerCase()} · ${mezzo}`;
    const prenota = `${base}/prenota?centralina=${encodeURIComponent(centralina)}&stima=${fascia.prezzo}`;
    return (
      <div className="pv-card">
        <p className="pv-codice">Preventivo senza codice</p>
        <h1 className="pv-nome">{centralina}</h1>
        {aiuto ? <p className="pv-tipo">{aiuto.perche}{aiuto.sicuro ? "" : " Non è sicuro: lo verifichiamo al banco."}</p> : null}
        <div className="pv-prezzi">
          <div className="pv-nostro">
            <span>Riparazione EcuLion · {fascia.nome}</span>
            <b>{da ? <small>da </small> : null}{eur(fascia.prezzo)}<small> + IVA</small></b>
            <em className="pv-fisso">{fascia.descrizione}</em>
          </div>
        </div>
        <a className="s-btn s-btn-p pv-avanti" href={prenota}>Prenota il ritiro gratuito</a>
        <Wa testo={`Ciao EcuLion, ho una ${centralina.toLowerCase()} da riparare ma non ho il codice.`} />
        <ul className="s-garanzie"><li>Ritiro gratuito</li><li>Paghi solo se è riparabile</li><li>Garanzia a vita sul guasto</li></ul>
        <p className="pv-nota">Il codice lo leggiamo noi quando arriva la centralina. Se è di un&apos;altra fascia te lo diciamo prima di ripararla, e decidi tu.</p>
        <button type="button" className="s-btn s-btn-g" onClick={() => { setTipo(null); setAiuto(null); }}>Cambia tipo di centralina</button>
      </div>
    );
  }

  return (
    <div className="pv-card">
      <p className="pv-codice">Preventivo senza codice</p>
      <h1 className="pv-nome">{mezzo ? "Che centralina è?" : "Su che mezzo è montata?"}</h1>
      {!mezzo ? (
        <div className="sc-scelte">
          {mezzi.map((m) => <button key={m} type="button" className="sc-op" onClick={() => setMezzo(m)}>{m}</button>)}
        </div>
      ) : (
        <>
          <p className="s-muted" style={{ margin: 0 }}>{mezzo} · <button type="button" className="sc-link" onClick={() => { setMezzo(null); setTipo(null); }}>cambia mezzo</button></p>
          <div className="sc-scelte sc-tipi">
            {TIPI.map((t) => (
              <button key={t.c} type="button" className="sc-op" onClick={() => { setTipo(t.c); setAiuto(null); }}>
                <b>{t.nome}</b><small>{t.esempi}</small>
              </button>
            ))}
          </div>
          <details className="sc-aiuto">
            <summary>Non sai che centralina è? Descrivi il guasto</summary>
            <label htmlFor="sc-descr" className="s-muted">Cosa succede al mezzo, o quali errori dà la diagnosi</label>
            <textarea id="sc-descr" value={descr} onChange={(e) => setDescr(e.target.value)} rows={3} maxLength={500} placeholder="es. va in recovery sotto carico, errore EDC sulla diagnosi" />
            <button type="button" className="s-btn s-btn-p" disabled={attesa || descr.trim().length < 8} onClick={chiediAllAI}>{attesa ? "Ci penso…" : "Dimmi che centralina è"}</button>
            {errore ? <p className="s-err" role="alert">{errore}</p> : null}
          </details>
        </>
      )}
      <Wa testo="Ciao EcuLion, ho una centralina da riparare ma non trovo il codice." />
    </div>
  );
}
