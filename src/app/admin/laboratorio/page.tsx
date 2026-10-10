import Link from "next/link";
import { richiediTitolare } from "@/lib/sessione";
import { dataBreve } from "@/lib/fasi";
import { PillaFase } from "@/components/Fasi";
import type { Pratica } from "@/lib/types";

const ore = (ms: number | null) => (ms === null ? "—" : ms < 864e5 ? `${Math.round(ms / 36e5)} ore` : `${(ms / 864e5).toFixed(1)} giorni`);
const media = (v: number[]) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : null);

export default async function Tecnici() {
  const { sb } = await richiediTitolare();
  const da30 = new Date(Date.now() - 30 * 864e5).toISOString();
  const da90 = new Date(Date.now() - 90 * 864e5).toISOString();
  const [{ data: staff }, { data: msg }, { data: rel }, { data: ev }, { data: pr }] = await Promise.all([
    sb.from("staff").select("email, nome, ruolo, attivo").eq("attivo", true),
    sb.from("messaggi").select("creato_da, tipo").gte("creato_il", da30),
    sb.from("interventi").select("tecnico").gte("creato_il", da30),
    sb.from("eventi").select("pratica_id, fase, testo, creato_il").gte("creato_il", da90),
    sb.from("pratiche").select("*").order("aggiornato_il"),
  ]);
  const pratiche = (pr ?? []) as Pratica[];

  // Lavoro per persona negli ultimi 30 giorni
  const per = new Map<string, { passi: number; esiti: number; spedizioni: number; relazioni: number }>();
  const conta = (k: string | null) => { const n = k ?? "—"; if (!per.has(n)) per.set(n, { passi: 0, esiti: 0, spedizioni: 0, relazioni: 0 }); return per.get(n)!; };
  for (const m of msg ?? []) {
    const r = conta(m.creato_da); r.passi++;
    if (m.tipo === "riparabile" || m.tipo === "non_riparabile") r.esiti++;
    if (m.tipo === "spedita" || m.tipo === "rispedita") r.spedizioni++;
  }
  for (const x of rel ?? []) conta(x.tecnico).relazioni++;

  // Tempi medi (ultimi 90 giorni)
  const t = new Map<string, { arrivo?: number; esito?: number; spedita?: number }>();
  for (const e of ev ?? []) {
    const r = t.get(e.pratica_id) ?? {}; const ms = new Date(e.creato_il).getTime();
    if (e.fase === 1 && e.testo === "Centralina arrivata") r.arrivo = ms;
    if (e.testo.startsWith("Diagnosi:")) r.esito = ms;
    if (e.fase === 3 && e.testo === "Reinvio confermato") r.spedita = ms;
    t.set(e.pratica_id, r);
  }
  const arrivoEsito = media([...t.values()].filter((r) => r.arrivo && r.esito).map((r) => r.esito! - r.arrivo!));
  const esitoSpedita = media([...t.values()].filter((r) => r.esito && r.spedita).map((r) => r.spedita! - r.esito!));
  const recenti = pratiche.filter((p) => p.esito && p.aggiornato_il >= da90);
  const riparabili = recenti.filter((p) => p.esito === "riparabile").length;
  const garanzie = pratiche.filter((p) => p.creato_il >= da90 && /^garanzia pratica/i.test(p.sintomo)).length;

  // Pratiche ferme
  const adesso = Date.now();
  const ferme = pratiche.filter((p) => {
    const fermo = adesso - new Date(p.aggiornato_il).getTime();
    if ((p.fase === 1 || (p.fase === 2 && !p.esito)) && fermo > 2 * 864e5) return true;
    if (p.fase === 2 && p.esito === "riparabile" && p.pagato && fermo > 2 * 864e5) return true;
    return false;
  });
  const nonPagate = pratiche.filter((p) => p.fase === 2 && p.esito === "riparabile" && !p.pagato && adesso - new Date(p.aggiornato_il).getTime() > 3 * 864e5);
  const nomi = new Map((staff ?? []).map((s) => [s.nome ?? s.email, s.ruolo]));

  return (
    <section className="screen">
      <h1>Tecnici e laboratorio</h1>
      <div className="kpi">
        <div><span className="label">Arrivo → esito diagnosi</span><b>{ore(arrivoEsito)}</b><small>media 90 giorni</small></div>
        <div><span className="label">Esito → spedizione</span><b>{ore(esitoSpedita)}</b><small>compresa l&apos;attesa del pagamento</small></div>
        <div><span className="label">Riparabili</span><b>{recenti.length ? `${Math.round((riparabili / recenti.length) * 100)}%` : "—"}</b><small>{riparabili} su {recenti.length} diagnosi</small></div>
        <div><span className="label">Rientri in garanzia</span><b>{garanzie}</b><small>ultimi 90 giorni</small></div>
      </div>
      <div className="lab-grid">
        <div className="box">
          <span className="label">Lavoro per persona · ultimi 30 giorni</span>
          <table className="tbl">
            <thead><tr><th>Persona</th><th>Passi</th><th>Esiti</th><th>Spedizioni</th><th>Relazioni</th></tr></thead>
            <tbody>
              {per.size === 0 ? <tr><td colSpan={5} className="muted">Nessuna attività registrata.</td></tr> : null}
              {[...per.entries()].sort((a, b) => b[1].passi - a[1].passi).map(([n, r]) => (
                <tr key={n}><td>{n}<div className="hint">{nomi.get(n) === "tecnico" ? "Tecnico" : nomi.get(n) ? "Amministrazione" : ""}</div></td><td className="mono">{r.passi}</td><td className="mono">{r.esiti}</td><td className="mono">{r.spedizioni}</td><td className="mono">{r.relazioni}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="hint">Conta i passi fatti con i bottoni rapidi e le relazioni scritte. Staff attivo: {(staff ?? []).length} persone.</p>
        </div>
        <div className="section" style={{ gap: 16 }}>
          <div className="box">
            <span className="label">Ferme in laboratorio da più di 2 giorni · {ferme.length}</span>
            {ferme.length === 0 ? <p className="muted" style={{ margin: 0 }}>Nessuna.</p> : (
              <ul className="src">{ferme.map((p) => <li key={p.id}><Link href={`/lab/pratica/${p.id}`} className="mono">{p.numero}</Link> · {p.centralina || p.mezzo} · <PillaFase p={p} /> · ferma dal {dataBreve(p.aggiornato_il)}</li>)}</ul>
            )}
          </div>
          <div className="box">
            <span className="label">Riparabili non pagate da più di 3 giorni · {nonPagate.length}</span>
            {nonPagate.length === 0 ? <p className="muted" style={{ margin: 0 }}>Nessuna.</p> : (
              <ul className="src">{nonPagate.map((p) => <li key={p.id}><Link href={`/lab/pratica/${p.id}`} className="mono">{p.numero}</Link> · {p.centralina || p.mezzo} · dal {dataBreve(p.aggiornato_il)}</li>)}</ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
