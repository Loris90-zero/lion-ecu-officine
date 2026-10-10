import Link from "next/link";
import { richiediOfficina } from "@/lib/sessione";
import { dataLunga } from "@/lib/fasi";
import type { Pratica } from "@/lib/types";

export const metadata = { title: "Garanzie — EcuLion" };

export default async function Garanzie() {
  const { sb, officina } = await richiediOfficina();
  const { data } = await sb.from("pratiche").select("*").eq("officina_id", officina.id).eq("esito", "riparabile").gte("fase", 4).order("aggiornato_il", { ascending: false });
  const lista = (data ?? []) as Pratica[];
  return (
    <section className="screen">
      <div className="section">
        <h1>Storico e garanzie</h1>
        <p className="muted">Ogni riparazione ha il suo certificato. Se lo stesso guasto si ripresenta, lo ripariamo gratis: richiedi un ritiro indicando il numero pratica.</p>
      </div>
      {lista.length === 0 ? <p className="muted">Qui compariranno le centraline riparate, con il certificato di garanzia a vita.</p> : null}
      {lista.map((p) => (
        <Link key={p.id} href={`/garanzie/${p.id}`} className="card">
          <div className="row"><span className="mono muted" style={{ fontSize: 12 }}>{p.numero} · {dataLunga(p.aggiornato_il)}</span><span className="pill p-ok">Garanzia a vita</span></div>
          <div><h3>{p.mezzo}</h3><div className="mono muted" style={{ fontSize: 13 }}>{p.centralina || p.codice_etichetta}</div></div>
          <p style={{ fontSize: 13 }}>{p.guasto_riparato || p.sintomo}</p>
        </Link>
      ))}
    </section>
  );
}
