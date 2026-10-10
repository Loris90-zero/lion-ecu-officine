import Link from "next/link";
import { notFound } from "next/navigation";
import { richiediAdmin } from "@/lib/sessione";
import { FormCentralina } from "../../Forms";
import { BASE } from "@/sito/config";
import type { PaginaCentralina } from "@/sito/dati";

export default async function ModificaCentralina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { sb } = await richiediAdmin();
  const { data } = await sb.from("pagine_centraline").select("*").eq("slug", slug).maybeSingle();
  if (!data) notFound();
  const p = data as PaginaCentralina & { stato: string };
  return (
    <section className="screen" style={{ maxWidth: 820 }}>
      <Link href="/lab/sito" className="linkbtn" style={{ color: "var(--ink-2)" }}>← Sito</Link>
      <div className="row"><h1>{p.titolo}</h1><span className="hint">{p.stato === "pubblicata" ? <a href={`${BASE}/centraline/${p.slug}`} target="_blank" rel="noopener noreferrer">Pubblicata: apri</a> : "Bozza"}</span></div>
      <div className="box"><FormCentralina p={p} /></div>
    </section>
  );
}
