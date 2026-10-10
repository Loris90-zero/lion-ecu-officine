import { CONTATTI } from "@/sito/config";

export const metadata = { title: "Chi siamo", description: "EcuLion è un laboratorio di riparazione di centraline elettroniche per mezzi pesanti e macchine da lavoro." };

export default function ChiSiamo() {
  return (
    <section className="s-sez-s">
      <div className="s-wrap s-due">
        <div className="s-testa" style={{ marginBottom: 0 }}>
          <h1 className="s-h1">Un laboratorio, non un rivenditore</h1>
          <p className="s-lead">EcuLion ripara centraline elettroniche di camion, bus, gru, macchine movimento terra, agricole, industriali e barche. Il nostro lavoro è far tornare a funzionare la centralina che hai, non vendertene una nuova.</p>
          <p>Ogni riparazione passa dal banco prova e viene documentata: guasto, componenti sostituiti, collaudo. Quello che impariamo su ogni centralina entra nella nostra banca dati e rende più veloce la diagnosi successiva.</p>
          <p className="s-muted">Laboratorio a {CONTATTI.citta}. Lavoriamo con officine di tutta Italia tramite ritiro con corriere.</p>
        </div>
        <div className="s-vuoto" aria-label="Foto del laboratorio in arrivo" style={{ minHeight: 320, display: "grid", placeItems: "center", textAlign: "center" }}>
          <p className="s-muted">Qui andranno le foto vere del laboratorio, del banco prova e del team.</p>
        </div>
      </div>
    </section>
  );
}
