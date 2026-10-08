import Link from "next/link";
import { richiediOfficina } from "@/lib/sessione";
import { BarraFasi, PillaFase } from "@/components/Fasi";
import { Installa } from "@/components/Installa";
import type { Pratica } from "@/lib/types";

export default async function Lavori({ searchParams }: { searchParams: Promise<{ benvenuto?: string }> }) {
  const { sb, officina } = await richiediOfficina();
  const { benvenuto } = await searchParams;
  const { data } = await sb.from("pratiche").select("*").eq("officina_id", officina.id).order("creato_il", { ascending: false });
  const pratiche = (data ?? []) as Pratica[];
  const aperte = pratiche.filter((p) => p.fase < 4 && !(p.esito === "non_riparabile" && p.fase >= 3));
  const daPagare = pratiche.filter((p) => p.esito === "riparabile" && !p.pagato && p.prezzo_confermato_eur);

  return (
    <section className="screen">
      {benvenuto ? <p className="okmsg">Benvenuti, {officina.referente.split(" ")[0]}. La vostra officina è registrata.</p> : null}
      <Installa />
      {daPagare.length ? (
        <Link href={`/pratica/${daPagare[0].id}`} className="box" style={{ borderColor: "var(--accent)", textDecoration: "none", color: "inherit" }}>
          <span className="label">Da approvare</span>
          <b>{daPagare.length === 1 ? `La centralina ${daPagare[0].numero} è riparabile` : `${daPagare.length} centraline riparabili`}</b>
          <span className="muted" style={{ fontSize: 14 }}>Paga dall&apos;app e procediamo con la riparazione.</span>
        </Link>
      ) : null}
      <div className="cta">
        <h2>Centralina ferma? Il corriere passa entro 24 ore.</h2>
        <p>Ritiro e riconsegna gratuiti. Paghi solo se è riparabile, altrimenti te la rispediamo gratis.</p>
        <div className="sla"><div><b>24h</b><span>ritiro</span></div><div><b>24h</b><span>diagnosi e riparazione</span></div><div><b>24h</b><span>riconsegna</span></div></div>
        <div className="grid2">
          <Link className="btn btn-ghost" style={{ color: "#fff", borderColor: "rgba(255,255,255,.35)" }} href="/cerca">Cerca centralina</Link>
          <Link className="btn btn-primary" href="/ritiro">Richiedi ritiro</Link>
        </div>
      </div>
      <div className="section">
        <div className="row"><h2>In lavorazione</h2><span className="label">{aperte.length} {aperte.length === 1 ? "centralina" : "centraline"}</span></div>
        {aperte.length === 0 ? (
          <p className="muted">Nessuna centralina in lavorazione. Quando richiedi un ritiro, la segui da qui passo per passo.</p>
        ) : (
          aperte.map((p) => (
            <Link key={p.id} href={`/pratica/${p.id}`} className="card">
              <div className="row"><span className="mono muted" style={{ fontSize: 12 }}>{p.numero}</span><PillaFase p={p} /></div>
              <div><h3>{p.mezzo}</h3><div className="mono muted" style={{ fontSize: 13 }}>{p.centralina || p.codice_etichetta || "Centralina da identificare"}</div></div>
              <BarraFasi fase={p.fase} />
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
