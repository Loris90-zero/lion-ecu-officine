"use client";
import { useEffect, useState } from "react";

function chiave(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Bottone per ricevere le notifiche sul telefono (push web). */
export function AttivaNotifiche() {
  const [stato, setStato] = useState<"carico" | "no" | "spente" | "attive" | "negate" | "errore" | "ios">("carico");
  const [pub, setPub] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const pub = (await fetch("/api/push").then((r) => r.json()).catch(() => ({}))).chiave as string | null;
      setPub(pub);
      if (!pub || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        const ios = /iphone|ipad/i.test(navigator.userAgent) && !(window.matchMedia("(display-mode: standalone)").matches);
        return setStato(ios ? "ios" : "no");
      }
      if (Notification.permission === "denied") return setStato("negate");
      const reg = await navigator.serviceWorker.ready;
      setStato((await reg.pushManager.getSubscription()) ? "attive" : "spente");
    })().catch(() => setStato("no"));
  }, []);

  async function attiva() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setStato("negate");
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chiave(pub!) });
      const res = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      setStato(res.ok ? "attive" : "errore");
    } catch { setStato("errore"); }
  }

  async function disattiva() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
      await sub.unsubscribe();
    }
    setStato("spente");
  }

  if (stato === "carico") return null;
  return (
    <div className="box">
      <span className="label">Notifiche sul telefono</span>
      {stato === "attive" ? (
        <div className="row"><span>Attive su questo dispositivo.</span><button className="linkbtn" onClick={disattiva}>Disattiva</button></div>
      ) : stato === "spente" ? (
        <><p style={{ margin: 0, fontSize: 14 }}>Ricevi un avviso appena arriva un nuovo lavoro o un pagamento.</p><button className="btn btn-primary btn-block" onClick={attiva}>Attiva le notifiche</button></>
      ) : stato === "negate" ? (
        <p className="hint" style={{ margin: 0 }}>Le notifiche sono bloccate. Riattivale dalle impostazioni del browser per questo sito.</p>
      ) : stato === "ios" ? (
        <p className="hint" style={{ margin: 0 }}>Su iPhone: tocca Condividi → «Aggiungi alla schermata Home», apri l&apos;app da lì e torna in questa pagina.</p>
      ) : stato === "errore" ? (
        <><p className="err">Attivazione non riuscita.</p><button className="btn btn-ghost btn-block" onClick={attiva}>Riprova</button></>
      ) : (
        <p className="hint" style={{ margin: 0 }}>Questo dispositivo non supporta le notifiche, oppure non sono ancora configurate.</p>
      )}
    </div>
  );
}
