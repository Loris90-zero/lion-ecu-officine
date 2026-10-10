"use client";
import { useEffect } from "react";

function invia(dati: Record<string, string>) {
  try {
    const body = JSON.stringify(dati);
    if (navigator.sendBeacon) navigator.sendBeacon("/api/traccia", new Blob([body], { type: "text/plain" }));
    else fetch("/api/traccia", { method: "POST", body, keepalive: true });
  } catch { /* niente */ }
}

function sessione() {
  try {
    let s = sessionStorage.getItem("el_ses");
    if (!s) { s = Math.random().toString(36).slice(2, 12); sessionStorage.setItem("el_ses", s); }
    return s;
  } catch { return ""; }
}

/**
 * Misura il marketing senza dati personali: una visita per sessione, i click su WhatsApp
 * e, nell'app, la prima apertura dall'icona installata.
 */
export function Traccia({ dove }: { dove: "sito" | "app" }) {
  useEffect(() => {
    const s = sessione();
    const pagina = window.location.pathname;
    if (dove === "sito") {
      try {
        if (!sessionStorage.getItem("el_vis")) {
          sessionStorage.setItem("el_vis", "1");
          invia({ tipo: "visita", pagina, sessione: s, ref: document.referrer, q: window.location.search });
        }
      } catch { /* niente */ }
    }
    if (dove === "app") {
      const installata = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      const segna = () => {
        try {
          if (localStorage.getItem("el_inst")) return;
          localStorage.setItem("el_inst", "1");
        } catch { /* niente */ }
        invia({ tipo: "app_installata", pagina, sessione: s });
      };
      if (installata) segna();
      window.addEventListener("appinstalled", segna);
    }
    const click = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (a && /wa\.me|whatsapp\.com/.test(a.href)) invia({ tipo: "whatsapp", pagina: window.location.pathname, sessione: s });
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, [dove]);
  return null;
}
