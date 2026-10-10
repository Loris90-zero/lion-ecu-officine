import Link from "next/link";
import { u, app, MEZZI } from "@/sito/config";
import { parametriPubblici } from "@/sito/dati";
import { Targa } from "./Targa";

export const revalidate = 3600;

const pct = (n: number) => `${Math.round(Number(n) * 100)}%`;
const eur = (n: number) => `${Math.round(Number(n)).toLocaleString("it-IT")} €`;

export default async function Home() {
  const p = await parametriPubblici();
  return (
    <>
      <section className="s-hero">
        <div className="s-wrap">
          <div className="s-hero-testo">
            <h1 className="s-h1">Centraline di mezzi pesanti riparate, non sostituite.</h1>
            <p className="s-lead">Ritiriamo gratis la centralina dalla tua officina, la diagnostichiamo e ti diciamo quanto costa ripararla. Paghi solo se è riparabile, e il guasto riparato ha la garanzia a vita.</p>
            <div className="s-azioni">
              <a className="s-btn s-btn-p" href={app("/accedi")}>Prenota un ritiro gratuito</a>
              <a className="s-btn s-btn-g" href="#come-funziona">Come funziona</a>
            </div>
            <div className="s-segnali" aria-label="Tempi">
              <div><b>24 h</b>per il ritiro</div>
              <div><b>24 h</b>per diagnosi e riparazione</div>
              <div><b>24 h</b>per la riconsegna</div>
            </div>
          </div>
          <Targa />
        </div>
      </section>

      <section className="s-sez s-chiaro" id="come-funziona">
        <div className="s-wrap">
          <div className="s-testa">
            <h2 className="s-h2">Dalla tua officina al banco prova, e ritorno</h2>
            <p className="s-lead">Tutto passa dall&apos;app: un posto solo per prezzi, ritiri, stato della riparazione e garanzie.</p>
          </div>
          <ol className="s-passi">
            <li><h3>Cerca la centralina</h3><p>Scrivi il codice o fotografa l&apos;etichetta. Vedi subito quanto costa nuova e quanto costa ripararla.</p></li>
            <li><h3>Prenota il ritiro</h3><p>Il corriere passa da te il giorno dopo. Il ritiro è gratuito.</p></li>
            <li><h3>Diagnosi in laboratorio</h3><p>Ti mandiamo l&apos;esito e il prezzo confermato. Se non è riparabile te la rispediamo gratis.</p></li>
            <li><h3>Paghi e la ricevi riparata</h3><p>Con il tracking del corriere e il certificato di garanzia nell&apos;app.</p></li>
          </ol>
        </div>
      </section>

      <section className="s-sez">
        <div className="s-wrap">
          <div className="s-testa">
            <h2 className="s-h2">Ripariamo l&apos;elettronica di</h2>
          </div>
          <nav className="s-mezzi" aria-label="Mezzi">
            {MEZZI.map((m) => <Link key={m.slug} href={u(`/mezzi/${m.slug}`)}>{m.nome}</Link>)}
          </nav>
          <p className="s-muted" style={{ marginTop: 28, maxWidth: "40em" }}>Centraline motore, cambio, freni EBS e ABS, sospensioni, idraulica, cruscotti e body controller. Se ha una scheda elettronica, mandaci il codice.</p>
        </div>
      </section>

      <section className="s-sez s-chiaro">
        <div className="s-wrap s-due">
          <div className="s-testa" style={{ marginBottom: 0 }}>
            <h2 className="s-h2">Il prezzo lo sai prima di spedire</h2>
            <p className="s-lead">La riparazione costa circa il {pct(p.percentuale)} di una centralina nuova, con un minimo di {eur(p.minimo_eur)}. Il tecnico lo conferma dopo la diagnosi: se cambia, decidi tu se procedere.</p>
            <div className="s-azioni"><Link className="s-btn s-btn-g" href={u("/centraline")}>Guarda le centraline</Link></div>
          </div>
          <ul className="s-elenco">
            <li><b>Ritiro e rispedizione gratuiti</b>Il corriere lo paghiamo noi, andata e ritorno.</li>
            <li><b>Diagnosi gratuita</b>Se la centralina non è riparabile non paghi niente.</li>
            <li><b>Paghi dall&apos;app</b>Solo dopo l&apos;esito, quando sai cosa ripariamo e quanto costa.</li>
            <li><b>Prezzi IVA esclusa</b>Per officine e aziende, con fattura elettronica.</li>
          </ul>
        </div>
      </section>

      <section className="s-sez s-scuro">
        <div className="s-wrap s-due">
          <div className="s-testa" style={{ marginBottom: 0 }}>
            <h2 className="s-h2">Garanzia a vita sul guasto riparato</h2>
            <p className="s-lead">Ogni riparazione ha un certificato con il guasto trovato, cosa abbiamo sostituito e come l&apos;abbiamo collaudata. Se lo stesso guasto si ripresenta, la ripariamo di nuovo.</p>
          </div>
          <div className="s-azioni" style={{ alignSelf: "end" }}>
            <Link className="s-btn s-btn-g" href={u("/garanzia")}>Verifica un certificato</Link>
          </div>
        </div>
      </section>

      <section className="s-sez">
        <div className="s-wrap">
          <div className="s-testa">
            <h2 className="s-h2">Più lavori ci mandi, meno paghi</h2>
            <p className="s-lead">Ogni euro speso in riparazioni vale un punto. Contano gli ultimi {p.fedelta_mesi} mesi, e lo sconto si applica da solo.</p>
          </div>
          <div className="s-livelli">
            <div><b>Base</b>Prezzo pieno, ritiro e diagnosi gratuiti.</div>
            <div><b>Partner</b>{pct(p.sconto_partner)} di sconto da {Number(p.soglia_partner_eur).toLocaleString("it-IT")} punti.</div>
            <div><b>Partner Gold</b>{pct(p.sconto_gold)} di sconto da {Number(p.soglia_gold_eur).toLocaleString("it-IT")} punti.</div>
          </div>
          <div className="s-azioni" style={{ marginTop: 32 }}>
            <Link className="s-btn s-btn-p" href={u("/officine")}>Scopri se la tua officina è adatta</Link>
          </div>
        </div>
      </section>
    </>
  );
}
