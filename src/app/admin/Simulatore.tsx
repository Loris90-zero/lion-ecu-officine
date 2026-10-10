"use client";
import { useState } from "react";

const e = (v: number) => Math.round(v).toLocaleString("it-IT") + " €";

/** Se spendo X in pubblicità, quante officine e quanto margine mi aspetto. */
export function Simulatore({ cac, valore, mesi }: { cac: number | null; valore: number | null; mesi: number }) {
  const [budget, setBudget] = useState(2000);
  const [cacUsato, setCac] = useState(cac ? Math.round(cac) : 300);
  const officine = cacUsato > 0 ? budget / cacUsato : 0;
  const margine = valore ? officine * valore : null;
  return (
    <div className="section" style={{ gap: 10 }}>
      <div className="grid2">
        <div className="field"><label htmlFor="sim-b">Budget pubblicità al mese (€)</label><input id="sim-b" inputMode="numeric" value={budget} onChange={(x) => setBudget(Number(x.target.value) || 0)} /></div>
        <div className="field"><label htmlFor="sim-c">Costo per officina acquisita (€)</label><input id="sim-c" inputMode="numeric" value={cacUsato} onChange={(x) => setCac(Number(x.target.value) || 0)} /><span className="hint">{cac ? "Precompilato con il vostro dato reale." : "Ancora nessun dato reale: è una stima da cambiare."}</span></div>
      </div>
      <p style={{ margin: 0 }}>
        Circa <b>{officine.toFixed(1)} officine nuove al mese</b>.
        {margine !== null ? <> Ogni mese di pubblicità porta circa <b>{e(margine)}</b> di margine nei {mesi} mesi successivi (contro {e(budget)} spesi).</> : <> Il margine si calcola appena ci sono pratiche pagate.</>}
      </p>
    </div>
  );
}
