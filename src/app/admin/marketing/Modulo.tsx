"use client";
import { useActionState, useEffect, useRef } from "react";
import type { Esito } from "./azioni";

/** Modulo con messaggio di esito e pulsante che mostra l'attesa. */
export function Modulo({ azione, pulsante, attesa = "Un attimo…", svuota = false, children, className = "mk-form" }: {
  azione: (s: Esito, fd: FormData) => Promise<Esito>; pulsante: string; attesa?: string; svuota?: boolean; children: React.ReactNode; className?: string;
}) {
  const [s, invia, inCorso] = useActionState(azione, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (s.ok && svuota) ref.current?.reset(); }, [s, svuota]);
  return (
    <form ref={ref} action={invia} className={className}>
      {children}
      <div className="mk-riga" style={{ justifyContent: "flex-start" }}>
        <button className="mk-btn" type="submit" disabled={inCorso}>{inCorso ? attesa : pulsante}</button>
        {s.ok ? <span className="mk-ok-msg" role="status">{s.ok}</span> : null}
        {s.errore ? <span className="mk-err" role="alert">{s.errore}</span> : null}
      </div>
    </form>
  );
}
