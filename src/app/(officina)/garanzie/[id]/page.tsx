import Link from "next/link";
import { notFound } from "next/navigation";
import { richiediOfficina } from "@/lib/sessione";
import { dataLunga } from "@/lib/fasi";
import type { Pratica } from "@/lib/types";

export default async function Certificato({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, officina } = await richiediOfficina();
  const { data } = await sb.from("pratiche").select("*").eq("id", id).maybeSingle();
  const p = data as Pratica | null;
  if (!p || p.esito !== "riparabile" || p.fase < 4) notFound();
  const { data: ev } = await sb.from("eventi").select("creato_il").eq("pratica_id", id).eq("fase", 4).order("creato_il").limit(1).maybeSingle();
  return (
    <section className="screen">
      <Link href="/garanzie" className="linkbtn" style={{ color: "var(--ink-2)" }}>← Garanzie</Link>
      <div className="cert">
        <div className="seal">Garanzia<br />a vita</div>
        <span className="label">EcuLion</span>
        <h2>Certificato di garanzia</h2>
        <dl>
          <dt>Pratica</dt><dd className="mono">{p.numero}</dd>
          <dt>Data</dt><dd className="mono">{dataLunga(ev?.creato_il ?? p.aggiornato_il)}</dd>
          <dt>Cliente</dt><dd>{officina.ragione_sociale}{officina.partita_iva ? ` · P.IVA ${officina.partita_iva}` : ""}</dd>
          <dt>Mezzo</dt><dd>{p.tipo_mezzo} · {p.mezzo}</dd>
          <dt>Centralina</dt><dd className="mono">{[p.centralina, p.codice_etichetta].filter(Boolean).join(" · ") || "—"}</dd>
          <dt>Guasto riparato</dt><dd>{p.certificato?.guasto || p.guasto_riparato || p.sintomo}</dd>
          {p.certificato?.interventi?.length ? <><dt>Interventi eseguiti</dt><dd>{p.certificato.interventi.join(" · ")}</dd></> : null}
          {p.certificato?.componenti?.length ? <><dt>Componenti sostituiti</dt><dd>{p.certificato.componenti.join(" · ")}</dd></> : null}
          {p.certificato?.collaudo ? <><dt>Collaudo</dt><dd>{p.certificato.collaudo}</dd></> : null}
          {p.certificato?.tecnico ? <><dt>Tecnico</dt><dd>{p.certificato.tecnico}</dd></> : null}
        </dl>
        {p.certificato?.testo ? <p style={{ fontSize: 14 }}>{p.certificato.testo}</p> : null}
        <p className="hint">La garanzia copre a vita il guasto documentato in questa pratica. Per attivarla richiedi un ritiro dall&apos;app indicando il numero pratica.</p>
      </div>
      <Link className="btn btn-primary btn-block" href={`/ritiro?centralina=${encodeURIComponent(p.centralina ?? "")}&codice=${encodeURIComponent(p.codice_etichetta ?? "")}&nota=${encodeURIComponent(`Garanzia pratica ${p.numero}: `)}`}>Attiva la garanzia: richiedi un ritiro</Link>
    </section>
  );
}
