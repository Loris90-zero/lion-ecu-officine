import Link from "next/link";
import { notFound } from "next/navigation";
import { richiediAdmin } from "@/lib/sessione";
import { FormGuida } from "../../Forms";
import { BASE } from "@/sito/config";
import type { Articolo } from "@/sito/dati";

export default async function ModificaGuida({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { sb } = await richiediAdmin();
  const { data } = await sb.from("articoli").select("*").eq("slug", slug).maybeSingle();
  if (!data) notFound();
  const g = data as Articolo & { stato: string };
  return (
    <section className="screen" style={{ maxWidth: 820 }}>
      <Link href="/lab/sito" className="linkbtn" style={{ color: "var(--ink-2)" }}>← Sito</Link>
      <div className="row"><h1>{g.titolo}</h1><span className="hint">{g.stato === "pubblicata" ? <a href={`${BASE}/guasti/${g.slug}`} target="_blank" rel="noopener noreferrer">Pubblicata: apri</a> : "Bozza"}</span></div>
      <p className="hint">Bozza scritta dall&apos;AI: controlla che ogni informazione tecnica sia corretta prima di pubblicare.</p>
      <div className="box"><FormGuida g={g} /></div>
    </section>
  );
}
