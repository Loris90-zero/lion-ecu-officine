"use client";
import { useActionState, useState } from "react";
import { salvaImpostazioni, aggiungiStaff, salvaFedelta, type StatoLab } from "../azioni";
import type { RegoleFedelta } from "@/lib/fedelta";
import { calcolaPrezzo, type Impostazioni } from "@/lib/prezzo";
import { eur } from "@/lib/fasi";

export function FormImpostazioni({ imp }: { imp: Impostazioni }) {
  const [stato, azione, inCorso] = useActionState<StatoLab, FormData>(salvaImpostazioni, {});
  const [v, setV] = useState({ percentuale: Math.round(Number(imp.percentuale) * 100), minimo_eur: Number(imp.minimo_eur), arrotonda_eur: Number(imp.arrotonda_eur), base: imp.base });
  const esempio = calcolaPrezzo([1200, 1490, 1900], { percentuale: v.percentuale / 100, minimo_eur: v.minimo_eur, arrotonda_eur: v.arrotonda_eur, base: v.base });
  return (
    <form action={azione}>
      <div className="grid2">
        <div className="field"><label htmlFor="percentuale">Percentuale sul nuovo (%)</label><input id="percentuale" name="percentuale" inputMode="decimal" value={v.percentuale} onChange={(e) => setV({ ...v, percentuale: Number(e.target.value) })} /></div>
        <div className="field"><label htmlFor="minimo_eur">Prezzo minimo (€)</label><input id="minimo_eur" name="minimo_eur" inputMode="decimal" value={v.minimo_eur} onChange={(e) => setV({ ...v, minimo_eur: Number(e.target.value) })} /></div>
      </div>
      <div className="grid2">
        <div className="field"><label htmlFor="arrotonda_eur">Arrotonda a (€)</label><input id="arrotonda_eur" name="arrotonda_eur" inputMode="decimal" value={v.arrotonda_eur} onChange={(e) => setV({ ...v, arrotonda_eur: Number(e.target.value) })} /></div>
        <div className="field"><label htmlFor="base">Prezzo del nuovo da usare</label>
          <select id="base" name="base" value={v.base} onChange={(e) => setV({ ...v, base: e.target.value as Impostazioni["base"] })}>
            <option value="mediana">Valore centrale tra quelli trovati</option>
            <option value="minimo">Il più basso trovato</option>
            <option value="massimo">Il più alto trovato</option>
          </select>
        </div>
      </div>
      <div className="grid2">
        <div className="field"><label htmlFor="cambio_usd">1 dollaro in euro</label><input id="cambio_usd" name="cambio_usd" inputMode="decimal" defaultValue={Number(imp.cambio_usd ?? 0.9)} /></div>
        <div className="field"><label htmlFor="cambio_gbp">1 sterlina in euro</label><input id="cambio_gbp" name="cambio_gbp" inputMode="decimal" defaultValue={Number(imp.cambio_gbp ?? 1.15)} /></div>
      </div>
      <div className="field"><label htmlFor="soglia_anomali">Escludi i &quot;nuovi&quot; sotto questa % del nuovo più caro trovato</label><input id="soglia_anomali" name="soglia_anomali" inputMode="decimal" defaultValue={Math.round(Number(imp.soglia_anomali ?? 0.4) * 100)} /><span className="hint">Serve a scartare usati o compatibili classificati male come nuovi.</span></div>
      {esempio ? <p className="hint">Esempio: con prezzi del nuovo a 1.200, 1.490 e 1.900 € la riparazione costa {eur(esempio.prezzo)} (risparmio {esempio.risparmio}%).</p> : null}
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
