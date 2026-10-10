import { FormCandidatura } from "./Form";

export const metadata = { title: "Lavora con noi", description: "Cerchiamo tecnici elettronici e venditori a provvigione." };

export default function LavoraConNoi() {
  return (
    <section className="s-sez-s">
      <div className="s-wrap s-due">
        <div className="s-testa" style={{ marginBottom: 0 }}>
          <h1 className="s-h1">Lavora con noi</h1>
          <ul className="s-elenco">
            <li><b>Tecnici elettronici</b>Diagnosi e riparazione al banco di centraline di mezzi pesanti. Lavori dal laboratorio con un&apos;app che segue ogni pratica.</li>
            <li><b>Venditori a provvigione</b>Presenti EcuLion alle officine meccaniche della tua zona. Guadagni su ogni officina attivata e sui suoi lavori.</li>
          </ul>
        </div>
        <FormCandidatura />
      </div>
    </section>
  );
}
