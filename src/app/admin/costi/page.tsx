import { richiediTitolare } from "@/lib/sessione";
import { CATEGORIE } from "@/lib/finanza";
import { eliminaVoce } from "../azioni";
import { FormRicorrente, FormCosto, FormBene } from "./Forms";

const e = (v: number) => Math.round(v).toLocaleString("it-IT") + " €";
const Elimina = ({ t, id, testo = "Elimina" }: { t: string; id: number; testo?: string }) => (
  <form action={eliminaVoce} style={{ display: "inline" }}><input type="hidden" name="tabella" value={t} /><input type="hidden" name="id" value={id} /><button className="linkbtn" type="submit">{testo}</button></form>
);

export default async function Costi() {
  const { sb } = await richiediTitolare();
  const [{ data: r }, { data: c }, { data: b }] = await Promise.all([
    sb.from("costi_ricorrenti").select("*").eq("attivo", true).order("categoria"),
    sb.from("costi").select("*").order("data", { ascending: false }).limit(100),
    sb.from("beni_ammortizzabili").select("*").order("acquistato_il", { ascending: false }),
  ]);
  type R = { id: number; nome: string; categoria: string; importo_mensile: number; iva: number; dal: string };
  type C = { id: number; descrizione: string; categoria: string; importo: number; data: string };
  type B = { id: number; nome: string; costo: number; anni: number; acquistato_il: string };
  const ric = (r ?? []) as R[], cos = (c ?? []) as C[], ben = (b ?? []) as B[];
  const totMese = ric.reduce((s, x) => s + Number(x.importo_mensile), 0) + ben.reduce((s, x) => s + Number(x.costo) / (Number(x.anni) * 12), 0);
  return (
    <section className="screen">
      <h1>Costi</h1>
      <p className="muted">Corriere e materiali per pratica si calcolano da soli (in Parametri). Qui inserisci il resto: una volta i costi fissi, ogni tanto le spese occasionali. Costi fissi + ammortamenti: <b>{e(totMese)} al mese</b>, cioè <b>{e(totMese / 30)} al giorno</b>.</p>
      <div className="lab-grid">
        <div className="section" style={{ gap: 16 }}>
          <div className="box">
            <span className="label">Costi fissi mensili · {ric.length}</span>
            <table className="tbl"><tbody>
              {ric.length === 0 ? <tr><td className="muted">Nessuno ancora: aggiungi operai, affitto, commercialista, software…</td></tr> : null}
              {ric.map((x) => <tr key={x.id}><td>{x.nome}<div className="hint">{CATEGORIE[x.categoria]} · dal {x.dal.slice(0, 7)}</div></td><td className="mono" style={{ textAlign: "right" }}>{e(x.importo_mensile)}/mese</td><td><Elimina t="costi_ricorrenti" id={x.id} testo="Termina" /></td></tr>)}
            </tbody></table>
          </div>
          <div className="box">
            <span className="label">Attrezzature in ammortamento · {ben.length}</span>
            <table className="tbl"><tbody>
              {ben.length === 0 ? <tr><td className="muted">Nessuna: aggiungi banchi prova, strumenti, computer…</td></tr> : null}
              {ben.map((x) => <tr key={x.id}><td>{x.nome}<div className="hint">{e(x.costo)} in {x.anni} anni · dal {x.acquistato_il}</div></td><td className="mono" style={{ textAlign: "right" }}>{e(Number(x.costo) / (Number(x.anni) * 12))}/mese</td><td><Elimina t="beni_ammortizzabili" id={x.id} /></td></tr>)}
            </tbody></table>
          </div>
          <div className="box">
            <span className="label">Spese occasionali (ultime 100)</span>
            <table className="tbl"><tbody>
              {cos.length === 0 ? <tr><td className="muted">Nessuna spesa occasionale.</td></tr> : null}
              {cos.map((x) => <tr key={x.id}><td>{x.descrizione}<div className="hint">{CATEGORIE[x.categoria]} · {x.data}</div></td><td className="mono" style={{ textAlign: "right" }}>{e(x.importo)}</td><td><Elimina t="costi" id={x.id} /></td></tr>)}
            </tbody></table>
          </div>
        </div>
        <div className="section" style={{ gap: 16 }}>
          <div className="box"><span className="label">Nuovo costo fisso mensile</span><FormRicorrente /></div>
          <div className="box"><span className="label">Nuova spesa occasionale</span><FormCosto /></div>
          <div className="box"><span className="label">Nuova attrezzatura da ammortizzare</span><FormBene /></div>
        </div>
      </div>
    </section>
  );
}
