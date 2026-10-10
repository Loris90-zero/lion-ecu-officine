"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { salvaRelazione, type EsitoRelazione } from "./passi";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Struttura } from "@/lib/relazione";

type SR = { start(): void; stop(): void; abort(): void; lang: string; continuous: boolean; interimResults: boolean; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };

function Scheda({ s }: { s: Struttura }) {
  return (
    <dl className="scheda">
      {s.guasto ? <><dt>Guasto</dt><dd>{s.guasto}</dd></> : null}
      {s.causa ? <><dt>Causa</dt><dd>{s.causa}</dd></> : null}
      {s.interventi.length ? <><dt>Interventi</dt><dd>{s.interventi.join(" · ")}</dd></> : null}
      {s.componenti_sostituiti.length ? <><dt>Componenti sostituiti</dt><dd>{s.componenti_sostituiti.join(" · ")}</dd></> : null}
      {s.collaudo ? <><dt>Collaudo</dt><dd>{s.collaudo}</dd></> : null}
      {s.testo_certificato ? <><dt>Sul certificato</dt><dd>{s.testo_certificato}</dd></> : null}
    </dl>
  );
}

/** Relazione del tecnico: scritta o a voce (dettatura + audio salvato). */
export function Relazione({ praticaId, testoIniziale, strutturaIniziale, haAudio }: { praticaId: string; testoIniziale: string; strutturaIniziale: Struttura | null; haAudio: boolean }) {
  const [s, azione, inCorso] = useActionState<EsitoRelazione, FormData>(salvaRelazione, {});
  const [testo, setTesto] = useState(testoIniziale);
  const [registro, setRegistro] = useState(false);
  const [parziale, setParziale] = useState("");
  const [audio, setAudio] = useState<string | null>(null);
  const [nota, setNota] = useState<string | null>(null);
  const sr = useRef<SR | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const pezzi = useRef<Blob[]>([]);
  const [dettatura, setDettatura] = useState(false);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    setDettatura(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  async function avvia() {
    setNota(null);
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      pezzi.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) pezzi.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(pezzi.current, { type: mr.mimeType || "audio/webm" });
        const est = (mr.mimeType || "").includes("mp4") ? "m4a" : "webm";
        const path = `${praticaId}/${crypto.randomUUID()}.${est}`;
        const { error } = await supabaseBrowser().storage.from("audio").upload(path, blob, { contentType: blob.type });
        if (error) setNota("Audio non salvato, ma il testo dettato resta."); else setAudio(path);
      };
      mr.start();
      rec.current = mr;
    } catch {
      setNota("Microfono non disponibile: controlla i permessi del browser.");
      return;
    }
    if (Ctor) {
      const r = new Ctor();
      r.lang = "it-IT"; r.continuous = true; r.interimResults = true;
      r.onresult = (e) => {
        let fin = "", tmp = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const x = e.results[i];
          if (x.isFinal) fin += x[0].transcript; else tmp += x[0].transcript;
        }
        if (fin) setTesto((t) => (t ? t.trimEnd() + " " : "") + fin.trim());
        setParziale(tmp);
      };
      r.onerror = () => {};
      r.onend = () => { if (sr.current === r && rec.current?.state === "recording") { try { r.start(); } catch {} } };
      sr.current = r;
      r.start();
    } else setNota("Su questo telefono la dettatura automatica non c'è: l'audio si salva, ma scrivi anche due righe (o usa il microfono della tastiera).");
    setRegistro(true);
  }

  function ferma() {
    const r = sr.current; sr.current = null; r?.stop();
    rec.current?.stop(); rec.current = null;
    setParziale(""); setRegistro(false);
  }

  const struttura = s.struttura ?? strutturaIniziale;
  return (
    <div className="section" style={{ gap: 12 }}>
      {s.messaggio ? (
        <div className="box msg-pronto">
          <span className="label">Messaggio per l&apos;officina</span>
          <p className="msg-testo">{s.messaggio.testo}</p>
          <a className="btn btn-primary" href={s.messaggio.wa} target="_blank" rel="noopener noreferrer">Invia su WhatsApp</a>
        </div>
      ) : null}
      <form action={azione} className="box">
        <input type="hidden" name="id" value={praticaId} />
        {audio ? <input type="hidden" name="audio" value={audio} /> : null}
        <span className="label">Relazione della riparazione</span>
        <p className="hint" style={{ margin: 0 }}>Cosa hai trovato, cosa hai sostituito o riparato, come l&apos;hai collaudata. Diventa il certificato di garanzia e una scheda della nostra banca dati.</p>
        {registro ? (
          <button type="button" className="btn btn-danger btn-block btn-xl" onClick={ferma}><span className="rec" aria-hidden="true" />Ferma la registrazione</button>
        ) : (
          <button type="button" className="btn btn-ghost btn-block btn-xl" onClick={avvia}>{dettatura ? "Registra a voce (detta)" : "Registra un audio"}</button>
        )}
        <div className="field">
          <label htmlFor="testo">Testo {registro && parziale ? <span className="hint">· sto ascoltando…</span> : null}</label>
          <textarea id="testo" name="testo" rows={6} value={testo + (parziale ? ` ${parziale}` : "")} onChange={(e) => setTesto(e.target.value)} readOnly={registro} placeholder="Es. Driver iniettori cilindri 1 e 3 in corto, sostituito stadio finale, rifatte saldature, collaudata al banco 2 ore con simulazione carico." />
        </div>
        {audio || haAudio ? <p className="hint" style={{ margin: 0 }}>Audio salvato nell&apos;archivio della pratica.</p> : null}
        {nota ? <p className="hint" style={{ margin: 0 }}>{nota}</p> : null}
        {s.errore ? <p className="err">{s.errore}</p> : null}
        {s.ok ? <p className="okmsg">{s.ok}</p> : null}
        <button className="btn btn-primary btn-block" type="submit" disabled={inCorso || registro}>{inCorso ? "L'AI sta ordinando la relazione…" : "Salva e crea il certificato"}</button>
      </form>
      {struttura ? <div className="box"><span className="label">Come la legge l&apos;AI</span><Scheda s={struttura} /></div> : null}
    </div>
  );
}
