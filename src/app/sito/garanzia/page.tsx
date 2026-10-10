import { app } from "@/sito/config";
import { FormVerifica } from "./Verifica";

export const metadata = { title: "Garanzia a vita", description: "Come funziona la garanzia a vita sul guasto riparato e come verificare un certificato EcuLion." };

export default function Garanzia() {
  return (
    <section className="s-sez-s">
      <div className="s-wrap s-due">
        <div className="s-testa" style={{ marginBottom: 0 }}>
          <h1 className="s-h1">Garanzia a vita sul guasto riparato</h1>
          <p className="s-lead">Ogni centralina riparata esce con un certificato: il guasto trovato, cosa abbiamo sostituito e come l&apos;abbiamo collaudata.</p>
          <ul className="s-elenco">
            <li><b>Cosa copre</b>Il guasto riparato e documentato nel certificato, per tutta la vita della centralina.</li>
            <li><b>Come si attiva</b>Dall&apos;app: richiedi un ritiro e indica il numero della pratica. Ritiro e diagnosi sono gratuiti.</li>
            <li><b>Dove trovi il certificato</b>Nell&apos;app, nella sezione Garanzie, appena la centralina è spedita.</li>
          </ul>
          <div className="s-azioni"><a className="s-btn s-btn-g" href={app("/garanzie")}>Apri le tue garanzie</a></div>
        </div>
        <div style={{ background: "var(--bi)", border: "2px solid var(--as)", borderRadius: 10, padding: 28 }}>
          <h2 className="s-h3" style={{ marginBottom: 16 }}>Verifica un certificato</h2>
          <FormVerifica />
        </div>
      </div>
    </section>
  );
}
