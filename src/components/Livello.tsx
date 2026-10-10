import type { Livello } from "@/lib/fedelta";
import { pct } from "@/lib/fedelta";

const n = (x: number) => x.toLocaleString("it-IT");

/** Card del programma punti nella home dell'officina. */
export function CardLivello({ l }: { l: Livello }) {
  const perc = l.prossimo ? Math.min(100, Math.round((l.punti / l.prossimo.soglia) * 100)) : 100;
  return (
    <div className="box livello">
      <div className="row">
        <div>
          <span className="label">Il tuo livello</span>
          <h3 style={{ margin: 0 }}>{l.nome}{l.sconto ? <span className="badge-sconto">−{pct(l.sconto)}</span> : null}</h3>
        </div>
        <div style={{ textAlign: "right" }}>
          <b className="mono" style={{ fontSize: 22 }}>{n(l.punti)}</b>
          <span className="hint" style={{ display: "block" }}>punti</span>
        </div>
      </div>
      <div className="barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={perc}><i style={{ width: `${perc}%` }} /></div>
      <p className="hint" style={{ margin: 0 }}>
        {l.prossimo
          ? <>Ti mancano <b>{n(l.prossimo.mancano)} punti</b> per diventare <b>{l.prossimo.nome}</b> e avere il <b>{pct(l.prossimo.sconto)}</b> di sconto su ogni riparazione.</>
          : <>Sei al livello più alto: <b>{pct(l.sconto)}</b> di sconto su ogni riparazione.</>}
        {" "}1 punto per ogni € speso (IVA esclusa), negli ultimi {l.mesi} mesi.
      </p>
    </div>
  );
}
