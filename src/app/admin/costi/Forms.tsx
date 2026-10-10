"use client";
import { useActionState } from "react";
import { aggiungiRicorrente, aggiungiCosto, aggiungiBene, type StatoF } from "../azioni";

const CAT = [["operai", "Operai (costo azienda mensile)"], ["affitto_utenze", "Affitto e utenze"], ["commercialista", "Commercialista"], ["software", "Software e abbonamenti"], ["pubblicita", "Pubblicità"], ["assicurazioni", "Assicurazioni"], ["altro", "Altro"]] as const;
const CAT_C = [...CAT, ["corriere", "Corriere (extra)"], ["materiali", "Materiali (extra)"], ["attrezzature", "Piccole attrezzature"]] as const;
const Esito = ({ s }: { s: StatoF }) => <>{s.errore ? <p className="err">{s.errore}</p> : null}{s.ok ? <p className="okmsg">{s.ok}</p> : null}</>;

export function FormRicorrente() {
  const [s, a, c] = useActionState<StatoF, FormData>(aggiungiRicorrente, {});
  return (
    <form action={a}>
      <div className="grid2">
        <div className="field"><label htmlFor="r-nome">Voce</label><input id="r-nome" name="nome" placeholder="Es. Mario Rossi, tecnico · Affitto capannone" required /></div>
        <div className="field"><label htmlFor="r-cat">Categoria</label><select id="r-cat" name="categoria">{CAT.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></div>
      </div>
      <div className="grid2">
        <div className="field"><label htmlFor="r-imp">Importo al mese (€, IVA esclusa)</label><input id="r-imp" name="importo" inputMode="decimal" required /></div>
        <div className="field"><label htmlFor="r-iva">IVA detraibile (%)</label><input id="r-iva" name="iva" inputMode="decimal" defaultValue="22" /><span className="hint">0 per stipendi e voci senza IVA</span></div>
      </div>
      <div className="field"><label htmlFor="r-dal">Dal mese</label><input id="r-dal" name="dal" type="month" defaultValue={new Date().toISOString().slice(0, 7)} /></div>
      <Esito s={s} />
      <button className="btn btn-primary" disabled={c}>Aggiungi costo mensile</button>
    </form>
  );
}

export function FormCosto() {
  const [s, a, c] = useActionState<StatoF, FormData>(aggiungiCosto, {});
  return (
    <form action={a}>
      <div className="grid2">
        <div className="field"><label htmlFor="c-desc">Descrizione</label><input id="c-desc" name="descrizione" placeholder="Es. Campagna Meta ottobre" required /></div>
        <div className="field"><label htmlFor="c-cat">Categoria</label><select id="c-cat" name="categoria">{CAT_C.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></div>
      </div>
      <div className="grid2">
        <div className="field"><label htmlFor="c-imp">Importo (€, IVA esclusa)</label><input id="c-imp" name="importo" inputMode="decimal" required /></div>
        <div className="field"><label htmlFor="c-iva">IVA detraibile (%)</label><input id="c-iva" name="iva" inputMode="decimal" defaultValue="22" /></div>
      </div>
      <div className="field"><label htmlFor="c-data">Data</label><input id="c-data" name="data" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
      <Esito s={s} />
      <button className="btn btn-primary" disabled={c}>Aggiungi spesa</button>
    </form>
  );
}

export function FormBene() {
  const [s, a, c] = useActionState<StatoF, FormData>(aggiungiBene, {});
  return (
    <form action={a}>
      <div className="field"><label htmlFor="b-nome">Attrezzatura</label><input id="b-nome" name="nome" placeholder="Es. Banco prova centraline" required /></div>
      <div className="grid2">
        <div className="field"><label htmlFor="b-costo">Costo (€, IVA esclusa)</label><input id="b-costo" name="costo" inputMode="decimal" required /></div>
        <div className="field"><label htmlFor="b-anni">Anni di ammortamento</label><input id="b-anni" name="anni" inputMode="decimal" defaultValue="5" /></div>
      </div>
      <div className="field"><label htmlFor="b-data">Data di acquisto</label><input id="b-data" name="acquistato_il" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
      <Esito s={s} />
      <button className="btn btn-primary" disabled={c}>Aggiungi attrezzatura</button>
    </form>
  );
}
