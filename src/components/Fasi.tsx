import { FASI, classeFase } from "@/lib/fasi";
import type { Pratica } from "@/lib/types";

export function PillaFase({ p }: { p: Pratica }) {
  if (p.esito === "non_riparabile") return <span className="pill p-danger">Non riparabile</span>;
  if (p.fase === 2 && p.esito === "riparabile" && !p.pagato) return <span className="pill p-warn">Da pagare</span>;
  return <span className={`pill ${classeFase(p.fase)}`}>{FASI[p.fase]}</span>;
}

export function BarraFasi({ fase }: { fase: number }) {
  return (
    <div className="steps" aria-label={`Fase ${fase + 1} di ${FASI.length}`}>
      {FASI.map((_, i) => <i key={i} className={i < fase ? "done" : i === fase ? "now" : ""} />)}
    </div>
  );
}
