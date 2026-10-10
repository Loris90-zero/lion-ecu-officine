import Link from "next/link";
import { richiediAdmin } from "@/lib/sessione";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dataBreve } from "@/lib/fasi";
import { creaDaRicerca } from "./azioni";
import { FormDaCodice, FormNuovaGuida } from "./Forms";
import { BASE } from "@/sito/config";

export default async function SitoLab() {
  const { sb } = await richiediAdmin();
  const [{ data: pag }, { data: art }, { data: cand }, { data: ric }] = await Promise.all([
    sb.from("pagine_centraline").select("slug, titolo, codice, stato, aggiornato_il").order("aggiornato_il", { ascending: false }),
    sb.from("articoli").select("slug, titolo, stato, aggiornato_il").order("aggiornato_il", { ascending: false }),
    sb.from("candidature").select("*").order("creato_il", { ascending: false }).limit(30),
    supabaseAdmin().from("ricerche").select("chiave, risultato, creato_il").not("chiave", "is", null).not("risultato", "is", null).order("creato_il", { ascending: false }).limit(200),
  ]);
  const pagine = (pag ?? []) as { slug: string; titolo: string; codice: string | null; stato: string; aggiornato_il: string }[];
  const giaUsate = new Set<string>();
  const { data: usate } = await sb.from("pagine_centraline").select("ricerca_chiave");
  for (const u of usate ?? []) if (u.ricerca_chiave) giaUsate.add(u.ricerca_chiave);
  const viste = new Set<string>();
  const proposte = (ric ?? []).filter((r) => {
    const x = r.risultato as { trovata?: boolean };
    if (!x?.trovata || giaUsate.has(r.chiave) || viste.has(r.chiave)) return false;
    viste.add(r.chiave); return true;
  }).slice(0, 30) as { chiave: string; risultato: { marca?: string; modello?: string; famiglia?: string }; creato_il: string }[];

  return (
    <section className="screen">
      <div className="row" style={{ flexWrap: "wrap" }}>
        <h1>Sito</h1>
        <a className="btn btn-ghost btn-sm" href={BASE || "/"} target="_blank" rel="noopener noreferrer">Apri il sito</a>
      </div>
      <div className="lab-grid">
        <div className="section" style={{ gap: 16 }}>
          <div className="box">
            <span className="label">Catalogo centraline · {pagine.length}</span>
            <table className="tbl"><tbody>
              {pagine.length === 0 ? <tr><td className="muted">Nessuna pagina ancora. Creale dalle ricerche fatte nell&apos;app o da un codice.</td></tr> : null}
              {pagine.map((p) => <tr key={p.slug}><td><Link href={`/lab/sito/centralina/${p.slug}`}><b>{p.titolo}</b></Link><div className="hint mono">{p.codice}</div></td><td>{p.stato === "pubblicata" ? "Pubblicata" : <span className="muted">Bozza</span>}</td><td className="hint">{dataBreve(p.aggiornato_il)}</td></tr>)}
            </tbody></table>
          </div>
          <div className="box">
            <span className="label">Guide · {(art ?? []).length}</span>
            <table className="tbl"><tbody>
              {(art ?? []).length === 0 ? <tr><td className="muted">Nessuna guida ancora.</td></tr> : null}
              {(art ?? []).map((a) => <tr key={a.slug}><td><Link href={`/lab/sito/guida/${a.slug}`}><b>{a.titolo}</b></Link></td><td>{a.stato === "pubblicata" ? "Pubblicata" : <span className="muted">Bozza</span>}</td><td className="hint">{dataBreve(a.aggiornato_il)}</td></tr>)}
            </tbody></table>
          </div>
          <div className="box">
            <span className="label">Candidature · {(cand ?? []).length}</span>
            {(cand ?? []).length === 0 ? <p className="muted" style={{ margin: 0 }}>Nessuna.</p> : (
              <ul className="src">{(cand ?? []).map((c) => <li key={c.id}><b>{c.nome}</b> · {c.ruolo} · <a href={`mailto:${c.email}`}>{c.email}</a>{c.telefono ? ` · ${c.telefono}` : ""} · {dataBreve(c.creato_il)}{c.messaggio ? <div className="hint">{c.messaggio}</div> : null}</li>)}</ul>
            )}
          </div>
        </div>
        <div className="section" style={{ gap: 16 }}>
          <div className="box">
            <span className="label">Nuova pagina da un codice</span>
            <p className="hint" style={{ margin: 0 }}>Usa la ricerca già fatta se c&apos;è, altrimenti la fa ora. Nasce come bozza: controlla prezzo e testi prima di pubblicare.</p>
            <FormDaCodice />
          </div>
          <div className="box">
            <span className="label">Dalle ricerche fatte nell&apos;app · {proposte.length}</span>
            {proposte.length === 0 ? <p className="muted" style={{ margin: 0 }}>Nessuna ricerca nuova da trasformare in pagina.</p> : (
              <table className="tbl"><tbody>
                {proposte.map((r) => (
                  <tr key={r.chiave}>
                    <td>{[r.risultato.marca, r.risultato.modello || r.risultato.famiglia].filter(Boolean).join(" ") || r.chiave}<div className="hint mono">{r.chiave}</div></td>
                    <td><form action={creaDaRicerca}><input type="hidden" name="chiave" value={r.chiave} /><button className="linkbtn" type="submit">Crea bozza</button></form></td>
                  </tr>
                ))}
              </tbody></table>
            )}
          </div>
          <div className="box">
            <span className="label">Nuova guida su un guasto</span>
            <p className="hint" style={{ margin: 0 }}>L&apos;AI scrive una bozza usando anche i casi riparati in laboratorio. Leggila sempre prima di pubblicarla.</p>
            <FormNuovaGuida centraline={pagine.map((p) => ({ slug: p.slug, titolo: p.titolo }))} />
          </div>
        </div>
      </div>
    </section>
  );
}
