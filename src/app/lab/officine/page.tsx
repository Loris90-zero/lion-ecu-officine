import Link from "next/link";
import { richiediStaff } from "@/lib/sessione";
import { dataBreve } from "@/lib/fasi";
import { livelliOfficine, livelloDa } from "@/lib/fedelta";
import { STATI_CRM, nomeStato } from "./stati";
import type { Officina } from "@/lib/types";
import { SOGLIA_CALDO } from "@/sito/score";

type Crm = { stato: string; note: string | null; prossimo_contatto: string | null } | null;
type Riga = Officina & { officine_crm: Crm };

const GIORNO = 86_400_000;

export default async function OfficineLab({ searchParams }: { searchParams: Promise<{ stato?: string; q?: string; ordina?: string }> }) {
  const { sb } = await richiediStaff();
  const sp = await searchParams;
  const { data } = await sb.from("officine").select("*, officine_crm(stato, note, prossimo_contatto)").order("creato_il", { ascending: false }).limit(1000);
  const { data: pr } = await sb.from("pratiche").select("officina_id, creato_il, fase, pagato");
  const { regole, livelli } = await livelliOfficine(sb);
  const oggi = new Date().toISOString().slice(0, 10);
  const { data: ld } = await sb.from("lead").select("*").is("officina_id", null).order("score", { ascending: false }).limit(100);
  const lead = (ld ?? []) as { id: number; nome_officina: string | null; nome: string | null; telefono: string | null; email: string | null; provincia: string | null; score: number; creato_il: string; origine: string | null; risposte: { profilo?: { riassunto?: string; leve?: string[] } } | null }[];

  const statsPer = new Map<string, { n: number; aperte: number; ultima: string | null }>();
  for (const p of pr ?? []) {
    const s = statsPer.get(p.officina_id) ?? { n: 0, aperte: 0, ultima: null };
    s.n++; if (p.fase < 4) s.aperte++;
    if (!s.ultima || p.creato_il > s.ultima) s.ultima = p.creato_il;
    statsPer.set(p.officina_id, s);
  }

  let righe = ((data ?? []) as Riga[]).map((o) => {
    const st = statsPer.get(o.id) ?? { n: 0, aperte: 0, ultima: null };
    const crm = o.officine_crm;
    const stato = crm?.stato ?? "nuova";
    const liv = livelli.get(o.id) ?? livelloDa(0, regole);
    const giorniFermo = st.ultima ? Math.floor((Date.now() - new Date(st.ultima).getTime()) / GIORNO) : null;
    // Chi chiamare: mai contattata, ricontatto scaduto, o cliente fermo da 60 giorni
    const motivo =
      crm?.prossimo_contatto && crm.prossimo_contatto <= oggi ? "Ricontatto previsto"
      : (o.score ?? 0) >= SOGLIA_CALDO && stato === "nuova" ? `Score alto (${o.score}): chiamala`
      : stato === "nuova" ? (st.n ? "Prima pratica: da conoscere" : "Mai contattata")
      : st.n && giorniFermo !== null && giorniFermo > 60 && stato !== "persa" ? `Nessuna pratica da ${giorniFermo} giorni`
      : null;
    return { o, st, stato, liv, motivo };
  });

  const q = (sp.q ?? "").trim().toLowerCase();
  if (q) righe = righe.filter(({ o }) => [o.ragione_sociale, o.referente, o.telefono, o.email, o.citta, o.partita_iva].some((x) => x?.toLowerCase().includes(q)));
  const conta = (s: string) => righe.filter((r) => r.stato === s).length;
  const daChiamare = righe.filter((r) => r.motivo).length;
  if (sp.stato === "chiamare") righe = righe.filter((r) => r.motivo);
  else if (sp.stato) righe = righe.filter((r) => r.stato === sp.stato);
  if (sp.ordina === "punti") righe.sort((a, b) => b.liv.punti - a.liv.punti);
  if (sp.ordina === "pratiche") righe.sort((a, b) => b.st.n - a.st.n);

  const link = (extra: Record<string, string | undefined>) => {
    const u = new URLSearchParams();
    const v = { stato: sp.stato, q: sp.q, ordina: sp.ordina, ...extra };
    for (const [k, x] of Object.entries(v)) if (x) u.set(k, x);
    const s = u.toString();
    return `/lab/officine${s ? `?${s}` : ""}`;
  };

  return (
    <section className="screen">
      <div className="row" style={{ flexWrap: "wrap" }}>
        <h1>Officine</h1>
        <form method="get" style={{ flexDirection: "row", gap: 8 }}>
          {sp.stato ? <input type="hidden" name="stato" value={sp.stato} /> : null}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Nome, telefono, città, P.IVA" style={{ width: 240 }} />
          <button className="btn btn-ghost btn-sm" type="submit">Cerca</button>
        </form>
      </div>
      <div className="filters">
        <Link href={link({ stato: undefined })} aria-current={!sp.stato ? "true" : undefined}>Tutte</Link>
        <Link href={link({ stato: "chiamare" })} aria-current={sp.stato === "chiamare" ? "true" : undefined}>Da chiamare · {daChiamare}</Link>
        {STATI_CRM.map((s) => <Link key={s.v} href={link({ stato: s.v })} aria-current={sp.stato === s.v ? "true" : undefined}>{s.nome} · {conta(s.v)}</Link>)}
      </div>
      <p className="hint">
        Ordina per: <Link href={link({ ordina: undefined })}>registrazione</Link> · <Link href={link({ ordina: "punti" })}>punti</Link> · <Link href={link({ ordina: "pratiche" })}>numero di pratiche</Link>
      </p>
      {lead.length ? (
        <div className="box">
          <span className="label">Dal quiz del sito, non ancora registrate · {lead.length}</span>
          <table className="tbl"><tbody>
            {lead.map((l) => (
              <tr key={l.id}>
                <td><b>{l.nome_officina ?? "Questionario completato"}</b><div className="hint">{l.nome ?? (l.nome_officina ? "" : "non ha ancora finito la registrazione")}{l.provincia ? ` · ${l.provincia}` : ""}{l.origine === "sito_partner" ? " · vuole diventare partner" : l.origine === "sito_flotta" ? " · flotta" : ""}</div>{l.risposte?.profilo?.riassunto ? <div className="hint" style={{ maxWidth: 420 }}>{l.risposte.profilo.riassunto}</div> : null}{l.risposte?.profilo?.leve?.length ? <div className="hint" style={{ maxWidth: 420 }}><b>Leve:</b> {l.risposte.profilo.leve.slice(0, 3).join(" · ")}</div> : null}</td>
                <td className="mono" style={{ fontSize: 13 }}>{l.telefono ? <a href={`tel:${l.telefono}`}>{l.telefono}</a> : "—"}<div className="hint">{l.email ?? "email in arrivo"}</div></td>
                <td>Score <b>{l.score}</b>{l.score >= SOGLIA_CALDO ? <div><span className="badge-chiama">Da chiamare</span></div> : null}</td>
                <td className="mono hint">{dataBreve(l.creato_il)}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
      ) : null}
      <div className="tblw">
        <table className="tbl">
          <thead><tr><th>Officina</th><th>Contatti</th><th>Stato</th><th>Livello</th><th>Pratiche</th><th>Registrata</th></tr></thead>
          <tbody>
            {righe.length === 0 ? <tr><td colSpan={6} className="muted">Nessuna officina.</td></tr> : null}
            {righe.map(({ o, st, stato, liv, motivo }) => (
              <tr key={o.id}>
                <td><Link href={`/lab/officine/${o.id}`}><b>{o.ragione_sociale}</b></Link><div className="hint">{o.referente}{o.citta ? ` · ${o.citta}` : ""}</div></td>
                <td className="mono" style={{ fontSize: 13 }}><a href={`tel:${o.telefono}`}>{o.telefono}</a>{o.email ? <div className="hint">{o.email}</div> : null}</td>
                <td>{nomeStato(stato)}{motivo ? <div><span className="badge-chiama">Da chiamare</span></div> : null}{motivo ? <div className="hint">{motivo}</div> : null}</td>
                <td>{liv.nome}<div className="hint mono">{liv.punti.toLocaleString("it-IT")} punti</div>{o.score !== null && o.score !== undefined ? <div className="hint">Score quiz <b>{o.score}</b></div> : null}</td>
                <td className="mono">{st.n}{st.aperte ? <div className="hint">{st.aperte} in corso</div> : null}{st.ultima ? <div className="hint">ultima {dataBreve(st.ultima)}</div> : null}</td>
                <td className="mono hint">{dataBreve(o.creato_il)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
