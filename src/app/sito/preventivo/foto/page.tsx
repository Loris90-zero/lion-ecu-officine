import { app, BASE } from "@/sito/config";
import { FotoEtichetta } from "../FotoEtichetta";

export const metadata = { title: "Preventivo dalla foto", robots: { index: false } };

export default function Foto() {
  return (
    <section className="pv">
      <div className="pv-wrap"><FotoEtichetta base={BASE} app={app("")} /></div>
    </section>
  );
}
