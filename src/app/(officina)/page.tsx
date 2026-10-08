import { PuntiForti } from "@/components/PuntiForti";
import Link from "next/link";
import { richiediOfficina } from "@/lib/sessione";
import { BarraFasi, PillaFase } from "@/components/Fasi";
import { Installa } from "@/components/Installa";
import { Flusso } from "@/components/Flusso";
import type { Pratica } from "@/lib/types";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { sb, officina, user } = await richiediOfficina();
  const sp = await searchParams;
  const benvenuto = sp.benvenuto;
  const num = (v?: string) => { const n = Number(v); return isFinite(n) && n > 0 ? n : null; };
  const iniziale = sp.ritiro ? { centralina: sp.centralina ?? "", codice: sp.codice ?? "", nota: (sp.nota ?? "").slice(0, 120), stima: num(sp.stima), base: num(sp.base) } : null;
  const { data } = await sb.from("pratiche").select("*").eq("officina_id", officina.id).order("creato_il", { ascending: false });
  const pratiche = (data ?? []) as Pratica[];
  const aperte = pratiche.filter((p) => p.fase < 4 && !(p.esito === "non_riparabile" && p.fase >= 3));
  const daPagare = pratiche.filter((p) => p.esito === "riparabile" && !p.pagato && p.prezzo_confermato_eur);

  return (
    <section className="screen">
      <PuntiForti />
      {benvenuto ? <p className="okmsg">Benvenuti, {officina.referente.split(" ")[0]}. La vostra officina è registrata.</p> : null}
      <Installa />
      {daPagare.length ? (
        <Link href={`/pratica/${daPagare[0].id}`} className="box" style={{ borderColor: "var(--accent)", textDecoration: "none", color: "inherit" }}>
          <span className="label">Da approvare</span>
          <b>{daPagare.length === 1 ? `La centralina ${daPagare[0].numero} è riparabile` : `${daPagare.length} centraline riparabili`}</b>
          <span className="muted" style={{ fontSize: 14 }}>Paga dall&apos;app e procediamo con la riparazione.</span>
        </Link>
      ) : null}
      <Flusso userId={user.id} indirizzo={officina.indirizzo_ritiro} iniziale={iniziale} />
      <div className="section">
        <div className="row"><h2>In lavorazione</h2><span className="label">{aperte.length} {aperte.length === 1 ? "centralina" : "centraline"}</span></div>
        {aperte.length === 0 ? (
          <p className="muted">Nessuna centralina in lavorazione. Quando prenoti un ritiro, la segui da qui passo per passo.</p>
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
