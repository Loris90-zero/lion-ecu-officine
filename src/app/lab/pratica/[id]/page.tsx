import Link from "next/link";
import { notFound } from "next/navigation";
import { richiediStaff } from "@/lib/sessione";
import { eur, dataBreve } from "@/lib/fasi";
import { PillaFase } from "@/components/Fasi";
import { FormLab } from "./FormLab";
import type { Evento, Officina, Pratica } from "@/lib/types";

export default async function PraticaLab({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await richiediStaff();
  const { data } = await sb.from("pratiche").select("*, officine(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = data as Pratica & { officine: Officina };
  const o = p.officine;
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
      <div className="lab-grid">
        <div className="section" style={{ gap: 16 }}>
          <div className="box">
            <span className="label">Richiesta dell&apos;officina</span>
            <dl>
              <dt>Sintomo</dt><dd>{p.sintomo}</dd>
              {p.codici_errore ? <><dt>Codici errore</dt><dd className="mono">{p.codici_errore}</dd></> : null}
              <dt>Ritiro</dt><dd>{p.giorno_ritiro}, {p.fascia_ritiro} · richiesta del {dataBreve(p.creato_il)}<br />{p.indirizzo_ritiro}</dd>
              {p.prezzo_stimato_eur ? <><dt>Stima dalla ricerca</dt><dd>{eur(p.prezzo_stimato_eur)}{p.prezzo_nuovo_base_eur ? ` (nuova ${eur(p.prezzo_nuovo_base_eur)})` : ""}</dd></> : null}
              {p.pagato ? <><dt>Pagamento</dt><dd>Pagata {eur(p.prezzo_confermato_eur)}{p.pagato_il ? ` il ${dataBreve(p.pagato_il)}` : ""}</dd></> : null}
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
            </dl>
          </div>
          <div className="box">
            <span className="label">Storico</span>
            <ul className="src">{(ev as Evento[] | null ?? []).map((e) => <li key={e.id}><span className="mono hint">{dataBreve(e.creato_il)}</span> · {e.testo}</li>)}</ul>
          </div>
        </div>
        <div className="box">
          <span className="label">Aggiorna la pratica</span>
          <FormLab p={p} />
        </div>
      </div>
    </section>
  );
}
