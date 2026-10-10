import Link from "next/link";
import { Wa } from "@/sito/Whatsapp";
import { u } from "@/sito/config";

export const metadata = { title: "Officine partner", description: "La rete di officine partner EcuLion per camionisti e aziende di trasporto." };

export default function Partner() {
  return (
    <section className="s-sez-s">
      <div className="s-wrap">
        <div className="s-testa">
          <h1 className="s-h1">Officine partner</h1>
          <p className="s-lead">Stiamo costruendo una rete di officine che lavorano con noi. Camionisti e aziende di trasporto potranno trovare qui l&apos;officina partner più vicina, già abituata a far riparare le centraline invece di sostituirle.</p>
        </div>
        <div className="s-due">
          <div><h2 className="s-h3">Per camionisti e flotte</h2><p>La mappa delle officine partner arriva quando la rete copre le prime zone. Intanto, se il tuo meccanico di fiducia vuole lavorare con noi, segnalagli questa pagina.</p></div>
          <div><h2 className="s-h3">Per le officine</h2><p>Le officine che lavorano con noi con continuità vengono inserite nella rete e nelle pagine per camionisti della loro zona.</p><div className="s-azioni"><Link className="s-btn s-btn-p" href={u("/officine#quiz")}>Candida la tua officina</Link><Wa testo="Ciao EcuLion, vorrei candidare la mia officina come partner." /></div></div>
        </div>
      </div>
    </section>
  );
}
