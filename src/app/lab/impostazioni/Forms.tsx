"use client";
import { useActionState } from "react";
import { salvaImpostazioni, aggiungiStaff, salvaFedelta, type StatoLab } from "../azioni";
import type { RegoleFedelta } from "@/lib/fedelta";
import { fasceDa, FASCE_PREDEFINITE, CATEGORIE_CENTRALINA, type Categoria, type Impostazioni } from "@/lib/prezzo";
import { eur } from "@/lib/fasi";

export function FormImpostazioni({ imp }: { imp: Impostazioni }) {
  const [stato, azione, inCorso] = useActionState<StatoLab, FormData>(salvaImpostazioni, {});
  const fasce = fasceDa(imp.fasce);
  const righe = fasce.length < 3 ? [...fasce, ...FASCE_PREDEFINITE.slice(fasce.length)] : fasce;
  return (
    <form action={azione}>
      <input type="hidden" name="n_fasce" value={righe.length} />
      {righe.map((f, i) => (
        <fieldset key={i} className="box" style={{ gap: 8 }}>
          <div className="grid2">
            <div className="field"><label htmlFor={`f_nome_${i}`}>Nome</label><input id={`f_nome_${i}`} name={`f_nome_${i}`} defaultValue={f.nome} /></div>
            <div className="field"><label htmlFor={`f_prezzo_${i}`}>Prezzo (€ + IVA)</label><input id={`f_prezzo_${i}`} name={`f_prezzo_${i}`} inputMode="decimal" defaultValue={f.prezzo} /></div>
          </div>
          <div className="field"><label htmlFor={`f_desc_${i}`}>Cosa comprende (lo vede il cliente)</label><input id={`f_desc_${i}`} name={`f_desc_${i}`} defaultValue={f.descrizione} /></div>
          <div className="chips" role="group" aria-label={`Tipi di centralina in ${f.nome}`} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(Object.keys(CATEGORIE_CENTRALINA) as Categoria[]).map((c) => (
              <label key={c} className="hint" style={{ display: "flex", gap: 6, alignItems: "center", border: "1px solid var(--line)", borderRadius: 99, padding: "4px 10px" }}>
                <input type="checkbox" name={`f_cat_${i}`} value={c} defaultChecked={f.categorie.includes(c)} />{CATEGORIE_CENTRALINA[c]}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <label className="hint" style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
        <input type="checkbox" name="prezzo_da" defaultChecked={!!imp.prezzo_da} />
        Mostra il prezzo come «da … €» (può salire dopo la diagnosi). Senza spunta è un prezzo fisso.
      </label>
      <details>
        <summary className="hint">Confronto con il prezzo del nuovo</summary>
        <div className="grid2" style={{ marginTop: 10 }}>
          <div className="field"><label htmlFor="base">Prezzo del nuovo da mostrare</label>
            <select id="base" name="base" defaultValue={imp.base}>
              <option value="mediana">Valore centrale tra quelli trovati</option>
              <option value="minimo">Il più basso trovato</option>
              <option value="massimo">Il più alto trovato</option>
            </select>
          </div>
          <div className="field"><label htmlFor="soglia_anomali">Escludi i «nuovi» sotto questa % del più caro</label><input id="soglia_anomali" name="soglia_anomali" inputMode="decimal" defaultValue={Math.round(Number(imp.soglia_anomali ?? 0.4) * 100)} /></div>
        </div>
        <div className="grid2">
          <div className="field"><label htmlFor="cambio_usd">1 dollaro in euro</label><input id="cambio_usd" name="cambio_usd" inputMode="decimal" defaultValue={Number(imp.cambio_usd ?? 0.9)} /></div>
          <div className="field"><label htmlFor="cambio_gbp">1 sterlina in euro</label><input id="cambio_gbp" name="cambio_gbp" inputMode="decimal" defaultValue={Number(imp.cambio_gbp ?? 1.15)} /></div>
        </div>
        <p className="hint">Il prezzo del nuovo trovato online serve solo a mostrare al cliente quanto risparmia.</p>
      </details>
      {stato.errore ? <p className="err">{stato.errore}</p> : null}
      {stato.ok ? <p className="okmsg">{stato.ok}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={inCorso}>Salva</button>
    </form>
  );
}

export function FormStaff() {
  const [stato, azione, inCorso] = useActionState<StatoLab, FormData>(aggiungiStaff, {});
  return (
    <form action={azione}>
      <div className="grid2">
        <div className="field"><label htmlFor="s-email">Email</label><input id="s-email" name="email" type="email" /></div>
        <div className="field"><label htmlFor="s-nome">Nome</label><input id="s-nome" name="nome" /></div>
      </div>
      <div className="field"><label htmlFor="s-ruolo">Ruolo</label><select id="s-ruolo" name="ruolo"><option value="tecnico">Tecnico</option><option value="admin">Amministratore</option></select></div>
      {stato.errore ? <p className="err">{stato.errore}</p> : null}
      {stato.ok ? <p className="okmsg">{stato.ok}</p> : null}
      <button className="btn btn-ghost" type="submit" disabled={inCorso}>Aggiungi allo staff</button>
    </form>
  );
}

export function FormFedelta({ r }: { r: RegoleFedelta }) {
  const [stato, azione, inCorso] = useActionState<StatoLab, FormData>(salvaFedelta, {});
  return (
    <form action={azione}>
      <div className="field"><label htmlFor="fedelta_mesi">Conta la spesa degli ultimi (mesi)</label><input id="fedelta_mesi" name="fedelta_mesi" inputMode="numeric" defaultValue={Number(r.fedelta_mesi)} /></div>
      <div className="grid2">
        <div className="field"><label htmlFor="soglia_partner_eur">Partner da (punti = €)</label><input id="soglia_partner_eur" name="soglia_partner_eur" inputMode="decimal" defaultValue={Number(r.soglia_partner_eur)} /></div>
        <div className="field"><label htmlFor="sconto_partner">Sconto Partner (%)</label><input id="sconto_partner" name="sconto_partner" inputMode="decimal" defaultValue={Math.round(Number(r.sconto_partner) * 100)} /></div>
      </div>
      <div className="grid2">
        <div className="field"><label htmlFor="soglia_gold_eur">Partner Gold da (punti = €)</label><input id="soglia_gold_eur" name="soglia_gold_eur" inputMode="decimal" defaultValue={Number(r.soglia_gold_eur)} /></div>
        <div className="field"><label htmlFor="sconto_gold">Sconto Partner Gold (%)</label><input id="sconto_gold" name="sconto_gold" inputMode="decimal" defaultValue={Math.round(Number(r.sconto_gold) * 100)} /></div>
      </div>
      {stato.errore ? <p className="err">{stato.errore}</p> : null}
      {stato.ok ? <p className="okmsg">{stato.ok}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={inCorso}>Salva</button>
    </form>
  );
}
