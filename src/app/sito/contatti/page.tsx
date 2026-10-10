import { CONTATTI, app } from "@/sito/config";
import { Wa } from "@/sito/Whatsapp";

export const metadata = { title: "Contatti", description: "Contatta il laboratorio EcuLion." };

export default function Contatti() {
  return (
    <section className="s-sez-s">
      <div className="s-wrap s-due">
        <div className="s-testa" style={{ marginBottom: 0 }}>
          <h1 className="s-h1">Contatti</h1>
          <p className="s-lead">Il modo più veloce per un preventivo è cercare la centralina nell&apos;app: vedi subito il prezzo e prenoti il ritiro.</p>
          <div className="s-azioni"><a className="s-btn s-btn-p" href={app("/accedi")}>Entra nell&apos;app</a><Wa /></div>
        </div>
        <ul className="s-elenco">
          {CONTATTI.whatsapp ? <li><b>WhatsApp</b><a href={`https://wa.me/${CONTATTI.whatsapp}`}>Scrivici su WhatsApp</a></li> : null}
          {CONTATTI.telefono ? <li><b>Telefono</b><a href={`tel:${CONTATTI.telefono.replace(/\s/g, "")}`}>{CONTATTI.telefono}</a></li> : null}
          {CONTATTI.email ? <li><b>Email</b><a href={`mailto:${CONTATTI.email}`}>{CONTATTI.email}</a></li> : null}
          <li><b>Laboratorio</b>{CONTATTI.indirizzo ? `${CONTATTI.indirizzo}, ` : ""}{CONTATTI.citta}</li>
          {!CONTATTI.whatsapp && !CONTATTI.telefono && !CONTATTI.email ? <li className="s-muted">Telefono, WhatsApp ed email in arrivo.</li> : null}
        </ul>
      </div>
    </section>
  );
}
