"use client";
import { useActionState } from "react";
import { salvaParametri, type StatoF } from "../azioni";
import type { ImpFinanza } from "@/lib/finanza";

export function FormParametri({ i }: { i: ImpFinanza }) {
  const [s, a, c] = useActionState<StatoF, FormData>(salvaParametri, {});
  const p = (v: number) => Math.round(Number(v) * 1000) / 10;
  const campo = (k: string, label: string, v: number, hint?: string) => (
    <div className="field"><label htmlFor={k}>{label}</label><input id={k} name={k} inputMode="decimal" defaultValue={v} />{hint ? <span className="hint">{hint}</span> : null}</div>
  );
  return (
    <form action={a}>
      <div className="grid2">{campo("corriere_per_pratica", "Corriere per pratica, andata e ritorno (€)", Number(i.corriere_per_pratica))}{campo("materiali_per_pratica", "Materiali per pratica riparata (€)", Number(i.materiali_per_pratica))}</div>
      <div className="grid2">{campo("iva_vendite", "IVA sulle vendite (%)", p(i.iva_vendite))}{campo("iva_costi_variabili", "IVA su corriere e materiali (%)", p(i.iva_costi_variabili))}</div>
      <div className="grid2">{campo("commissione_pct", "Commissione pagamenti (%)", p(i.commissione_pct), "Controlla la tariffa sul tuo account Stripe")}{campo("commissione_fissa", "Commissione fissa per pagamento (€)", Number(i.commissione_fissa))}</div>
      {campo("aliquota_tasse", "Aliquota tasse stimata sull'utile (%)", p(i.aliquota_tasse), "Stima indicativa (es. IRES + IRAP): fattela confermare dal commercialista")}
      <div className="grid2">{campo("mesi_cliente", "Mesi medi in cui un'officina resta cliente", Number(i.mesi_cliente))}{campo("quota_cac", "Quota del valore da spendere per acquisirla (%)", p(i.quota_cac), "Prudente: 25–35%")}</div>
      {s.errore ? <p className="err">{s.errore}</p> : null}{s.ok ? <p className="okmsg">{s.ok}</p> : null}
      <button className="btn btn-primary" disabled={c}>Salva</button>
    </form>
  );
}
