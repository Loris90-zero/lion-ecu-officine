"use client";
import { useEffect, useState } from "react";

type BIP = Event & { prompt: () => Promise<void> };

/** Invito a installare la webapp sulla schermata Home, solo se non è già installata. */
export function Installa() {
  const [mostra, setMostra] = useState(false);
  const [ios, setIos] = useState(false);
  const [evento, setEvento] = useState<BIP | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    let chiuso = false;
    try { chiuso = localStorage.getItem("installa-chiuso") === "1"; } catch {}
    if (standalone || chiuso) return;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setMostra(true);
    const h = (e: Event) => { e.preventDefault(); setEvento(e as BIP); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  if (!mostra) return null;
  const chiudi = () => { try { localStorage.setItem("installa-chiuso", "1"); } catch {} setMostra(false); };
  return (
    <div className="box" style={{ borderColor: "var(--accent)" }}>
      <div className="row"><b>Installa l&apos;app sul telefono</b><button className="linkbtn" onClick={chiudi}>Chiudi</button></div>
      {evento ? (
        <button className="btn btn-primary btn-block" onClick={async () => { await evento.prompt(); chiudi(); }}>Installa EcuLion</button>
      ) : null}
      <a className="btn btn-ghost btn-block" href="/installa">{ios ? "Come si fa su iPhone" : "Come si fa, passo per passo"}</a>
    </div>
  );
}
