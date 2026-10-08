"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

function urlRitorno() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  return `${base}/auth/callback`;
}

export function FormAccesso() {
  const [email, setEmail] = useState("");
  const [stato, setStato] = useState<"idle" | "invio" | "inviata" | "errore">("idle");

  async function google() {
    const sb = supabaseBrowser();
    await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: urlRitorno() } });
  }

  async function link(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return setStato("errore");
    setStato("invio");
    const sb = supabaseBrowser();
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: urlRitorno() } });
    setStato(error ? "errore" : "inviata");
  }

  if (stato === "inviata")
    return (
      <div className="box">
        <h3>Controlla la tua email</h3>
        <p className="muted">Ti abbiamo mandato un link per entrare a <b>{email}</b>. Aprilo da questo telefono.</p>
        <button className="linkbtn" onClick={() => setStato("idle")}>Usa un&apos;altra email</button>
      </div>
    );

  return (
    <div className="section" style={{ gap: 16 }}>
      <button className="btn btn-ghost btn-block" onClick={google} type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.2a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.2 1.6l3.1-3.1A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>
        Continua con Google
      </button>
      <div className="or">oppure</div>
      <form onSubmit={link} noValidate>
        <div className="field">
          <label htmlFor="email">La tua email</label>
          <input id="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="officina@esempio.it" />
        </div>
        {stato === "errore" ? <p className="err">Controlla l&apos;indirizzo email e riprova.</p> : null}
        <button className="btn btn-primary btn-block" type="submit" disabled={stato === "invio"}>
          {stato === "invio" ? "Invio in corso…" : "Mandami il link per entrare"}
        </button>
      </form>
    </div>
  );
}
