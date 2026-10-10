import Link from "next/link";
import { Wa } from "@/sito/Whatsapp";
import { notFound } from "next/navigation";
import { u, app, MEZZI, SITO_URL } from "@/sito/config";
import { centralina } from "@/sito/dati";

export const revalidate = 600;
const eur = (n: number) => `${Math.round(n).toLocaleString("it-IT")} €`;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = await centralina((await params).slug);
  if (!c) return {};
  return { title: `${c.titolo}: riparazione e guasti comuni`, description: (c.descrizione ?? "").slice(0, 155), alternates: { canonical: `${SITO_URL}/centraline/${c.slug}` } };
}

export default async function Centralina({ params }: { params: Promise<{ slug: string }> }) {
  const c = await centralina((await params).slug);
  if (!c) notFound();
  const mezzi = MEZZI.filter((m) => c.mezzi.includes(m.slug));
  const prenota = u(`/prenota?centralina=${encodeURIComponent(c.titolo)}&codice=${encodeURIComponent(c.codice ?? "")}${c.prezzo_da ? `&stima=${c.prezzo_da}` : ""}${c.prezzo_nuovo ? `&base=${c.prezzo_nuovo}` : ""}`);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Service", name: `Riparazione ${c.titolo}`, provider: { "@type": "Organization", name: "EcuLion" }, areaServed: "IT", ...(c.prezzo_da ? { offers: { "@type": "Offer", priceCurrency: "EUR", price: c.prezzo_da } } : {}) },
      ...(c.faq.length ? [{ "@type": "FAQPage", mainEntity: c.faq.map((f) => ({ "@type": "Question", name: f.domanda, acceptedAnswer: { "@type": "Answer", text: f.risposta } })) }] : []),
    ],
  };
  return (
    <section className="s-sez-s">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <div className="s-wrap">
        <p><Link href={u("/centraline")}>Catalogo centraline</Link></p>
        <div className="s-due">
          <div className="s-testa" style={{ marginBottom: 0 }}>
            <h1 className="s-h1">Riparazione {c.titolo}</h1>
            {c.codice ? <p className="s-mono" style={{ fontSize: 20, margin: 0 }}>{c.codice}</p> : null}
            {c.descrizione ? <p className="s-lead">{c.descrizione}</p> : null}
          </div>
          <div style={{ background: "var(--bi)", border: "2px solid var(--as)", borderRadius: 10, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="s-prezzo">
              {c.prezzo_da ? <div><b>{eur(Number(c.prezzo_da))}</b>riparazione, + IVA</div> : <div><b>Su richiesta</b>prezzo dopo la diagnosi gratuita</div>}
              {c.prezzo_nuovo ? <div><b className="s-muted">{eur(Number(c.prezzo_nuovo))}</b>nuova, indicativo</div> : null}
            </div>
            <p className="s-muted" style={{ margin: 0 }}>Prezzo indicativo: lo conferma il tecnico dopo la diagnosi. Ritiro, diagnosi e rispedizione sono gratuiti.</p>
            <a className="s-btn s-btn-p" href={prenota}>Prenota il ritiro di questa centralina</a>
            <Wa testo={`Ciao EcuLion, vorrei un preventivo per la centralina ${c.titolo}${c.codice ? ` (${c.codice})` : ""}.`} />
          </div>
        </div>
        <div className="s-corpo">
          {c.guasti.length ? (
            <>
              <h2>Guasti più comuni</h2>
              <ul className="s-elenco">{c.guasti.map((g) => <li key={g.titolo}><b>{g.titolo}</b>{g.sintomi}</li>)}</ul>
            </>
          ) : null}
          {c.veicoli.length ? (<><h2>Su quali mezzi è montata</h2><p>{c.veicoli.join(", ")}.</p></>) : null}
          {mezzi.length ? <p>Vedi anche: {mezzi.map((m, i) => <span key={m.slug}>{i ? ", " : ""}<Link href={u(`/mezzi/${m.slug}`)}>centraline {m.nome.toLowerCase()}</Link></span>)}.</p> : null}
          {c.faq.length ? (<><h2>Domande frequenti</h2>{c.faq.map((f) => <div key={f.domanda}><h3>{f.domanda}</h3><p>{f.risposta}</p></div>)}</>) : null}
        </div>
      </div>
    </section>
  );
}
