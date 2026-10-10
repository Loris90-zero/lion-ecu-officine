import { richiediTitolare } from "@/lib/sessione";
import type { ImpFinanza } from "@/lib/finanza";
import { FormParametri } from "./FormParametri";

export default async function Parametri() {
  const { sb } = await richiediTitolare();
  const { data } = await sb.from("impostazioni_finanza").select("*").eq("id", 1).single();
  return (
    <section className="screen" style={{ maxWidth: 680 }}>
      <h1>Parametri della finanza</h1>
      <div className="box"><FormParametri i={data as ImpFinanza} /></div>
    </section>
  );
}
