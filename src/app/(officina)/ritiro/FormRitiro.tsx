"use client";
import { useActionState, useState } from "react";
import { creaPratica, type StatoRitiro } from "./azioni";
import { TIPI_MEZZO, FASCE, eur } from "@/lib/fasi";
import { supabaseBrowser } from "@/lib/supabase/client";
import { ridimensiona } from "@/lib/foto";
import { scontato, pct } from "@/lib/fedelta";

type Props = { userId: string; indirizzo: string | null; centralina: string; codice: string; stima: number | null; base: number | null; nota?: string; sconto?: number };

export function FormRitiro({ userId, indirizzo, centralina, codice, stima, base, nota = "", sconto = 0 }: Props) {
  const tuo = stima ? scontato(stima, sconto) : null;
  const [stato, azione, inCorso] = useActionState<StatoRitiro, FormData>(creaPratica, {});
  const [foto, setFoto] = useState<{ path: string; url: string }[]>([]);
  const [carico, setCarico] = useState(false);
  const [erroreFoto, setErroreFoto] = useState<string | null>(null);

  async function aggiungiFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 6 - foto.length);
    e.target.value = "";
    if (!files.length) return;
    setCarico(true); setErroreFoto(null);
    const sb = supabaseBrowser();
    for (const f of files) {
      const blob = await ridimensiona(f, 1800);
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error } = await sb.storage.from("foto").upload(path, blob, { contentType: "image/jpeg" });
      if (error) { setErroreFoto("Una foto non è stata caricata. Riprova."); continue; }
      setFoto((x) => [...x, { path, url: URL.createObjectURL(blob) }]);
    }
    setCarico(false);
  }

  return (
    <form action={azione}>
      {stima ? (
        <div className="box" style={{ borderColor: "var(--accent)" }}>
          <span className="label">Dalla ricerca</span>
          <b>{centralina || codice}</b>
          <span className="muted" style={{ fontSize: 14 }}>Riparazione stimata {eur(tuo)} + IVA{sconto ? ` (con il tuo sconto del ${pct(sconto)})` : ""}{base ? ` (nuova circa ${eur(base)})` : ""}. Il tecnico la conferma dopo la diagnosi.</span>
          <input type="hidden" name="stima" value={stima} />
          {base ? <input type="hidden" name="base" value={base} /> : null}
        </div>
      ) : null}
      <fieldset>
        <legend>Tipo di mezzo</legend>
        <div className="chips">
          {TIPI_MEZZO.map((t, i) => (
            <label key={t} className="chip"><input type="radio" name="tipo_mezzo" value={t} defaultChecked={i === 0} /><span>{t}</span></label>
          ))}
        </div>
      </fieldset>
      <div className="field"><label htmlFor="mezzo">Marca e modello del mezzo</label><input id="mezzo" name="mezzo" required placeholder="Es. Volvo FH 500, Liebherr LTM 1060" /></div>
      <div className="grid2">
        <div className="field"><label htmlFor="centralina">Centralina</label><input id="centralina" name="centralina" defaultValue={centralina} placeholder="Es. Bosch EDC17CV41" /></div>
        <div className="field"><label htmlFor="codice_etichetta">Codice sull&apos;etichetta</label><input id="codice_etichetta" name="codice_etichetta" className="mono" defaultValue={codice} placeholder="0281 0…" /></div>
      </div>
      <div className="field"><label htmlFor="sintomo">Cosa succede al mezzo?</label><textarea id="sintomo" name="sintomo" required defaultValue={nota} placeholder="Es. va in recovery sotto carico, non comunica con la diagnosi…" /></div>
      <div className="field"><label htmlFor="codici_errore">Codici errore letti (se li hai)</label><input id="codici_errore" name="codici_errore" className="mono" placeholder="Es. P0087, SPN 157 FMI 18" /></div>
      <div className="field">
        <span className="flabel">Foto dell&apos;etichetta e della centralina (facoltative)</span>
        {carico ? <p className="hint">Caricamento foto…</p> : (
          <div className="grid2">
            <label className="btn btn-ghost">Scatta foto<input type="file" accept="image/*" capture="environment" hidden onChange={aggiungiFoto} disabled={foto.length >= 6} /></label>
            <label className="btn btn-ghost">Carica dalla galleria<input type="file" accept="image/*" multiple hidden onChange={aggiungiFoto} disabled={foto.length >= 6} /></label>
          </div>
        )}
        {foto.length ? <div className="photos">{foto.map((f) => <img key={f.path} src={f.url} alt="Foto caricata" />)}</div> : null}
        {foto.map((f) => <input key={f.path} type="hidden" name="foto" value={f.path} />)}
        {erroreFoto ? <p className="err">{erroreFoto}</p> : null}
      </div>
      <div className="field">
        <label htmlFor="indirizzo_ritiro">Indirizzo dove il corriere ritira</label>
        <input id="indirizzo_ritiro" name="indirizzo_ritiro" autoComplete="street-address" defaultValue={indirizzo ?? ""} required placeholder="Via, numero, CAP, città (provincia)" />
        <span className="hint">{indirizzo ? "Se lo cambi, aggiorniamo anche il tuo profilo." : "Lo salviamo nel tuo profilo: la prossima volta è già scritto."}</span>
      </div>
      <div className="grid2">
        <div className="field"><label htmlFor="giorno_ritiro">Giorno</label><select id="giorno_ritiro" name="giorno_ritiro"><option>Domani</option><option>Dopodomani</option></select></div>
        <div className="field"><label htmlFor="fascia_ritiro">Fascia oraria</label><select id="fascia_ritiro" name="fascia_ritiro">{FASCE.map((f) => <option key={f}>{f}</option>)}</select></div>
      </div>
      <label className="box accetta">
        <input type="checkbox" name="accetta_preventivo" value="si" required />
        <span>
          {stima ? (
            <>Se dalla diagnosi la centralina risulta <b>riparabile</b>, accetto la riparazione al prezzo di <b>{eur(tuo)} + IVA</b>{sconto ? <> (già scontato del {pct(sconto)})</> : null}. Se non è riparabile me la rispedite gratis, senza costi.</>
          ) : (
            <>Accetto che il prezzo della riparazione mi venga comunicato dopo la diagnosi. Se la centralina <b>non è riparabile</b> me la rispedite gratis, senza costi.</>
          )}
          <small className="muted">Se dopo la diagnosi il prezzo risultasse più alto, vi contatteremo prima di procedere.</small>
        </span>
      </label>
      {stato.errore ? <p className="err">{stato.errore}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={inCorso || carico}>{inCorso ? "Invio…" : "Prenota il ritiro gratuito"}</button>
      <p className="hint">Paghi solo se dopo la diagnosi la centralina è riparabile. Se non lo è, te la rispediamo gratis.</p>
    </form>
  );
}
