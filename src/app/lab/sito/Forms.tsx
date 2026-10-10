"use client";
import { useActionState } from "react";
import { creaDaCodice, creaGuida, salvaCentralina, salvaGuida, type StatoSito } from "./azioni";
import { MEZZI } from "@/sito/config";
import type { PaginaCentralina, Articolo } from "@/sito/dati";

const Esito = ({ s }: { s: StatoSito }) => <>{s.errore ? <p className="err">{s.errore}</p> : null}{s.ok ? <p className="okmsg">{s.ok}</p> : null}</>;

export function FormDaCodice() {
  const [s, a, c] = useActionState<StatoSito, FormData>(creaDaCodice, {});
  return (
    <form action={a}>
      <div className="field"><label htmlFor="cod">Codice centralina</label><input id="cod" name="codice" className="mono" placeholder="0281 020 459" /></div>
      <Esito s={s} />
      <button className="btn btn-primary" disabled={c}>{c ? "Cerco e preparo la bozza… (fino a 2 minuti)" : "Crea la bozza"}</button>
    </form>
  );
}

export function FormNuovaGuida({ centraline }: { centraline: { slug: string; titolo: string }[] }) {
  const [s, a, c] = useActionState<StatoSito, FormData>(creaGuida, {});
  return (
    <form action={a}>
      <div className="field"><label htmlFor="arg">Argomento</label><input id="arg" name="argomento" placeholder="Es. Iveco Stralis in recovery sotto carico: quando è la centralina" /></div>
      <div className="field"><label htmlFor="cen">Collega a una centralina (facoltativo)</label><select id="cen" name="centralina"><option value="">Nessuna</option>{centraline.map((x) => <option key={x.slug} value={x.slug}>{x.titolo}</option>)}</select></div>
      <Esito s={s} />
      <button className="btn btn-primary" disabled={c}>{c ? "L'AI scrive la bozza…" : "Scrivi la bozza con l'AI"}</button>
    </form>
  );
}

export function FormCentralina({ p }: { p: PaginaCentralina & { stato: string } }) {
  const [s, a, c] = useActionState<StatoSito, FormData>(salvaCentralina, {});
  return (
    <form action={a}>
      <input type="hidden" name="slug" value={p.slug} />
      <div className="grid2">
        <div className="field"><label htmlFor="ti">Titolo</label><input id="ti" name="titolo" defaultValue={p.titolo} /></div>
        <div className="field"><label htmlFor="co">Codici</label><input id="co" name="codice" className="mono" defaultValue={p.codice ?? ""} /></div>
      </div>
      <div className="field"><label htmlFor="tp">Tipo</label><input id="tp" name="tipo" defaultValue={p.tipo ?? ""} placeholder="Es. centralina motore diesel" /></div>
      <div className="field"><label htmlFor="de">Descrizione</label><textarea id="de" name="descrizione" defaultValue={p.descrizione ?? ""} /></div>
      <div className="grid2">
        <div className="field"><label htmlFor="pd">Riparazione da (€, IVA esclusa)</label><input id="pd" name="prezzo_da" inputMode="decimal" defaultValue={p.prezzo_da ?? ""} /><span className="hint">Controllalo: è il prezzo che vede chiunque.</span></div>
        <div className="field"><label htmlFor="pn">Prezzo del nuovo indicativo (€)</label><input id="pn" name="prezzo_nuovo" inputMode="decimal" defaultValue={p.prezzo_nuovo ?? ""} /></div>
      </div>
      <div className="field"><label htmlFor="ve">Veicoli (separati da virgola)</label><input id="ve" name="veicoli" defaultValue={p.veicoli.join(", ")} /></div>
      <fieldset><legend>Mezzi</legend><div className="chips">{MEZZI.map((m) => <label key={m.slug} className="chip"><input type="checkbox" name="mezzi" value={m.slug} defaultChecked={p.mezzi.includes(m.slug)} /><span>{m.nome}</span></label>)}</div></fieldset>
      <div className="field"><label htmlFor="gu">Guasti comuni (uno per riga: «Guasto: sintomi»)</label><textarea id="gu" name="guasti" rows={6} defaultValue={p.guasti.map((g) => `${g.titolo}: ${g.sintomi}`).join("\n")} /></div>
      <div className="field"><label htmlFor="fq">Domande frequenti (una per riga: «Domanda | Risposta»)</label><textarea id="fq" name="faq" rows={5} defaultValue={p.faq.map((f) => `${f.domanda} | ${f.risposta}`).join("\n")} /></div>
      <Esito s={s} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-ghost" name="azione" value="salva" disabled={c}>Salva bozza</button>
        {p.stato === "pubblicata"
          ? <button className="btn btn-ghost" name="azione" value="ritira" disabled={c}>Togli dal sito</button>
          : <button className="btn btn-primary" name="azione" value="pubblica" disabled={c}>Salva e pubblica</button>}
        <button className="linkbtn" name="azione" value="elimina" disabled={c}>Elimina</button>
      </div>
    </form>
  );
}

export function FormGuida({ g }: { g: Articolo & { stato: string } }) {
  const [s, a, c] = useActionState<StatoSito, FormData>(salvaGuida, {});
  return (
    <form action={a}>
      <input type="hidden" name="slug" value={g.slug} />
      <div className="field"><label htmlFor="gt">Titolo</label><input id="gt" name="titolo" defaultValue={g.titolo} /></div>
      <div className="field"><label htmlFor="gs">Sommario (per Google, max 160 caratteri)</label><input id="gs" name="sommario" defaultValue={g.sommario ?? ""} /></div>
      <div className="field"><label htmlFor="gc">Testo («## » per i titoli, «- » per gli elenchi)</label><textarea id="gc" name="corpo" rows={22} defaultValue={g.corpo} /></div>
      <Esito s={s} />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-ghost" name="azione" value="salva" disabled={c}>Salva bozza</button>
        {g.stato === "pubblicata"
          ? <button className="btn btn-ghost" name="azione" value="ritira" disabled={c}>Togli dal sito</button>
          : <button className="btn btn-primary" name="azione" value="pubblica" disabled={c}>Salva e pubblica</button>}
        <button className="linkbtn" name="azione" value="elimina" disabled={c}>Elimina</button>
      </div>
    </form>
  );
}
