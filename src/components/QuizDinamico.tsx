"use client";
import { useEffect, useState } from "react";
import { NODI, INIZIO, prossimo, type Risposte } from "@/sito/quiz";

/**
 * Una domanda alla volta: la risposta decide la successiva.
 * Scrive le risposte in un campo nascosto «quiz» del modulo che lo contiene.
 */
export function QuizDinamico({ onCompleto, iniziali }: { onCompleto?: (r: Risposte) => void; iniziali?: Risposte }) {
  const [r, setR] = useState<Risposte>(iniziali ?? {});
  const [storia, setStoria] = useState<string[]>([INIZIO]);
  const [finito, setFinito] = useState(false);
  const id = storia[storia.length - 1];
  const n = NODI[id];
  const scelte = Array.isArray(r[id]) ? (r[id] as string[]) : [];

  useEffect(() => { if (finito) onCompleto?.(r); }, [finito]); // eslint-disable-line react-hooks/exhaustive-deps

  function avanti(nuove: Risposte) {
    const dopo = prossimo(id, nuove);
    if (dopo) setStoria((s) => [...s, dopo]);
    else setFinito(true);
  }
  function scegli(v: string) {
    if (n.multipla) {
      const set = scelte.includes(v) ? scelte.filter((x) => x !== v) : n.max && scelte.length >= n.max ? scelte : [...scelte, v];
      setR({ ...r, [id]: set });
    } else {
      const nuove = { ...r, [id]: v };
      setR(nuove);
      setTimeout(() => avanti(nuove), 160);
    }
  }
  function indietro() {
    if (finito) { setFinito(false); return; }
    if (storia.length > 1) setStoria((s) => s.slice(0, -1));
  }

  // Progresso stimato: i percorsi durano tra 8 e 11 domande
  const perc = finito ? 100 : Math.min(95, Math.round((storia.length / 10) * 100));

  return (
    <div className="qz">
      <input type="hidden" name="quiz" value={JSON.stringify(r)} />
      <div className="qz-barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={perc} aria-label="Avanzamento del questionario"><i style={{ width: `${perc}%` }} /></div>
      {finito ? (
        <div className="qz-fine">
          <p className="qz-domanda">Fatto, grazie.</p>
          <button type="button" className="qz-link" onClick={indietro}>Cambia l&apos;ultima risposta</button>
        </div>
      ) : (
        <fieldset className="qz-passo" key={id}>
          <legend className="qz-domanda">{n.testo}</legend>
          {n.aiuto ? <p className="qz-aiuto">{n.aiuto}</p> : null}
          <div className="qz-opzioni">
            {n.opzioni.map((o) => {
              const attiva = n.multipla ? scelte.includes(o.v) : r[id] === o.v;
              return (
                <button type="button" key={o.v} className={`qz-op${attiva ? " qz-attiva" : ""}`} aria-pressed={attiva} onClick={() => scegli(o.v)}>{o.t}</button>
              );
            })}
          </div>
          <div className="qz-nav">
            {storia.length > 1 ? <button type="button" className="qz-link" onClick={indietro}>Indietro</button> : <span />}
            {n.multipla ? <button type="button" className="qz-avanti" disabled={!scelte.length} onClick={() => avanti(r)}>Avanti</button> : null}
          </div>
        </fieldset>
      )}
    </div>
  );
}
