"use client";
import { useState } from "react";

export function Paga({ praticaId, importo }: { praticaId: string; importo: string }) {
  const [stato, setStato] = useState<"idle" | "vai" | "errore">("idle");
  async function paga() {
    setStato("vai");
    try {
      const res = await fetch("/api/pagamento", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ praticaId }) });
      const j = await res.json();
      if (res.ok && j.url) { window.location.href = j.url; return; }
      setStato("errore");
    } catch { setStato("errore"); }
  }
  return (
    <>
      <button className="btn btn-primary btn-block" onClick={paga} disabled={stato === "vai"}>{stato === "vai" ? "Apro il pagamento…" : `Paga ${importo} e ripariamo`}</button>
      {stato === "errore" ? <p className="err">Il pagamento non si è aperto. Riprova, oppure scrivici.</p> : null}
    </>
  );
}
