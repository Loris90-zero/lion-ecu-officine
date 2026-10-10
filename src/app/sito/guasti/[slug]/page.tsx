import Link from "next/link";
import { Wa } from "@/sito/Whatsapp";
import { notFound } from "next/navigation";
import { u, app, SITO_URL } from "@/sito/config";
import { articolo } from "@/sito/dati";
import { Testo } from "@/sito/testo";

export const revalidate = 600;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = await articolo((await params).slug);
  return a ? { title: a.titolo, description: a.sommario ?? undefined, alternates: { canonical: `${SITO_URL}/guasti/${a.slug}` } } : {};
}

export default async function Guida({ params }: { params: Promise<{ slug: string }> }) {
  const a = await articolo((await params).slug);
  if (!a) notFound();
  return (
    <section className="s-sez-s">
      <article className="s-wrap">
        <p><Link href={u("/guasti")}>Guasti e guide</Link></p>
        <div className="s-testa"><h1 className="s-h1">{a.titolo}</h1>{a.sommario ? <p className="s-lead">{a.sommario}</p> : null}</div>
        <div className="s-corpo"><Testo corpo={a.corpo} /></div>
        <div className="s-vuoto" style={{ marginTop: 48, borderStyle: "solid" }}>
          <h2 className="s-h3">Hai questo guasto?</h2>
          <p>Ritiriamo la centralina gratis, la diagnostichiamo e ti diciamo quanto costa ripararla. Paghi solo se è riparabile.</p>
          <div className="s-azioni">
            <a className="s-btn s-btn-p" href={u("/prenota")}>Prenota un ritiro gratuito</a>
            {a.centralina_slug ? <Link className="s-btn s-btn-g" href={u(`/centraline/${a.centralina_slug}`)}>Vedi la centralina</Link> : null}
            <Wa testo={`Ciao EcuLion, ho letto la guida «${a.titolo}» e ho questo guasto.`} />
          </div>
        </div>
      </article>
    </section>
  );
}
