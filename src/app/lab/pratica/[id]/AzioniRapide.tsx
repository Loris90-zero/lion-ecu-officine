"use client";
import { useActionState, useState } from "react";
import { avanzaPratica, type EsitoPasso } from "./passi";
import { eur } from "@/lib/fasi";

type P = { id: string; fase: number; esito: string | null; pagato: boolean; prezzo_suggerito: number | null; sconto: number; consenso: boolean };

const CORRIERI = ["BRT", "GLS", "SDA", "DHL", "UPS", "FedEx/TNT", "Poste", "Altro"];

function Messaggio({ m }: { m: NonNullable<EsitoPasso["messaggio"]> }) {
  const [copiato, setCopiato] = useState(false);
  return (
    <div className="box msg-pronto">
      <span className="label">Messaggio per l&apos;officina</span>
      <p className="msg-testo">{m.testo}</p>
      {!m.consenso ? <p className="hint">Attenzione: l&apos;officina non ha dato il consenso agli aggiornamenti su WhatsApp. Valuta una chiamata.</p> : null}
      <div className="grid2">
        <a className="btn btn-primary" href={m.wa} target="_blank" rel="noopener noreferrer">Invia su WhatsApp</a>
        <button className="btn btn-ghost" type="button" onClick={() => navigator.clipboard.writeText(m.testo).then(() => setCopiato(true))}>{copiato ? "Copiato" : "Copia testo"}</button>
      </div>
    </div>
  );
}

/** I passi della pratica, uno alla volta, con bottoni grandi per il telefono. */
export function AzioniRapide({ p }: { p: P }) {
  const [s, azione, inCorso] = useActionState<EsitoPasso, FormData>(avanzaPratica, {});
  const [esito, setEsito] = useState<"" | "riparabile" | "non_riparabile">("");
  const [prezzo, setPrezzo] = useState(p.prezzo_suggerito ? String(p.prezzo_suggerito) : "");
  const n = Number(prezzo.replace(",", "."));

  let corpo: React.ReactNode = null;
  if (p.fase === 0) {
    corpo = <button className="btn btn-primary btn-block btn-xl" name="passo" value="arrivata" disabled={inCorso}>Il pezzo è arrivato in laboratorio</button>;
  } else if (p.fase === 1) {
    corpo = <button className="btn btn-primary btn-block btn-xl" name="passo" value="diagnosi" disabled={inCorso}>Inizio la diagnosi</button>;
  } else if (p.fase === 2 && !p.esito) {
    corpo = (
      <>
        <span className="flabel">Esito della diagnosi</span>
        <div className="grid2">
          <button type="button" className={`btn btn-xl ${esito === "riparabile" ? "btn-primary" : "btn-ghost"}`} onClick={() => setEsito("riparabile")}>Riparabile</button>
          <button type="button" className={`btn btn-xl ${esito === "non_riparabile" ? "btn-danger" : "btn-ghost"}`} onClick={() => setEsito("non_riparabile")}>Non riparabile</button>
        </div>
        {esito === "riparabile" ? (
          <div className="field"><label htmlFor="prezzo">Prezzo della riparazione (€, IVA esclusa)</label>
            <input id="prezzo" name="prezzo" inputMode="decimal" className="mono" value={prezzo} onChange={(e) => setPrezzo(e.target.value)} />
            {p.sconto && n > 0 ? <span className="hint">Con lo sconto dell&apos;officina pagherà {eur(Math.round(n * (1 - p.sconto) * 100) / 100)} + IVA.</span> : null}
          </div>
        ) : null}
        {esito ? (
          <>
            <div className="field"><label htmlFor="nota">Cosa avete trovato (lo legge l&apos;officina)</label><textarea id="nota" name="nota" placeholder={esito === "riparabile" ? "Es. Driver iniettori in corto, sostituiamo lo stadio finale." : "Es. Scheda bruciata in più punti, non recuperabile."} /></div>
            <button className="btn btn-primary btn-block btn-xl" name="passo" value={esito} disabled={inCorso || (esito === "riparabile" && !(n > 0))}>Conferma esito e avvisa l&apos;officina</button>
          </>
        ) : null}
      </>
    );
  } else if (p.fase === 2 && p.esito === "riparabile" && !p.pagato) {
    corpo = <p className="muted" style={{ margin: 0 }}>In attesa del pagamento dell&apos;officina. Quando paga ricevi una notifica e qui compare il passo successivo. Se paga con bonifico, segnalo in «Modifica avanzata».</p>;
  } else if (p.fase === 2 && p.esito) {
    corpo = (
      <>
        <span className="flabel">{p.esito === "riparabile" ? "Riparazione completata: spedisci all'officina" : "Rispedisci la centralina all'officina (gratis)"}</span>
        <div className="grid2">
          <div className="field"><label htmlFor="corriere">Corriere</label><select id="corriere" name="corriere" defaultValue="">{["", ...CORRIERI].map((c) => <option key={c} value={c}>{c || "Scegli…"}</option>)}</select></div>
          <div className="field"><label htmlFor="tracking">Tracking</label><input id="tracking" name="tracking" className="mono" autoComplete="off" /></div>
        </div>
        <button className="btn btn-primary btn-block btn-xl" name="passo" value="spedita" disabled={inCorso}>{p.esito === "riparabile" ? "Riparata e spedita" : "Rispedita"}: avvisa l&apos;officina</button>
      </>
    );
  } else if (p.fase === 3 && p.esito === "riparabile") {
    corpo = <p className="muted" style={{ margin: 0 }}>Spedita. Ora scrivi o detta la relazione della riparazione qui sotto: serve per il certificato di garanzia.</p>;
  } else {
    corpo = <p className="muted" style={{ margin: 0 }}>Nessun passo rapido da fare. Per altre modifiche usa «Modifica avanzata».</p>;
  }

  return (
    <div className="section" style={{ gap: 12 }}>
      {s.messaggio ? <Messaggio m={s.messaggio} /> : null}
      <form action={azione} className="box passo">
        <input type="hidden" name="id" value={p.id} />
        <span className="label">Prossimo passo</span>
        {corpo}
        {inCorso ? <p className="hint">Salvataggio…</p> : null}
        {s.errore ? <p className="err">{s.errore}</p> : null}
      </form>
      {!p.consenso ? <p className="hint">L&apos;officina non ha dato il consenso agli aggiornamenti su WhatsApp.</p> : null}
    </div>
  );
}
