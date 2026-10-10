import { redirect } from "next/navigation";
import { u, app, BASE } from "@/sito/config";
import { Risultato } from "./Risultato";

export const metadata = { title: "Il tuo preventivo", robots: { index: false } };

export default async function Preventivo({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const codice = (q ?? "").trim().slice(0, 60);
  if (codice.replace(/[^A-Za-z0-9]/g, "").length < 4) redirect(u("/"));
  return (
    <section className="pv">
      <div className="pv-wrap">
        <Risultato q={codice} base={BASE} app={app("")} />
        <form className="pv-altro" action={u("/preventivo")} method="get" role="search">
          <label htmlFor="pv-q">Non è la tua centralina? Cerca un altro codice</label>
          <div><input id="pv-q" name="q" className="s-mono" placeholder="0281 020 459" autoComplete="off" /><button className="s-btn s-btn-g" type="submit">Calcola</button></div>
        </form>
      </div>
    </section>
  );
}
