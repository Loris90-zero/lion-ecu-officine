import Link from "next/link";
import { Wa } from "@/sito/Whatsapp";
import { u, app, MEZZI } from "@/sito/config";
import { parametriPubblici } from "@/sito/dati";
import { Targa } from "./Targa";
import { FormFlotta } from "./flotte/FormFlotta";

export const revalidate = 3600;

const pct = (n: number) => `${Math.round(Number(n) * 100)}%`;

export default async function Home() {
  const p = await parametriPubblici();
  const faq = [
    ["E se si guasta di nuovo?", "Se si ripresenta lo stesso guasto, la ripariamo di nuovo. La garanzia sul guasto riparato è a vita."],
    ["Quanto resta fermo il mezzo?", "Di solito 3 giorni dal ritiro alla riconsegna. Se servono componenti particolari da ordinare, ti avvisiamo prima di procedere."],
    ["Come la spedisco?", "Non devi organizzare niente: prenoti il ritiro dall'app e il corriere passa da te. Basta imballarla bene."],
    ["Il prezzo può cambiare?", "Il tecnico lo conferma dopo la diagnosi gratuita. Se cambia, decidi tu: se non procedi, te la rispediamo gratis."],
  ];
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />

      {/* 1. Apertura: target e preventivo immediato */}
      <section className="s-hero">
        <div className="s-wrap">
          <div className="s-hero-testo">
            <p className="s-target">Per meccanici, meccatronici e proprietari di flotte di mezzi pesanti</p>
            <h1 className="s-h1">Scrivi il codice della centralina. In un minuto sai quanto costa ripararla.</h1>
            <p className="s-lead">Di solito circa un terzo del prezzo del nuovo. Ritiro gratis, diagnosi gratis, e paghi solo se è riparabile.</p>
            <ul className="s-garanzie">
              <li>Ritiro gratuito</li>
              <li>Paghi solo se è riparabile</li>
              <li>Garanzia a vita sul guasto</li>
            </ul>
          </div>
          <Targa />
        </div>
      </section>

      {/* 2. L'opportunità per l'officina */}
      <section className="s-sez s-chiaro">
        <div className="s-wrap">
          <div className="s-testa">
            <h2 className="s-h2">Il tuo cliente ha il mezzo fermo. Tu hai due preventivi da proporgli.</h2>
          </div>
          <div className="s-confronto" role="table" aria-label="Centralina nuova o riparazione">
            <div role="row" className="s-c-testa"><span role="columnheader" /><span role="columnheader">Centralina nuova</span><span role="columnheader">Riparazione EcuLion</span></div>
            <div role="row"><span role="rowheader">Prezzo</span><span role="cell">1.500 €</span><span role="cell"><b>500 €</b></span></div>
            <div role="row"><span role="rowheader">Tempi</span><span role="cell">quando arriva il ricambio</span><span role="cell"><b>3 giorni</b></span></div>
            <div role="row"><span role="rowheader">Garanzia</span><span role="cell">quella del ricambio</span><span role="cell"><b>a vita sul guasto riparato</b></span></div>
          </div>
          <p className="s-muted" style={{ fontSize: 14, marginTop: 10 }}>Esempio indicativo. Il prezzo vero della tua centralina lo vedi scrivendo il codice.</p>
          <div className="s-due" style={{ marginTop: 40 }}>
            <p className="s-h3" style={{ fontSize: 40 }}>Quale sceglierà?</p>
            <div>
              <p className="s-lead" style={{ marginTop: 0 }}>Il cliente risparmia mille euro e riparte prima. Tu non perdi il lavoro: smonti, rimonti e il margine resta tuo. Noi ripariamo, e il mezzo torna a lavorare.</p>
              <p style={{ fontWeight: 600, fontSize: 19 }}>Vincono tutti, e il cliente si ricorda chi gli ha fatto risparmiare.</p>
              <a className="s-btn s-btn-p" href="#preventivo">Calcola il preventivo per il tuo cliente</a>
              <Wa testo="Ciao EcuLion, ho un cliente con una centralina guasta: vorrei un preventivo." />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Come funziona */}
      <section className="s-sez" id="come-funziona">
        <div className="s-wrap">
          <div className="s-testa">
            <h2 className="s-h2">Dal tuo banco al nostro, e ritorno in 3 giorni</h2>
          </div>
          <ol className="s-passi">
            <li><h3>Calcoli il preventivo</h3><p>Scrivi il codice qui o nell&apos;app, oppure fotografa l&apos;etichetta. In un minuto hai il prezzo.</p></li>
            <li><h3>Prenoti il ritiro gratuito</h3><p>Il corriere passa da te entro 24 ore.</p></li>
            <li><h3>Diagnosi e riparazione in 24 ore</h3><p>Ricevi esito e prezzo confermato. Se non è riparabile, te la rispediamo gratis.</p></li>
            <li><h3>Paghi e la ricevi in 24 ore</h3><p>Con il tracking del corriere e il certificato di garanzia nell&apos;app.</p></li>
          </ol>
          <p className="s-muted" style={{ fontSize: 14, marginTop: 20 }}>I tempi possono allungarsi se servono componenti particolari da ordinare: in quel caso ti avvisiamo subito, prima di procedere.</p>
        </div>
      </section>

      {/* 4. Rischio zero */}
      <section className="s-sez s-scuro">
        <div className="s-wrap s-due">
          <div className="s-testa" style={{ marginBottom: 0 }}>
            <h2 className="s-h2">Provarci non ti costa niente</h2>
            <p className="s-lead">La prima centralina ce la mandi senza rischi. Se non la ripariamo, non hai speso un euro.</p>
          </div>
          <ul className="s-elenco">
            <li><b>Diagnosi gratuita</b>Se non è riparabile, non paghi nulla.</li>
            <li><b>Ritiro e rispedizione gratuiti</b>Il corriere lo paghiamo noi, andata e ritorno.</li>
            <li><b>Prezzo confermato prima</b>Se dopo la diagnosi cambia, decidi tu se procedere.</li>
            <li><b>Garanzia a vita sul guasto riparato</b>Con certificato verificabile online. <Link href={u("/garanzia")} style={{ color: "var(--am)" }}>Verifica un certificato</Link></li>
          </ul>
        </div>
      </section>

      {/* 5. Chi ripara */}
      <section className="s-sez s-chiaro">
        <div className="s-wrap s-due">
          <div className="s-testa" style={{ marginBottom: 0 }}>
            <h2 className="s-h2">Dietro ogni preventivo c&apos;è un banco prova, non un call center</h2>
            <p className="s-lead">Il laboratorio lo guida Alex Chiriak, cofondatore di EcuLion, che da oltre 6 anni ripara l&apos;elettronica di mezzi pesanti e macchine da lavoro.</p>
            <p>Ogni centralina passa dal banco prova, e ogni riparazione viene documentata: guasto, componenti sostituiti, collaudo. Così la diagnosi successiva sullo stesso modello è più veloce e più sicura.</p>
          </div>
          <div className="s-vuoto" style={{ minHeight: 300, display: "grid", placeItems: "center", textAlign: "center" }}>
            <p className="s-muted">Foto di Alex al banco prova</p>
          </div>
        </div>
      </section>

      {/* 6. Partnership con le officine */}
      <section className="s-sez">
        <div className="s-wrap">
          <div className="s-testa">
            <h2 className="s-h2">Diventa officina partner</h2>
            <p className="s-lead">Più centraline ci mandi, meno le paghi. E i partner entrano nella rete che consigliamo a camionisti e aziende di trasporto della loro zona.</p>
          </div>
          <div className="s-livelli">
            <div><b>Base</b>Prezzo pieno, ritiro e diagnosi gratuiti.</div>
            <div><b>Partner</b>{pct(p.sconto_partner)} di sconto da {Number(p.soglia_partner_eur).toLocaleString("it-IT")} punti.</div>
            <div><b>Partner Gold</b>{pct(p.sconto_gold)} di sconto da {Number(p.soglia_gold_eur).toLocaleString("it-IT")} punti.</div>
          </div>
          <p className="s-muted" style={{ marginTop: 12 }}>Ogni euro speso in riparazioni vale un punto, negli ultimi {p.fedelta_mesi} mesi. Lo sconto si applica da solo.</p>
          <div className="s-azioni" style={{ marginTop: 24 }}>
            <Link className="s-btn s-btn-p" href={u("/officine")}>Scopri se la tua officina è adatta</Link>
            <Wa testo="Ciao EcuLion, vorrei diventare officina partner." />
          </div>
        </div>
      </section>

      {/* 7. Flotte e aziende di trasporto */}
      <section className="s-sez s-chiaro" id="flotte">
        <div className="s-wrap s-due">
          <div className="s-testa" style={{ marginBottom: 0 }}>
            <h2 className="s-h2">Hai una flotta? Un mezzo fermo costa ogni giorno.</h2>
            <p className="s-lead">Con EcuLion sai subito quanto costa riparare invece di sostituire. La tua officina di fiducia lavora con noi, oppure ti indichiamo un&apos;officina partner nella tua zona.</p>
            <div className="s-azioni"><a className="s-btn s-btn-g" href="#preventivo">Calcola il preventivo</a><Wa testo="Ciao EcuLion, ho una flotta di mezzi e vorrei parlare con voi." /></div>
          </div>
          <FormFlotta />
        </div>
      </section>

      {/* 8. Mezzi */}
      <section className="s-sez">
        <div className="s-wrap">
          <div className="s-testa"><h2 className="s-h2">Ripariamo l&apos;elettronica di</h2></div>
          <nav className="s-mezzi" aria-label="Mezzi">
            {MEZZI.map((m) => <Link key={m.slug} href={u(`/mezzi/${m.slug}`)}>{m.nome}</Link>)}
          </nav>
          <p className="s-muted" style={{ marginTop: 28, maxWidth: "40em" }}>Centraline motore, cambio, freni EBS e ABS, sospensioni, idraulica e cruscotti. Se ha una scheda elettronica, mandaci il codice.</p>
        </div>
      </section>

      {/* 9. Domande */}
      <section className="s-sez s-chiaro">
        <div className="s-wrap">
          <div className="s-testa"><h2 className="s-h2">Le domande che ci fanno tutti</h2></div>
          <div className="s-faq">
            {faq.map(([q, a]) => <div key={q}><h3 className="s-h3">{q}</h3><p>{a}</p></div>)}
          </div>
          <p style={{ marginTop: 24 }}><Link href={u("/faq")}>Tutte le domande frequenti</Link></p>
        </div>
      </section>

      {/* 10. Chiusura */}
      <section className="s-sez s-scuro" id="preventivo">
        <div className="s-wrap s-due">
          <div className="s-testa" style={{ marginBottom: 0 }}>
            <h2 className="s-h2">Hai il codice sotto mano? Scopri adesso quanto costa ripararla.</h2>
            <p className="s-lead">Preventivo in un minuto, gratis e senza registrazione. Se ti convince, prenoti il ritiro dall&apos;app.</p>
            <div className="s-azioni"><a className="s-btn s-btn-g" href={app("/accedi")}>Entra nell&apos;app</a><Wa /></div>
          </div>
          <Targa id="codice-chiusura" />
        </div>
      </section>
    </>
  );
}
