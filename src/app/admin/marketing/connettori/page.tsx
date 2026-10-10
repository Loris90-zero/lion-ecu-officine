import { richiediTitolare } from "@/lib/sessione";
import { statoConnettori } from "@/lib/connettori";

export const dynamic = "force-dynamic";

export default async function Connettori() {
  const { sb } = await richiediTitolare();
  const conn = await statoConnettori(sb);
  const ok = conn.filter((c) => c.stato === "collegato").length;
  return (
    <section className="mk-pagina">
      <header className="mk-testa">
        <div>
          <p className="mk-sopra">Connettori · {ok} di {conn.length} collegati</p>
          <h1 className="mk-h1">Tutto quello che alimenta il marketing</h1>
          <p className="mk-sotto">Le schermate sono pronte. Quando colleghiamo un servizio, i suoi dati entrano da soli nelle schede Panoramica, Ads, Social e Prospezione. Le chiavi si inseriscono solo nei pannelli di Vercel e Supabase, mai in chat.</p>
        </div>
      </header>
      <div className="mk-conn">
        {conn.map((c, i) => (
          <article key={c.id} style={{ animation: `mkEntra .5s ${i * 40}ms both` }}>
            <div className="mk-riga"><h3>{c.nome}</h3><span className={`mk-pill ${c.stato === "collegato" ? "mk-pill-ok" : "mk-pill-acc"}`}>{c.stato === "collegato" ? "Collegato" : "Da collegare"}</span></div>
            <p style={{ margin: 0, fontSize: 14 }}>{c.cosa}</p>
            <p className="mk-piccolo">Serve per: {c.perche}</p>
            <p className="mk-piccolo">Come: {c.dove}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
