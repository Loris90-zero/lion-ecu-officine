import Link from "next/link";
import { Wa } from "@/sito/Whatsapp";
import { u, app } from "@/sito/config";
import { parametriPubblici } from "@/sito/dati";
import { Quiz } from "./Quiz";
import { CtaPartner } from "../CtaPartner";

export const metadata = { title: "Per le officine", description: "Ripara le centraline dei tuoi clienti senza comprarle nuove: ritiro gratuito, diagnosi gratuita, prezzo prima di spedire e sconti per le officine partner." };
export const revalidate = 3600;
const pct = (n: number) => `${Math.round(Number(n) * 100)}%`;

export default async function Officine() {
  const p = await parametriPubblici();
  return (
    <>
      <section className="s-hero">
        <div className="s-wrap">
          <div className="s-hero-testo">
            <p className="s-target">Per officine meccaniche e meccatroniche di mezzi pesanti</p>
            <h1 className="s-h1">Il preventivo di riparazione in un minuto. Il cliente risparmia, il lavoro resta tuo.</h1>
            <p className="s-lead">Scrivi il codice, vedi subito quanto costa ripararla: di solito circa un terzo del nuovo. Noi ritiriamo, ripariamo in 3 giorni e garantiamo a vita il guasto riparato.</p>
            <ul className="s-elenco">
              <li><b>Preventivo immediato</b>Circa il {pct(p.percentuale)} del nuovo, confermato dopo la diagnosi gratuita.</li>
              <li><b>Zero rischi</b>Se non è riparabile la rispediamo gratis. Paghi solo le riparazioni riuscite.</li>
              <li><b>Tutto dal telefono</b>Ricerca centraline, ritiri, stato della riparazione, pagamenti e certificati.</li>
              <li><b>Sconti da partner</b>{pct(p.sconto_partner)} da {Number(p.soglia_partner_eur).toLocaleString("it-IT")} punti, {pct(p.sconto_gold)} da {Number(p.soglia_gold_eur).toLocaleString("it-IT")} punti negli ultimi {p.fedelta_mesi} mesi.</li>
            </ul>
            <CtaPartner />
          </div>
          <div style={{ background: "var(--bi)", border: "2px solid var(--as)", borderRadius: 10, padding: 28 }} id="quiz">
            <h2 className="s-h3" style={{ marginBottom: 6 }}>La tua officina è adatta? Un minuto, una domanda alla volta.</h2>
            <p className="s-muted" style={{ marginTop: 0 }}>Alla fine ricevi l&apos;accesso all&apos;app.</p>
            <Quiz />
          </div>
        </div>
      </section>
      <section className="s-sez s-chiaro">
        <div className="s-wrap s-due">
          <div className="s-testa" style={{ marginBottom: 0 }}>
            <h2 className="s-h2">Officine partner</h2>
            <p className="s-lead">Le officine che lavorano con noi con continuità entrano nella rete partner. Stiamo preparando una pagina per camionisti e aziende di trasporto che indica l&apos;officina partner più vicina.</p>
            <div className="s-azioni"><Link className="s-btn s-btn-g" href={u("/partner")}>Come funziona la rete</Link><Wa testo="Ciao EcuLion, vorrei diventare officina partner." /></div>
          </div>
          <div className="s-testa" style={{ marginBottom: 0 }}>
            <h2 className="s-h2">Hai già un account?</h2>
            <p className="s-lead">Entra nell&apos;app e prenota il ritiro.</p>
            <div className="s-azioni"><a className="s-btn s-btn-p" href={app("/accedi")}>Entra nell&apos;app</a><Wa /></div>
          </div>
        </div>
      </section>
    </>
  );
}
