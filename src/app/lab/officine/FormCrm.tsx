"use client";
import { useActionState } from "react";
import { salvaCrm, type StatoCrmForm } from "./azioni";
import { STATI_CRM } from "./stati";

export function FormCrm({ officinaId, stato, note, prossimo }: { officinaId: string; stato: string; note: string; prossimo: string }) {
  const [s, azione, inCorso] = useActionState<StatoCrmForm, FormData>(salvaCrm, {});
  return (
    <form action={azione}>
      <input type="hidden" name="officina_id" value={officinaId} />
      <div className="grid2">
        <div className="field"><label htmlFor="stato">Stato</label>
          <select id="stato" name="stato" defaultValue={stato}>{STATI_CRM.map((x) => <option key={x.v} value={x.v}>{x.nome}</option>)}</select>
        </div>
        <div className="field"><label htmlFor="prossimo_contatto">Ricontattare il</label><input id="prossimo_contatto" name="prossimo_contatto" type="date" defaultValue={prossimo} /></div>
      </div>
      <div className="field"><label htmlFor="note">Note interne (l&apos;officina non le vede)</label><textarea id="note" name="note" defaultValue={note} placeholder="Es. 3 meccanici, lavorano soprattutto Iveco e Scania. Richiamare dopo la fiera." /></div>
      {s.errore ? <p className="err">{s.errore}</p> : null}
      {s.ok ? <p className="okmsg">{s.ok}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={inCorso}>Salva</button>
    </form>
  );
}
