import { app } from "@/sito/config";
import { parametriPubblici } from "@/sito/dati";
import { Quiz } from "../officine/Quiz";
import { Wa } from "@/sito/Whatsapp";

export const metadata = { title: "Diventa officina partner", description: "Officine partner EcuLion: sconti fino al 15%, preventivi immediati per i tuoi clienti e la rete che consigliamo a camionisti e flotte." };
export const revalidate = 3600;
const pct = (n: number) => `${Math.round(Number(n) * 100)}%`;

export default async function Partner() {
  const p = await parametriPubblici();
  return (
    <>
      <section className="s-hero">
        <div className="s-wrap">
          <div className="s-hero-testo">
            <p className="s-target">Per officine meccaniche e meccatroniche di mezzi pesanti</p>
            <h1 className="s-h1">Diventa officina partner EcuLion</h1>
            <p className="s-lead">Anche se oggi non hai centraline da riparare. Ti registri gratis, e quando arriva il primo mezzo con la centralina guasta hai già il preventivo in un minuto.</p>
            <ul className="s-benefici">
              <li><b>Preventivi immediati</b>Dal codice dell&apos;etichetta, da proporre subito al tuo cliente.</li>
              <li><b>Sconti fino al {pct(p.sconto_gold)}</b>{pct(p.sconto_partner)} da {Number(p.soglia_partner_eur).toLocaleString("it-IT")} punti, {pct(p.sconto_gold)} da {Number(p.soglia_gold_eur).toLocaleString("it-IT")}.</li>
              <li><b>Nuovi clienti</b>Ti consigliamo a camionisti e flotte della tua zona.</li>
              <li><b>Il lavoro resta tuo</b>Smonti, rimonti e tieni il margine. Noi ripariamo e garantiamo a vita.</li>
              <li><b>Zero costi</b>Ritiro, diagnosi e rispedizione gratuiti. Paghi solo le riparazioni riuscite.</li>
              <li><b>Tutto dall&apos;app</b>Ritiri, stato delle riparazioni, pagamenti e certificati.</li>
            </ul>
          </div>
          <div style={{ background: "var(--bi)", border: "2px solid var(--as)", borderRadius: 10, padding: 28 }} id="quiz">
            <h2 className="s-h3" style={{ marginBottom: 6 }}>Raccontaci la tua officina</h2>
            <p className="s-muted" style={{ marginTop: 0 }}>Un minuto, una domanda alla volta. Alla fine ricevi l&apos;accesso all&apos;app.</p>
            <Quiz origine="sito_partner" />
          </div>
        </div>
      </section>
      <section className="s-sez-s s-chiaro">
        <div className="s-wrap">
          <h2 className="s-h3">Preferisci parlarne a voce?</h2>
          <Wa testo="Ciao EcuLion, vorrei diventare officina partner." />
        </div>
      </section>
    </>
  );
}
