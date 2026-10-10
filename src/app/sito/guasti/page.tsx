import Link from "next/link";
import { u, app } from "@/sito/config";
import { articoliPubblicati } from "@/sito/dati";

export const metadata = { title: "Guasti e guide", description: "Guide pratiche sui guasti delle centraline di mezzi pesanti: sintomi, cause e cosa fare." };
export const revalidate = 600;

export default async function Guasti() {
  const lista = await articoliPubblicati();
  return (
    <section className="s-sez-s">
      <div className="s-wrap">
        <div className="s-testa">
          <h1 className="s-h1">Guasti e guide</h1>
          <p className="s-lead">Sintomi, cause e cosa fare, scritti dal nostro laboratorio per meccanici e autisti.</p>
        </div>
        {lista.length ? (
          <ul className="s-elenco" style={{ maxWidth: 820 }}>
            {lista.map((a) => <li key={a.slug}><Link href={u(`/guasti/${a.slug}`)} style={{ textDecoration: "none" }}><b className="s-h3">{a.titolo}</b>{a.sommario ? <span className="s-muted">{a.sommario}</span> : null}</Link></li>)}
          </ul>
        ) : (
          <div className="s-vuoto"><h2 className="s-h3">Le prime guide arrivano a breve</h2><p>Hai un guasto adesso? Cerca la centralina nell&apos;app e prenota un ritiro gratuito.</p><a className="s-btn s-btn-p" href={app("/accedi")}>Entra nell&apos;app</a></div>
        )}
      </div>
    </section>
  );
}
