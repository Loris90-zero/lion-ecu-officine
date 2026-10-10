"use client";
import { useEffect, useRef, useState } from "react";
import { CercaCentralina, type Prefill } from "./CercaCentralina";
import { FormRitiro } from "@/app/(officina)/ritiro/FormRitiro";

type Props = { userId: string; indirizzo: string | null; iniziale?: Prefill | null; sconto?: number; livello?: string };

/** Un solo flusso: cerca la centralina, poi prenota il ritiro nella stessa schermata. */
export function Flusso({ userId, indirizzo, iniziale = null, sconto = 0, livello = "Base" }: Props) {
  const [ritiro, setRitiro] = useState<Prefill | null>(iniziale);
  const [chiave, setChiave] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ritiro) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [ritiro, chiave]);

  const prenota = (p: Prefill) => { setRitiro(p); setChiave((k) => k + 1); };

  return (
    <div className="section" style={{ gap: 16 }}>
      <div className="cta">
        <h2>Centralina guasta? Scrivi il codice o fotografa l&apos;etichetta.</h2>
        <p>Ti diciamo cos&apos;è, quanto costa nuova e quanto costa ripararla. Poi prenoti il ritiro gratis, da qui.</p>
        <div className="sla"><div><b>24h</b><span>ritiro</span></div><div><b>24h</b><span>diagnosi e riparazione</span></div><div><b>24h</b><span>riconsegna</span></div></div>
      </div>
      <CercaCentralina onPrenota={prenota} sconto={sconto} livello={livello} />
      {!ritiro ? (
        <button className="btn btn-ghost btn-block" onClick={() => prenota({})}>Non hai il codice? Prenota il ritiro senza</button>
      ) : (
        <div ref={formRef} className="box" style={{ borderColor: "var(--accent)", scrollMarginTop: 80 }}>
          <div className="row"><h2>Prenota il ritiro</h2><button className="linkbtn" onClick={() => setRitiro(null)}>Chiudi</button></div>
          <FormRitiro
            key={chiave}
            userId={userId}
            indirizzo={indirizzo}
            centralina={ritiro.centralina ?? ""}
            codice={ritiro.codice ?? ""}
            stima={ritiro.stima ?? null}
            base={ritiro.base ?? null}
            nota={ritiro.nota ?? ""}
            sconto={sconto}
          />
        </div>
      )}
    </div>
  );
}
