import { app } from "@/sito/config";
import { Quiz } from "../officine/Quiz";
import { Wa } from "@/sito/Whatsapp";

export const metadata = { title: "Prenota il ritiro", robots: { index: false } };

type P = { centralina?: string; codice?: string; stima?: string; base?: string };
const pulisci = (v?: string) => (v ?? "").slice(0, 120);

/** Dal preventivo del sito al ritiro: 30 secondi di questionario, poi accesso e modulo già compilato. */
export default async function Prenota({ searchParams }: { searchParams: Promise<P> }) {
  const sp = await searchParams;
  const ritiro = { centralina: pulisci(sp.centralina), codice: pulisci(sp.codice), stima: pulisci(sp.stima), base: pulisci(sp.base) };
  const nome = ritiro.centralina || ritiro.codice;
  const diretto = app(`/ritiro?${new URLSearchParams(Object.entries(ritiro).filter(([, v]) => v)).toString()}`);
  return (
    <section className="s-hero">
      <div className="s-wrap">
        <div className="s-hero-testo">
          <p className="s-target">Prenotazione del ritiro gratuito{nome ? ` · ${nome}` : ""}</p>
          <h1 className="s-h1">30 secondi per conoscerci prima di prenotare il ritiro della centralina</h1>
          <p className="s-lead">Qualche domanda veloce sulla tua officina o sulla tua flotta, poi entri nell&apos;app e trovi il ritiro già compilato.</p>
          <ul className="s-garanzie">
            <li>Ritiro gratuito</li>
            <li>Paghi solo se è riparabile</li>
            <li>Garanzia a vita sul guasto</li>
          </ul>
          <p className="s-muted" style={{ marginTop: 8 }}>Hai già un account? <a href={diretto}>Entra e prenota direttamente</a>.</p>
          <Wa testo={`Ciao EcuLion, vorrei prenotare il ritiro della centralina ${nome || ""}.`} />
        </div>
        <div style={{ background: "var(--bi)", border: "2px solid var(--as)", borderRadius: 10, padding: 28 }}>
          <Quiz origine="sito_prenota" ritiro={ritiro} />
        </div>
      </div>
    </section>
  );
}
