import Link from "next/link";
import { notFound } from "next/navigation";
import { richiediStaff } from "@/lib/sessione";
import { eur, dataBreve } from "@/lib/fasi";
import { PillaFase } from "@/components/Fasi";
import { FormLab } from "./FormLab";
import { AzioniRapide } from "./AzioniRapide";
import { Relazione } from "./Relazione";
import type { Struttura } from "@/lib/relazione";
import { segnaInviato } from "./passi";
import { numeroWa } from "../../officine/stati";
import { livelloOfficina, scontato, pct } from "@/lib/fedelta";
import type { Evento, Officina, Pratica } from "@/lib/types";

export default async function PraticaLab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await richiediStaff();
  const { data } = await sb.from("pratiche").select("*, officine(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = data as Pratica & { officine: Officina };
  const o = p.officine;
  const liv = await livelloOfficina(sb, o.id);
  const { data: msg } = await sb.from("messaggi").select("id, tipo, testo, stato, creato_da, creato_il").eq("pratica_id", id).order("creato_il", { ascending: false });
  const messaggi = (msg ?? []) as { id: number; tipo: string; testo: string; stato: string; creato_da: string | null; creato_il: string }[];
  const { data: interv } = await sb.from("interventi").select("testo_tecnico, struttura, audio_path").eq("pratica_id", id).maybeSingle();
  const mostraRelazione = p.fase >= 2 && !!p.esito;
  const STATI_MSG: Record<string, string> = { da_inviare: "Da inviare", inviato: "Inviato", inviato_a_mano: "Inviato dal tecnico", errore: "Errore", senza_consenso: "Senza consenso WhatsApp" };
  const { data: ev } = await sb.from("eventi").select("*").eq("pratica_id", id).order("creato_il", { ascending: false });
  const fotoUrl = p.foto.length ? (await sb.storage.from("foto").createSignedUrls(p.foto, 3600)).data?.map((x) => x.signedUrl).filter((u): u is string => !!u) ?? [] : [];

  return (
    <section className="screen">
      <Link href="/lab" className="linkbtn" style={{ color: "var(--ink-2)" }}>← Pratiche</Link>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <div className="section" style={{ gap: 4 }}>
          <span className="mono muted">{p.numero}</span>
          <h1>{p.mezzo}</h1>
          <p className="muted">{p.tipo_mezzo} · {p.centralina || "centralina da identificare"}{p.codice_etichetta ? ` · ${p.codice_etichetta}` : ""}</p>
        </div>
        <PillaFase p={p} />
      </div>
      <AzioniRapide p={{ id: p.id, fase: p.fase, esito: p.esito, pagato: p.pagato, prezzo_suggerito: p.prezzo_confermato_eur ?? p.prezzo_accettato_eur ?? p.prezzo_stimato_eur ?? null, sconto: liv.sconto, consenso: o.consenso_whatsapp }} />
      {mostraRelazione ? <Relazione praticaId={p.id} testoIniziale={interv?.testo_tecnico ?? ""} strutturaIniziale={(interv?.struttura as Struttura | null) ?? null} haAudio={!!interv?.audio_path} /> : null}
      <div className="lab-grid">
        <div className="section" style={{ gap: 16 }}>
          <div className="box">
            <span className="label">Richiesta dell&apos;officina</span>
            <dl>
              <dt>Sintomo</dt><dd>{p.sintomo}</dd>
              {p.codici_errore ? <><dt>Codici errore</dt><dd className="mono">{p.codici_errore}</dd></> : null}
              <dt>Ritiro</dt><dd>{p.giorno_ritiro}, {p.fascia_ritiro} · richiesta del {dataBreve(p.creato_il)}<br />{p.indirizzo_ritiro}</dd>
              {p.prezzo_stimato_eur ? <><dt>Stima dalla ricerca</dt><dd>{eur(p.prezzo_stimato_eur)}{p.prezzo_nuovo_base_eur ? ` (nuova ${eur(p.prezzo_nuovo_base_eur)})` : ""}</dd></> : null}
              <dt>Preventivo</dt><dd>{p.accetta_preventivo
                ? (p.prezzo_accettato_eur ? <>Accettato fino a <b>{eur(p.prezzo_accettato_eur)}</b>{p.accettato_il ? ` il ${dataBreve(p.accettato_il)}` : ""}{p.prezzo_confermato_eur && p.prezzo_confermato_eur > p.prezzo_accettato_eur ? <span className="err"> · prezzo confermato più alto: richiedi nuova conferma</span> : null}</> : <>Accettato, prezzo da comunicare dopo la diagnosi</>)
                : <span className="muted">Non accettato (richiesta precedente)</span>}</dd>
              <dt>Livello officina</dt><dd>{liv.nome} · {liv.punti.toLocaleString("it-IT")} punti{liv.sconto ? ` · sconto ${pct(liv.sconto)}` : ""}{!p.pagato && p.prezzo_confermato_eur && liv.sconto ? <> · pagherà <b>{eur(scontato(Number(p.prezzo_confermato_eur), liv.sconto))}</b></> : null}</dd>
              {p.pagato ? <><dt>Pagamento</dt><dd>Pagata {eur(p.prezzo_pagato_eur ?? p.prezzo_confermato_eur)}{Number(p.sconto_pct) ? ` (sconto ${pct(Number(p.sconto_pct))})` : ""}{p.pagato_il ? ` il ${dataBreve(p.pagato_il)}` : ""}</dd></> : null}
            </dl>
            {fotoUrl.length ? <div className="photos">{fotoUrl.map((u) => <a key={u} href={u} target="_blank" rel="noopener noreferrer"><img src={u} alt="Foto della centralina" /></a>)}</div> : null}
          </div>
          <div className="box">
            <span className="label">Officina</span>
            <dl>
              <dt>Ragione sociale</dt><dd>{o.ragione_sociale}{o.partita_iva ? ` · P.IVA ${o.partita_iva}` : ""}</dd>
              <dt>Referente</dt><dd>{o.referente}</dd>
              <dt>Telefono</dt><dd className="mono">{o.telefono}</dd>
              {o.email ? <><dt>Email</dt><dd>{o.email}</dd></> : null}
              <dt>WhatsApp</dt><dd>{o.consenso_whatsapp ? "Consenso dato" : "Nessun consenso"}</dd>
              {o.sede_legale ? <><dt>Sede legale</dt><dd>{o.sede_legale}</dd></> : null}
              <dt>Fatturazione</dt><dd className="mono">{o.codice_sdi || o.pec ? [o.codice_sdi ? `SDI ${o.codice_sdi}` : null, o.pec].filter(Boolean).join(" · ") : "SDI/PEC mancanti"}</dd>
              {o.orari_ritiro ? <><dt>Orari</dt><dd>{o.orari_ritiro}</dd></> : null}
            </dl>
          </div>
          <div className="box">
            <span className="label">Storico</span>
            <ul className="src">{(ev as Evento[] | null ?? []).map((e) => <li key={e.id}><span className="mono hint">{dataBreve(e.creato_il)}</span> · {e.testo}</li>)}</ul>
          </div>
        </div>
        <div className="section" style={{ gap: 16 }}>
          <div className="box">
            <span className="label">Messaggi all&apos;officina · {messaggi.length}</span>
            {messaggi.length === 0 ? <p className="muted" style={{ margin: 0 }}>Nessun messaggio ancora.</p> : (
              <ul className="msg-lista">
                {messaggi.map((m) => (
                  <li key={m.id}>
                    <details>
                      <summary><b>{STATI_MSG[m.stato] ?? m.stato}</b> · {dataBreve(m.creato_il)}{m.creato_da ? ` · ${m.creato_da}` : ""}</summary>
                      <p className="msg-testo" style={{ marginTop: 8 }}>{m.testo}</p>
                    </details>
                    {m.stato === "da_inviare" || m.stato === "senza_consenso" ? (
                      <form action={segnaInviato} style={{ flexDirection: "row", gap: 12, alignItems: "center", marginTop: 6 }}>
                        <input type="hidden" name="messaggio" value={m.id} />
                        <input type="hidden" name="pratica" value={p.id} />
                        <a className="linkbtn" href={`https://wa.me/${numeroWa(o.telefono)}?text=${encodeURIComponent(m.testo)}`} target="_blank" rel="noopener noreferrer">Apri WhatsApp</a>
                        <button className="linkbtn" type="submit">Segna come inviato</button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <details className="box">
            <summary className="label" style={{ cursor: "pointer" }}>Modifica avanzata</summary>
            <FormLab p={p} />
          </details>
        </div>
      </div>
    </section>
  );
}
