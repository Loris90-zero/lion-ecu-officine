import Link from "next/link";
import { richiediStaff } from "@/lib/sessione";
import { FASI, eur, dataBreve } from "@/lib/fasi";
import { PillaFase } from "@/components/Fasi";
import type { Pratica } from "@/lib/types";

type Riga = Pratica & { officine: { ragione_sociale: string; telefono: string; citta: string | null } | null };

export default async function Lab({ searchParams }: { searchParams: Promise<{ fase?: string; q?: string }> }) {
  const { sb } = await richiediStaff();
  const sp = await searchParams;
  const fase = sp.fase !== undefined && sp.fase !== "" ? Number(sp.fase) : null;
  let query = sb.from("pratiche").select("*, officine(ragione_sociale, telefono, citta)").order("creato_il", { ascending: false }).limit(200);
  if (fase !== null && fase >= 0 && fase <= 5) query = query.eq("fase", fase);
  if (sp.q) query = query.or(`numero.ilike.%${sp.q.replace(/[%,()]/g, "")}%,mezzo.ilike.%${sp.q.replace(/[%,()]/g, "")}%,codice_etichetta.ilike.%${sp.q.replace(/[%,()]/g, "")}%`);
  const { data } = await query;
  const righe = (data ?? []) as Riga[];
  const { data: tutte } = await sb.from("pratiche").select("fase, esito, pagato, prezzo_confermato_eur");
  const conta = (f: number) => (tutte ?? []).filter((x) => x.fase === f).length;
  const daPagare = (tutte ?? []).filter((x) => x.esito === "riparabile" && !x.pagato && x.prezzo_confermato_eur).length;

  return (
    <section className="screen">
      <div className="row" style={{ flexWrap: "wrap" }}>
        <h1>Pratiche</h1>
        <form method="get" style={{ flexDirection: "row", gap: 8 }}>
          {fase !== null ? <input type="hidden" name="fase" value={fase} /> : null}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Numero, mezzo o codice" style={{ width: 240 }} />
          <button className="btn btn-ghost btn-sm" type="submit">Cerca</button>
        </form>
      </div>
      <div className="filters">
        <Link href="/lab" aria-current={fase === null ? "true" : undefined}>Tutte</Link>
        {FASI.map((f, i) => <Link key={f} href={`/lab?fase=${i}`} aria-current={fase === i ? "true" : undefined}>{f} · {conta(i)}</Link>)}
      </div>
      {daPagare ? <p className="hint">{daPagare} {daPagare === 1 ? "pratica riparabile aspetta" : "pratiche riparabili aspettano"} il pagamento dell&apos;officina.</p> : null}
      <div className="tblw">
        <table className="tbl">
          <thead><tr><th>Pratica</th><th>Officina</th><th>Mezzo e centralina</th><th>Stato</th><th>Prezzo</th><th>Creata</th></tr></thead>
          <tbody>
            {righe.length === 0 ? <tr><td colSpan={6} className="muted">Nessuna pratica.</td></tr> : null}
            {righe.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/lab/pratica/${p.id}`} className="mono">{p.numero}</Link></td>
                <td>{p.officine?.ragione_sociale}<div className="hint">{p.officine?.citta} · {p.officine?.telefono}</div></td>
                <td>{p.mezzo}<div className="hint mono">{p.centralina || p.codice_etichetta || "—"}</div></td>
                <td><PillaFase p={p} />{p.pagato ? <div className="hint">Pagata</div> : null}</td>
                <td className="mono">{p.prezzo_confermato_eur ? eur(p.prezzo_confermato_eur) : p.prezzo_stimato_eur ? <span className="muted">stima {eur(p.prezzo_stimato_eur)}</span> : "—"}</td>
                <td className="mono hint">{dataBreve(p.creato_il)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
