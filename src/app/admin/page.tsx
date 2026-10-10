import Link from "next/link";
import { richiediTitolare } from "@/lib/sessione";
import { caricaDati, calcola, andamento, periodo, CATEGORIE } from "@/lib/finanza";
import { Simulatore } from "./Simulatore";

const e = (v: number | null | undefined) => (v === null || v === undefined || !isFinite(v) ? "—" : Math.round(v).toLocaleString("it-IT") + " €");
const PERIODI = [["mese", "Mese"], ["mese_scorso", "Mese scorso"], ["trimestre", "Trimestre"], ["anno", "Anno"], ["12mesi", "12 mesi"]] as const;

export default async function Finanza({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { sb } = await richiediTitolare();
  const sp = await searchParams;
  const per = periodo(sp.p);
  const dati = await caricaDati(sb);
  const c = calcola(dati, per);
  const storia = andamento(dati);
  const cat = Object.entries(c.perCat).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(1, ...cat.map(([, v]) => v));
  const semaforo = c.cac === null || c.cacMax === null ? null : c.cac <= c.cacMax * 0.8 ? "verde" : c.cac <= c.cacMax ? "giallo" : "rosso";

  return (
    <section className="screen">
      <div className="row" style={{ flexWrap: "wrap" }}>
        <h1>Finanza · {per.nome}</h1>
        <div className="filters" style={{ margin: 0 }}>
          {PERIODI.map(([k, n]) => <Link key={k} href={k === "mese" ? "/admin" : `/admin?p=${k}`} aria-current={(sp.p ?? "mese") === k ? "true" : undefined}>{n}</Link>)}
        </div>
      </div>

      <div className="kpi">
        <div><span className="label">Fatturato (imponibile)</span><b>{e(c.ricavi)}</b><small>{c.pratichePagate} pratiche pagate</small></div>
        <div><span className="label">Costi</span><b>{e(c.costi)}</b><small>{c.spedite} spedizioni</small></div>
        <div><span className="label">Utile prima delle tasse</span><b className={c.utile < 0 ? "neg" : ""}>{e(c.utile)}</b><small>tasse stimate {e(c.tasse)}</small></div>
        <div className="kpi-forte"><span className="label">Netto che rimane</span><b className={c.netto < 0 ? "neg" : ""}>{e(c.netto)}</b><small>stima</small></div>
        <div><span className="label">IVA da versare</span><b>{e(c.ivaDaVersare)}</b><small>{e(c.ivaVendite)} vendite − {e(c.ivaCosti)} acquisti</small></div>
        <div><span className="label">Da incassare</span><b>{e(c.inAttesa)}</b><small>riparabili non pagate</small></div>
      </div>

      <div className="lab-grid">
        <div className="box">
          <span className="label">Spese per categoria</span>
          {cat.length === 0 ? <p className="muted">Nessuna spesa nel periodo. Inseriscile in <Link href="/admin/costi">Costi</Link>.</p> : (
            <table className="tbl">
              <tbody>
                {cat.map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ width: "38%" }}>{CATEGORIE[k] ?? k}</td>
                    <td><div className="barretta"><i style={{ width: `${(v / maxCat) * 100}%` }} /></div></td>
                    <td className="mono" style={{ textAlign: "right", whiteSpace: "nowrap" }}>{e(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="hint">Corriere {e(dati.imp.corriere_per_pratica)} e materiali {e(dati.imp.materiali_per_pratica)} per pratica, automatici. I costi fissi contano il mese intero. Sconti fedeltà concessi: {e(c.sconti)} (già tolti dal fatturato).</p>
        </div>

        <div className="box">
          <span className="label">Quanto spingere in pubblicità</span>
          <dl>
            <dt>Margine per pratica</dt><dd className="mono">{e(c.margineContrib)} <span className="hint">prezzo − corriere − materiali − commissioni (operai esclusi)</span></dd>
            <dt>Pratiche al mese per officina</dt><dd className="mono">{c.praticheMese?.toFixed(1) ?? "—"} <span className="hint">media ultimi 6 mesi, {c.officineAttive} officine attive</span></dd>
            <dt>Valore di un&apos;officina</dt><dd className="mono">{e(c.valoreOfficina)} <span className="hint">su {dati.imp.mesi_cliente} mesi</span></dd>
            <dt>Costo massimo per acquisirla</dt><dd className="mono"><b>{e(c.cacMax)}</b> <span className="hint">{Math.round(dati.imp.quota_cac * 100)}% del valore</span></dd>
            <dt>Costo reale nel periodo</dt><dd className="mono">{e(c.cac)} <span className="hint">{e(c.ads)} di pubblicità / {c.nuove} officine nuove</span></dd>
          </dl>
          {semaforo ? (
            <p className={`semaforo s-${semaforo}`}>{semaforo === "verde" ? "Verde: ogni officina costa meno del massimo. Puoi aumentare il budget." : semaforo === "giallo" ? "Giallo: sei vicino al limite. Mantieni il budget e migliora le inserzioni." : "Rosso: ogni officina costa più di quanto rende. Riduci o cambia le campagne."}</p>
          ) : <p className="hint">Il semaforo si accende quando ci sono spese di pubblicità e officine nuove nel periodo.</p>}
          <Simulatore cac={c.cac} valore={c.valoreOfficina} mesi={dati.imp.mesi_cliente} />
        </div>
      </div>

      <div className="box">
        <span className="label">Ultimi 12 mesi</span>
        <div className="tblw" style={{ border: 0 }}>
          <table className="tbl">
            <thead><tr><th>Mese</th><th>Fatturato</th><th>Costi</th><th>Utile</th><th>Netto</th><th>IVA da versare</th><th>Pratiche</th></tr></thead>
            <tbody>
              {storia.map(({ mese, c: m }) => (
                <tr key={mese}>
                  <td>{mese}</td><td className="mono">{e(m.ricavi)}</td><td className="mono">{e(m.costi)}</td>
                  <td className={`mono ${m.utile < 0 ? "neg" : ""}`}>{e(m.utile)}</td><td className={`mono ${m.netto < 0 ? "neg" : ""}`}>{e(m.netto)}</td>
                  <td className="mono">{e(m.ivaDaVersare)}</td><td className="mono">{m.pratichePagate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="hint">Cruscotto di gestione: IVA e tasse sono stime per decidere (aliquote in <Link href="/admin/impostazioni">Parametri</Link>). I conti ufficiali li chiude il commercialista.</p>
    </section>
  );
}
