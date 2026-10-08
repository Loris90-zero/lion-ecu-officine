"use client";
import { useActionState } from "react";
import { aggiornaPratica, type StatoLab } from "../../azioni";
import { FASI } from "@/lib/fasi";
import type { Pratica } from "@/lib/types";

export function FormLab({ p }: { p: Pratica }) {
  const [stato, azione, inCorso] = useActionState<StatoLab, FormData>(aggiornaPratica, {});
  return (
    <form action={azione}>
      <input type="hidden" name="id" value={p.id} />
      <div className="field"><label htmlFor="fase">Fase</label>
        <select id="fase" name="fase" defaultValue={p.fase}>{FASI.map((f, i) => <option key={f} value={i}>{i + 1}. {f}</option>)}</select>
      </div>
      <div className="grid2">
        <div className="field"><label htmlFor="esito">Esito diagnosi</label>
          <select id="esito" name="esito" defaultValue={p.esito ?? ""}>
            <option value="">Non ancora</option>
            <option value="riparabile">Riparabile</option>
            <option value="non_riparabile">Non riparabile</option>
          </select>
        </div>
        <div className="field"><label htmlFor="prezzo_confermato_eur">Prezzo confermato (€)</label>
          <input id="prezzo_confermato_eur" name="prezzo_confermato_eur" inputMode="decimal" className="mono" defaultValue={p.prezzo_confermato_eur ?? p.prezzo_stimato_eur ?? ""} />
        </div>
      </div>
      <div className="field"><label htmlFor="nota_laboratorio">Nota per l&apos;officina</label>
        <textarea id="nota_laboratorio" name="nota_laboratorio" defaultValue={p.nota_laboratorio ?? ""} placeholder="Es. Driver iniettori in corto sul banco 2. Sostituiamo lo stadio finale e collaudiamo." />
      </div>
      <div className="field"><label htmlFor="guasto_riparato">Guasto riparato (va sul certificato)</label>
        <input id="guasto_riparato" name="guasto_riparato" defaultValue={p.guasto_riparato ?? ""} />
      </div>
      <div className="grid2">
        <div className="field"><label htmlFor="corriere">Corriere</label><input id="corriere" name="corriere" defaultValue={p.corriere ?? ""} placeholder="BRT, GLS…" /></div>
        <div className="field"><label htmlFor="tracking">Tracking</label><input id="tracking" name="tracking" className="mono" defaultValue={p.tracking ?? ""} /></div>
      </div>
      {!p.pagato ? <label className="check"><input type="checkbox" name="pagato_manuale" /><span>Segna come pagata (bonifico o pagamento fuori dall&apos;app)</span></label> : null}
      {stato.errore ? <p className="err">{stato.errore}</p> : null}
      {stato.ok ? <p className="okmsg">{stato.ok}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={inCorso}>{inCorso ? "Salvataggio…" : "Salva"}</button>
      <p className="hint">Quando imposti &quot;Riparabile&quot; con il prezzo, l&apos;officina vede il pulsante per pagare. &quot;Non riparabile&quot; le dice che la rispediamo gratis.</p>
    </form>
  );
}
