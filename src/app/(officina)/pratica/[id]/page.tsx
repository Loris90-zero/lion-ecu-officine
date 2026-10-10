import Link from "next/link";
import { notFound } from "next/navigation";
import { richiediOfficina } from "@/lib/sessione";
import { FASI, eur, dataBreve } from "@/lib/fasi";
import { PillaFase } from "@/components/Fasi";
import { Paga } from "@/components/Paga";
import { FormFattura } from "../../profilo/FormFattura";
import { fatturazioneCompleta } from "@/lib/fatturazione";
import { livelloOfficina, scontato, pct } from "@/lib/fedelta";
import type { Evento, Pratica } from "@/lib/types";

const spunta = <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>;

export default async function DettaglioPratica({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nuova?: string; pagato?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { sb, officina } = await richiediOfficina();
  const { data } = await sb.from("pratiche").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = data as Pratica;
  const { data: ev } = await sb.from("eventi").select("*").eq("pratica_id", id).order("creato_il");
  const eventi = (ev ?? []) as Evento[];
  const quando = (fase: number) => eventi.filter((e) => e.fase === fase).at(0)?.creato_il;
  const fotoUrl = p.foto.length
    ? (await sb.storage.from("foto").createSignedUrls(p.foto, 3600)).data?.map((x) => x.signedUrl).filter((u): u is string => !!u) ?? []
    : [];
  const daPagare = p.esito === "riparabile" && !p.pagato && p.prezzo_confermato_eur;
  const livello = daPagare ? await livelloOfficina(sb, officina.id) : null;
  const daVersare = daPagare && livello ? scontato(Number(p.prezzo_confermato_eur), livello.sconto) : null;

  return (
    <section className="screen">
      <Link href="/" className="linkbtn" style={{ color: "var(--ink-2)" }}>← Tutti i lavori</Link>
      {sp.nuova ? <p className="okmsg">Richiesta ricevuta. Scrivi il numero <b>{p.numero}</b> sulla scatola e proteggi i connettori.</p> : null}
      {sp.pagato && !p.pagato ? <p className="okmsg">Pagamento in verifica: tra pochi istanti lo vedi confermato qui.</p> : null}
      <div className="section">
        <div className="row"><span className="mono muted">{p.numero}</span><PillaFase p={p} /></div>
        <h1>{p.mezzo}</h1>
        <p className="muted">{p.centralina || "Centralina da identificare"}{p.codice_etichetta ? ` · ${p.codice_etichetta}` : ""}</p>
      </div>

      {daPagare ? (
        <div className="box" style={{ borderColor: "var(--accent)" }}>
          <span className="label">Diagnosi completata</span>
          <h3>La centralina è riparabile</h3>
          {p.nota_laboratorio ? <p style={{ fontSize: 14 }}>{p.nota_laboratorio}</p> : null}
          <div className="row"><span className="muted">Prezzo riparazione</span><b className="mono" style={{ fontSize: 20 }}>{eur(daVersare)}<span className="iva"> + IVA</span>{livello?.sconto ? <span className="prezzo-barrato">{eur(p.prezzo_confermato_eur)}</span> : null}</b></div>
          {livello?.sconto ? <p className="okmsg">Sconto {livello.nome} del {pct(livello.sconto)} già applicato.</p> : null}
          {fatturazioneCompleta(officina) ? <Paga praticaId={p.id} importo={`${eur(daVersare)} + IVA`} /> : <FormFattura o={officina} />}
          <p className="hint">Garanzia a vita sul guasto riparato. Ritiro e riconsegna inclusi.</p>
        </div>
      ) : null}
      {p.esito === "non_riparabile" ? (
        <div className="box" style={{ borderColor: "var(--danger)" }}>
          <h3>La centralina non è riparabile</h3>
          {p.nota_laboratorio ? <p style={{ fontSize: 14 }}>{p.nota_laboratorio}</p> : null}
          <p className="muted" style={{ fontSize: 14 }}>Te la rispediamo gratis. Non devi pagare nulla.</p>
        </div>
      ) : null}

      <ol className="timeline">
        {FASI.map((nome, i) => {
          const cls = i < p.fase ? "done" : i === p.fase ? "now" : "";
          const t = quando(i);
          return (
            <li key={nome} className={cls}>
              <div className="dot">{i < p.fase ? spunta : null}</div>
              <div><b>{nome}</b><span className="mono">{t ? dataBreve(t) : i === p.fase ? "in corso" : ""}</span></div>
            </li>
          );
        })}
      </ol>

      {p.nota_laboratorio && !daPagare && p.esito !== "non_riparabile" ? (
        <div className="box"><span className="label">Nota del laboratorio</span><p>{p.nota_laboratorio}</p></div>
      ) : null}

      <div className="box">
        <span className="label">Dati della richiesta</span>
        <dl>
          <dt>Tipo mezzo</dt><dd>{p.tipo_mezzo}</dd>
          <dt>Sintomo</dt><dd>{p.sintomo}</dd>
          {p.codici_errore ? <><dt>Codici errore</dt><dd className="mono">{p.codici_errore}</dd></> : null}
          <dt>Ritiro</dt><dd>{p.giorno_ritiro}, {p.fascia_ritiro}<br />{p.indirizzo_ritiro}</dd>
          {p.prezzo_stimato_eur && !p.prezzo_confermato_eur ? <><dt>Stima</dt><dd>{eur(p.prezzo_stimato_eur)} + IVA</dd></> : null}
          {p.accetta_preventivo ? <><dt>Preventivo</dt><dd>{p.prezzo_accettato_eur ? `Accettato: ${eur(p.prezzo_accettato_eur)} se riparabile` : "Accettato, prezzo dopo la diagnosi"}</dd></> : null}
          {p.corriere ? <><dt>Corriere</dt><dd>{p.corriere}{p.tracking ? <> · <span className="mono">{p.tracking}</span></> : null}</dd></> : null}
          {p.pagato ? <><dt>Pagamento</dt><dd>{eur(p.prezzo_pagato_eur ?? p.prezzo_confermato_eur)} + IVA pagato{Number(p.sconto_pct) ? ` (sconto ${pct(Number(p.sconto_pct))})` : ""}{p.pagato_il ? ` il ${dataBreve(p.pagato_il)}` : ""}</dd></> : null}
        </dl>
        {fotoUrl.length ? <div className="photos">{fotoUrl.map((u) => <img key={u} src={u} alt="Foto della centralina" />)}</div> : null}
      </div>
      {p.fase >= 4 && p.esito === "riparabile" ? <Link className="btn btn-ghost btn-block" href={`/garanzie/${p.id}`}>Vedi il certificato di garanzia</Link> : null}
    </section>
  );
}
