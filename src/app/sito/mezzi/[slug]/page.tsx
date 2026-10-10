import Link from "next/link";
import { Wa } from "@/sito/Whatsapp";
import { notFound } from "next/navigation";
import { u, app, MEZZI } from "@/sito/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const revalidate = 3600;
export function generateStaticParams() { return MEZZI.map((m) => ({ slug: m.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = MEZZI.find((x) => x.slug === slug);
  return m ? { title: `Riparazione centraline ${m.nome.toLowerCase()}`, description: m.intro } : {};
}

export default async function Mezzo({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = MEZZI.find((x) => x.slug === slug);
  if (!m) notFound();
  const { data } = await supabaseAdmin().from("pagine_centraline").select("slug, titolo, codice").eq("stato", "pubblicata").contains("mezzi", [m.slug]).order("titolo").limit(60);
  const pagine = (data ?? []) as { slug: string; titolo: string; codice: string | null }[];
  return (
    <section className="s-sez-s">
      <div className="s-wrap">
        <div className="s-testa">
          <h1 className="s-h1">Riparazione centraline {m.nome.toLowerCase()}</h1>
          <p className="s-lead">{m.intro} Ritiro gratuito, diagnosi gratuita, paghi solo se è riparabile.</p>
          <div className="s-azioni"><a className="s-btn s-btn-p" href={app("/accedi")}>Prenota un ritiro gratuito</a><Wa testo={`Ciao EcuLion, vorrei un preventivo per una centralina di ${m.nome.toLowerCase()}.`} /></div>
        </div>
        <div className="s-due">
          <div><h2 className="s-h3">Cosa ripariamo</h2><ul className="s-elenco">{m.centraline.map((c) => <li key={c}>{c}</li>)}</ul></div>
          <div><h2 className="s-h3">Sintomi che ci mandano più spesso</h2><ul className="s-elenco">{m.guasti.map((g) => <li key={g}>{g}</li>)}</ul></div>
        </div>
        {pagine.length ? (
          <div style={{ marginTop: 48 }}>
            <h2 className="s-h3" style={{ marginBottom: 16 }}>Centraline nel catalogo</h2>
            <ul className="s-cat">{pagine.map((p) => <li key={p.slug}><Link href={u(`/centraline/${p.slug}`)}><span className="s-h3">{p.titolo}</span>{p.codice ? <span className="s-mono">{p.codice}</span> : null}</Link></li>)}</ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
