import { BASE, MEZZI } from "@/sito/config";
import { parametriPubblici } from "@/sito/dati";
import { SenzaCodice } from "../SenzaCodice";

export const metadata = { title: "Preventivo senza codice", robots: { index: false } };
export const revalidate = 600;

export default async function Senza() {
  const p = await parametriPubblici();
  return (
    <section className="pv">
      <div className="pv-wrap"><SenzaCodice fasce={p.fasce} da={p.prezzo_da} mezzi={MEZZI.map((m) => m.nome)} base={BASE} /></div>
    </section>
  );
}
