"use client";
import { useEffect, useRef, useState } from "react";

/** Numero che sale da zero all'apertura della pagina. */
export function Numero({ v, euro = false, dec = 0 }: { v: number | null; euro?: boolean; dec?: number }) {
  const [n, setN] = useState(0);
  const fatto = useRef(false);
  useEffect(() => {
    if (v === null || fatto.current) return;
    fatto.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(v); return; }
    const t0 = performance.now(), durata = 900;
    let id = 0;
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / durata);
      setN(v * (1 - Math.pow(1 - k, 3)));
      if (k < 1) id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [v]);
  if (v === null) return <>—</>;
  const testo = n.toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return <>{testo}{euro ? <span className="mk-eur"> €</span> : null}</>;
}
