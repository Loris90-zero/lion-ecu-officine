import { richiediAdmin } from "@/lib/sessione";
import { eur, dataLunga } from "@/lib/fasi";
import { aggiungiPrezzo, aggiornaPrezzo, cambiaAttivo, aggiungiFonte, cambiaFonte } from "./azioni";

type Riga = { id: number; codici: string[]; descrizione: string | null; prezzo_eur: number; valuta: string; prezzo_originale: number | null; fonte_nome: string | null; fonte_url: string | null; origine: string; attivo: boolean; aggiornato_il: string };
type Fonte = { dominio: string; categoria: string; nota: string | null; attivo: boolean };

export const metadata = { title: "Prezzi di riferimento — Lion ECU" };

export default async function Prezzi({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { sb } = await richiediAdmin();
  const { q } = await searchParams;
  let query = sb.from("prezzi_riferimento").select("*").order("aggiornato_il", { ascending: false }).limit(200);
  const cod = (q ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cod) query = query.contains("codici", [cod]);
  const { data } = await query;
  const righe = (data ?? []) as Riga[];
  const { data: f } = await sb.from("fonti_preferite").select("*").order("categoria");
  const fonti = (f ?? []) as Fonte[];

  return (
    <section className="screen">
      <div className="section">
        <h1>Prezzi di riferimento</h1>
        <p className="muted" style={{ maxWidth: 720 }}>Il prezzo del nuovo originale per codice. La ricerca salva qui da sola i prezzi credibili che trova online. Quelli inseriti o corretti da voi hanno la precedenza e vengono usati subito come base del prezzo di riparazione.</p>
      </div>

      <div className="lab-grid">
        <div className="section" style={{ gap: 12 }}>
          <form method="get" style={{ flexDirection: "row", gap: 8 }}>
            <input name="q" defaultValue={q ?? ""} placeholder="Cerca un codice, es. 0281020459" />
            <button className="btn btn-ghost btn-sm" type="submit">Cerca</button>
          </form>
          <div className="tblw">
            <table className="tbl">
              <thead><tr><th>Codici</th><th>Prezzo nuovo</th><th>Fonte</th><th>Stato</th></tr></thead>
              <tbody>
                {righe.length === 0 ? <tr><td colSpan={4} className="muted">Nessun prezzo{cod ? " per questo codice" : ""}. Si riempie da solo con le ricerche, oppure aggiungilo a destra.</td></tr> : null}
                {righe.map((r) => (
                  <tr key={r.id} style={{ opacity: r.attivo ? 1 : 0.5 }}>
                    <td><div className="mono" style={{ fontSize: 12 }}>{r.codici.slice(0, 4).join(" · ")}{r.codici.length > 4 ? " …" : ""}</div><div className="hint">{r.descrizione}</div></td>
                    <td>
                      <form action={aggiornaPrezzo} style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                        <input type="hidden" name="id" value={r.id} />
                        <input name="prezzo" defaultValue={Math.round(r.prezzo_eur)} inputMode="decimal" className="mono" style={{ width: 90, padding: "6px 8px" }} aria-label="Prezzo in euro" />
                        <button className="btn btn-ghost btn-sm" type="submit">Salva</button>
                      </form>
                      {r.valuta !== "EUR" && r.prezzo_originale ? <div className="hint">{r.prezzo_originale} {r.valuta}</div> : null}
                    </td>
                    <td>
                      <span className={`pill ${r.origine === "laboratorio" ? "p-ok" : "p-info"}`}>{r.origine === "laboratorio" ? "Laboratorio" : "Ricerca"}</span>
                      <div className="hint">{r.fonte_url ? <a href={r.fonte_url} target="_blank" rel="noopener noreferrer">{r.fonte_nome || r.fonte_url}</a> : r.fonte_nome} · {dataLunga(r.aggiornato_il)}</div>
                    </td>
                    <td>
                      <form action={cambiaAttivo}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="attivo" value={r.attivo ? "0" : "1"} />
                        <button className="linkbtn" type="submit">{r.attivo ? "Escludi" : "Riattiva"}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint">Correggere un prezzo lo rende &quot;Laboratorio&quot;: da quel momento vale per quel codice al posto di quelli trovati online. &quot;Escludi&quot; toglie un prezzo sbagliato dal calcolo.</p>
        </div>

        <div className="section" style={{ gap: 16 }}>
          <div className="box">
            <h2>Aggiungi un prezzo</h2>
            <form action={aggiungiPrezzo}>
              <div className="field"><label htmlFor="codici">Codici (separati da virgola)</label><input id="codici" name="codici" className="mono" placeholder="0281020459, 5802061525" required /></div>
              <div className="field"><label htmlFor="descrizione">Descrizione</label><input id="descrizione" name="descrizione" placeholder="Bosch EDC17CV41 Iveco Stralis Cursor 9" /></div>
              <div className="grid2">
                <div className="field"><label htmlFor="prezzo">Prezzo nuovo originale (€)</label><input id="prezzo" name="prezzo" inputMode="decimal" className="mono" required /></div>
                <div className="field"><label htmlFor="fonte">Fonte</label><input id="fonte" name="fonte" placeholder="Concessionario, listino…" /></div>
              </div>
              <button className="btn btn-primary" type="submit">Aggiungi</button>
            </form>
          </div>

          <div className="box">
            <h2>Negozi consultati per primi</h2>
            <p className="hint">La ricerca guarda prima questi siti per il prezzo del nuovo originale, scegliendo quelli adatti al tipo di mezzo.</p>
            <ul className="src">
              {fonti.map((x) => (
                <li key={x.dominio} style={{ display: "flex", justifyContent: "space-between", gap: 8, opacity: x.attivo ? 1 : 0.5 }}>
                  <span><b>{x.dominio}</b> <span className="hint">· {x.categoria}{x.nota ? ` · ${x.nota}` : ""}</span></span>
                  <form action={cambiaFonte}>
                    <input type="hidden" name="dominio" value={x.dominio} />
                    <input type="hidden" name="attivo" value={x.attivo ? "0" : "1"} />
                    <button className="linkbtn" type="submit">{x.attivo ? "Disattiva" : "Attiva"}</button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={aggiungiFonte}>
              <div className="grid2">
                <div className="field"><label htmlFor="dominio">Sito</label><input id="dominio" name="dominio" placeholder="negozioricambi.it" required /></div>
                <div className="field"><label htmlFor="categoria">Tipo di mezzo</label>
                  <select id="categoria" name="categoria"><option>Camion e bus</option><option>Movimento terra e industriali</option><option>Gru</option><option>Barche</option><option>Macchine agricole</option></select>
                </div>
              </div>
              <div className="field"><label htmlFor="nota">Nota</label><input id="nota" name="nota" /></div>
              <button className="btn btn-ghost" type="submit">Aggiungi sito</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
