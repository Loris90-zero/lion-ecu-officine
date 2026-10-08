import { richiediOfficina } from "@/lib/sessione";
import { FormRitiro } from "./FormRitiro";

export const metadata = { title: "Richiedi ritiro — Lion ECU" };

export default async function Ritiro({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { officina, user } = await richiediOfficina();
  const sp = await searchParams;
  const num = (v?: string) => { const n = Number(v); return isFinite(n) && n > 0 ? n : null; };
  return (
    <section className="screen">
      <div className="section">
        <h1>Richiedi un ritiro</h1>
        <p className="muted">Due minuti. Il corriere passa gratis entro 24 ore lavorative.</p>
      </div>
      <FormRitiro
        userId={user.id}
        indirizzo={officina.indirizzo_ritiro}
        centralina={sp.centralina ?? ""}
        codice={sp.codice ?? ""}
        stima={num(sp.stima)}
        base={num(sp.base)}
        nota={(sp.nota ?? "").slice(0, 120)}
      />
    </section>
  );
}
