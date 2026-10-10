import Link from "next/link";
import { notFound } from "next/navigation";
import { richiediStaff } from "@/lib/sessione";
import { eur, dataBreve } from "@/lib/fasi";
import { PillaFase } from "@/components/Fasi";
import { livelloOfficina, pct } from "@/lib/fedelta";
import { FormCrm } from "../FormCrm";
import { nomeStato, numeroWa } from "../stati";
import type { Officina, Pratica } from "@/lib/types";

export default async function OfficinaLab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await richiediStaff();
  const { data } = await sb.from("officine").select("*, officine_crm(stato, note, prossimo_contatto, aggiornato_il)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const o = data as Officina & { officine_crm: { stato: string; note: string | null; prossimo_contatto: string | null; aggiornato_il: string } | null };
  const crm = o.officine_crm;
  const { data: pr } = await sb.from("pratiche").select("*").eq("officina_id", id).order("creato_il", { ascending: false });
  const pratiche = (pr ?? []) as Pratica[];
  const liv = await livelloOfficina(sb, id);
  const { data: ld } = await sb.from("lead").select("score, origine, risposte, creato_il").eq("officina_id", id).order("creato_il", { ascending: false }).limit(1).maybeSingle();
  const prof = (ld?.risposte as { profilo?: { riassunto?: string; leve?: string[]; note?: string[]; centraline_mese?: number } } | null)?.profilo;
  const fatturato = pratiche.filter((p) => p.pagato).reduce((s, p) => s + Number(p.prezzo_pagato_eur ?? p.prezzo_confermato_eur ?? 0), 0);

  return (
    <section className="screen">
      <Link href="/lab/officine" className="linkbtn" style={{ color: "var(--ink-2)" }}>← Officine</Link>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <div className="section" style={{ gap: 4 }}>
          <h1>{o.ragione_sociale}</h1>
          <p className="muted">{o.referente}{o.citta ? ` · ${o.citta}` : ""} · registrata il {dataBreve(o.creato_il)} · {nomeStato(crm?.stato)}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="btn btn-primary btn-sm" href={`tel:${o.telefono}`}>Chiama</a>
          <a className="btn btn-ghost btn-sm" href={`https://wa.me/${numeroWa(o.telefono)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          {o.email ? <a className="btn btn-ghost btn-sm" href={`mailto:${o.email}`}>Email</a> : null}
        </div>
      </div>
      <div className="lab-grid">
        <div className="section" style={{ gap: 16 }}>
          <div className="box">
            <span className="label">Pratiche · {pratiche.length}</span>
            {pratiche.length === 0 ? <p className="muted">Nessuna pratica ancora.</p> : (
              <div className="tblw" style={{ border: 0 }}>
                <table className="tbl">
                  <tbody>
                    {pratiche.map((p) => (
                      <tr key={p.id}>
                        <td><Link href={`/lab/pratica/${p.id}`} className="mono">{p.numero}</Link><div className="hint">{dataBreve(p.creato_il)}</div></td>
                        <td>{p.mezzo}<div className="hint mono">{p.centralina || p.codice_etichetta || "—"}</div></td>
                        <td><PillaFase p={p} /></td>
                        <td className="mono">{p.pagato ? eur(p.prezzo_pagato_eur ?? p.prezzo_confermato_eur) : p.prezzo_confermato_eur ? <span className="muted">{eur(p.prezzo_confermato_eur)}</span> : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="box">
            <span className="label">Dati dell&apos;officina</span>
            <dl>
              <dt>Telefono</dt><dd className="mono">{o.telefono}</dd>
              {o.email ? <><dt>Email</dt><dd>{o.email}</dd></> : null}
              <dt>Indirizzo di ritiro</dt><dd>{o.indirizzo_ritiro || <span className="muted">non ancora indicato</span>}</dd>
              {o.orari_ritiro ? <><dt>Orari di ritiro</dt><dd>{o.orari_ritiro}</dd></> : null}
              <dt>Fatturazione</dt><dd>{o.partita_iva ? `P.IVA ${o.partita_iva}` : <span className="muted">P.IVA non ancora indicata</span>}{o.codice_sdi ? ` · SDI ${o.codice_sdi}` : ""}{o.pec ? ` · ${o.pec}` : ""}{o.sede_legale ? <><br />{o.sede_legale}</> : null}</dd>
              {o.mezzi?.length ? <><dt>Mezzi</dt><dd>{o.mezzi.join(", ")}</dd></> : null}
              <dt>WhatsApp</dt><dd>{o.consenso_whatsapp ? "Consenso agli aggiornamenti dato" : "Nessun consenso"}</dd>
            </dl>
          </div>
        </div>
        <div className="section" style={{ gap: 16 }}>
          <div className="box">
            <span className="label">Livello e spesa</span>
            <dl>
              <dt>Livello</dt><dd><b>{liv.nome}</b>{liv.sconto ? ` · sconto ${pct(liv.sconto)}` : ""}</dd>
              <dt>Punti (ultimi {liv.mesi} mesi)</dt><dd className="mono">{liv.punti.toLocaleString("it-IT")}{liv.prossimo ? <span className="hint"> · mancano {liv.prossimo.mancano.toLocaleString("it-IT")} per {liv.prossimo.nome}</span> : null}</dd>
              <dt>Pagato in totale</dt><dd className="mono">{eur(fatturato)}</dd>
            </dl>
          </div>
          {ld ? (
            <div className="box">
              <span className="label">Profilo dal questionario · score {ld.score}</span>
              {prof?.riassunto ? <p style={{ margin: 0 }}>{prof.riassunto}</p> : <p className="muted" style={{ margin: 0 }}>Questionario con la versione precedente: solo lo score.</p>}
              {prof?.leve?.length ? <><b style={{ fontSize: 14 }}>Cosa dire per farci scegliere</b><ul className="src">{prof.leve.map((x) => <li key={x}>{x}</li>)}</ul></> : null}
              {prof?.note?.length ? <ul className="src">{prof.note.map((x) => <li key={x}>{x}</li>)}</ul> : null}
            </div>
          ) : null}
          <div className="box">
            <span className="label">Gestione commerciale</span>
            <FormCrm officinaId={o.id} stato={crm?.stato ?? "nuova"} note={crm?.note ?? ""} prossimo={crm?.prossimo_contatto ?? ""} />
            {crm?.aggiornato_il ? <p className="hint">Aggiornato il {dataBreve(crm.aggiornato_il)}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
