import { parametriPubblici } from "@/sito/dati";

export const metadata = { title: "Domande frequenti", description: "Prezzi, tempi, ritiro, pagamento e garanzia delle riparazioni EcuLion." };
export const revalidate = 3600;
const pct = (n: number) => `${Math.round(Number(n) * 100)}%`;

export default async function Faq() {
  const p = await parametriPubblici();
  const faq = [
    ["Quanto costa una riparazione?", `Di solito circa il ${pct(p.percentuale)} del prezzo di una centralina nuova, con un minimo di ${Math.round(p.minimo_eur)} € + IVA. Il prezzo lo vedi nell'app prima di spedire e il tecnico lo conferma dopo la diagnosi.`],
    ["Il ritiro e la diagnosi si pagano?", "No. Ritiro, diagnosi e rispedizione sono gratuiti. Paghi solo se la centralina è riparabile."],
    ["E se la centralina non è riparabile?", "Te la rispediamo gratis, senza nessun costo."],
    ["Quanto tempo ci vuole?", "Indicativamente 24 ore per il ritiro, 24 ore per diagnosi e riparazione e 24 ore per la riconsegna. Segui ogni passaggio dall'app."],
    ["Come pago?", "Dall'app, dopo l'esito della diagnosi. I prezzi sono IVA esclusa e la fattura è elettronica."],
    ["Cosa copre la garanzia?", "Il guasto riparato, a vita. Il certificato con guasto, componenti sostituiti e collaudo lo trovi nell'app."],
    ["Lavorate con privati?", "Lavoriamo con officine e aziende. Se sei un autista o un'azienda di trasporto, chiedi alla tua officina di contattarci."],
    ["Come preparo la centralina per la spedizione?", "Scrivi il numero della pratica sulla scatola, proteggi i connettori e imballala bene. Il resto lo fa il corriere."],
  ];
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (
    <section className="s-sez-s">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <div className="s-wrap">
        <div className="s-testa"><h1 className="s-h1">Domande frequenti</h1></div>
        <div className="s-corpo">{faq.map(([q, a]) => <div key={q}><h2 style={{ fontSize: 28 }}>{q}</h2><p>{a}</p></div>)}</div>
      </div>
    </section>
  );
}
