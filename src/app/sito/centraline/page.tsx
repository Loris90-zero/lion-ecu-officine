import Link from "next/link";
import { u, app } from "@/sito/config";
import { centralinePubblicate } from "@/sito/dati";
import { Targa } from "../Targa";

export const metadata = { title: "Catalogo centraline", description: "Centraline di camion, bus, gru, movimento terra, agricole, industriali e barche: guasti comuni, sintomi e prezzo della riparazione." };
export const revalidate = 600;
const eur = (n: number) => `${Math.round(n).toLocaleString("it-IT")} €`;

export default async function Centraline({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const lista = await centralinePubblicate(q);
  return (
    <section className="s-sez-s">
      <div className="s-wrap">
        <div className="s-due" style={{ marginBottom: 48 }}>
          <div className="s-testa" style={{ marginBottom: 0 }}>
            <h1 className="s-h1">{q ? `Risultati per «${q}»` : "Catalogo centraline"}</h1>
            <p className="s-lead">Le centraline che ripariamo, con i guasti più comuni e il prezzo indicativo della riparazione.</p>
          </div>
          <Targa />
        </div>
        {lista.length ? (
          <ul className="s-cat">
            {lista.map((c) => (
              <li key={c.slug}>
                <Link href={u(`/centraline/${c.slug}`)}>
                  <span className="s-h3">{c.titolo}</span>
                  {c.codice ? <span className="s-mono">{c.codice}</span> : null}
                  <span className="s-muted">{[c.tipo, c.marca].filter(Boolean).join(", ")}</span>
                  {c.prezzo_da ? <span>Riparazione da <b>{eur(Number(c.prezzo_da))}</b> + IVA</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="s-vuoto">
            <h2 className="s-h3">{q ? "Questa centralina non è ancora nel catalogo pubblico" : "Il catalogo è in preparazione"}</h2>
            <p>Nell&apos;app la cerchiamo per te: identifichiamo la centralina, ti mostriamo i guasti comuni, il prezzo del nuovo e quello della riparazione.</p>
            <a className="s-btn s-btn-p" href={app("/accedi")}>Cercala nell&apos;app</a>
          </div>
        )}
      </div>
    </section>
  );
}
