import Link from "next/link";
import { richiediTitolare } from "@/lib/sessione";
import { emailPronta, type Passo } from "@/lib/prospezione";
import { NOMI_TARGET } from "@/lib/marketing";
import { Modulo } from "../Modulo";
import { cercaProspect, aggiungiProspect, aggiornaProspect, avviaSequenzaPerTutti, creaSequenzaAI, salvaSequenza } from "../azioni";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type P = { id: number; nome: string; categoria: string; citta: string | null; provincia: string | null; telefono: string | null; email: string | null; sito: string | null; stato: string; passo: number; prossimo_invio: string | null; note: string | null; fonte_url: string | null; opposizione_verificata: boolean; sequenza_id: number | null };
type S = { id: number; nome: string; target: string; attiva: boolean; passi: Passo[] };
const STATI: Record<string, [string, string]> = {
  nuovo: ["Nuovo", ""], in_sequenza: ["In sequenza", "mk-pill-acc"], risposto: ["Ha risposto", "mk-pill-ok"], interessato: ["Interessato", "mk-pill-ok"],
  cliente: ["Cliente", "mk-pill-ok"], escluso: ["Escluso", "mk-pill-ko"], disiscritto: ["Disiscritto", "mk-pill-ko"],
};
const data = (iso: string) => new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", day: "numeric", month: "short" }).format(new Date(iso));

export default async function Prospezione({ searchParams }: { searchParams: Promise<{ stato?: string }> }) {
  const { sb } = await richiediTitolare();
  const filtro = (await searchParams).stato;
  let q = sb.from("prospect").select("*").order("creato_il", { ascending: false }).limit(200);
  if (filtro && STATI[filtro]) q = q.eq("stato", filtro);
  const [{ data: lista }, { data: seq }, { data: tutti }, { count: inviate }, { data: ric }] = await Promise.all([
    q,
    sb.from("sequenze").select("*").order("creato_il"),
    sb.from("prospect").select("stato, email"),
    sb.from("prospect_attivita").select("id", { count: "exact", head: true }).eq("tipo", "email_inviata"),
    sb.from("ricerche_prospect").select("zona, categoria, trovati, nuovi, creato_il").order("creato_il", { ascending: false }).limit(6),
  ]);
  const ps = (lista ?? []) as P[];
  const seqs = (seq ?? []) as S[];
  const tt = (tutti ?? []) as { stato: string; email: string | null }[];
  const conta = (s: string) => tt.filter((x) => x.stato === s).length;
  const attive = seqs.filter((s) => s.attiva);
  const pronta = emailPronta();

  return (
    <section className="mk-pagina">
      <header className="mk-testa">
        <div>
          <p className="mk-sopra">Prospezione AI</p>
          <h1 className="mk-h1">Trova officine nuove e contattale in automatico</h1>
          <p className="mk-sotto">L&apos;AI cerca online officine e aziende di trasporto di una zona, le mette in lista con i contatti pubblici, e le sequenze email le seguono passo passo finché non rispondono.</p>
        </div>
      </header>

      {!pronta ? <div className="mk-avviso"><b>Le email partono quando colleghiamo il servizio email (Resend).</b> Puoi già trovare officine, scrivere le sequenze e metterle in coda: appena è collegato, ogni mattina il sistema manda i passi in scadenza.</div> : null}

      <div className="mk-stats">
        <div><b>{tt.length}</b><small>in lista</small></div>
        <div><b>{tt.filter((x) => x.email).length}</b><small>con email</small></div>
        <div><b>{conta("in_sequenza")}</b><small>in sequenza</small></div>
        <div><b>{inviate ?? 0}</b><small>email inviate</small></div>
        <div><b>{conta("risposto") + conta("interessato")}</b><small>risposte</small></div>
        <div><b>{conta("cliente")}</b><small>diventati clienti</small></div>
      </div>

      <div className="mk-griglia2">
        <article className="mk-box">
          <div className="mk-box-testa"><h2>Cerca con l&apos;AI</h2></div>
          <Modulo azione={cercaProspect} pulsante="Cerca e aggiungi alla lista" attesa="Sto cercando online… (fino a un minuto)">
            <div className="mk-righe">
              <label>Zona<input name="zona" placeholder="es. Pescara, Chieti, Bari" required /></label>
              <label>Cosa cercare<select name="categoria" defaultValue="officine">
                <option value="officine">Officine mezzi pesanti</option>
                <option value="flotte">Aziende di trasporto e flotte</option>
                <option value="partner">Possibili officine partner</option>
              </select></label>
            </div>
          </Modulo>
          {(ric ?? []).length ? <p className="mk-piccolo">Ultime ricerche: {(ric ?? []).map((r) => `${r.zona} (${r.nuovi} nuove)`).join(" · ")}</p> : null}
        </article>

        <article className="mk-box">
          <div className="mk-box-testa"><h2>Aggiungi a mano</h2></div>
          <Modulo azione={aggiungiProspect} pulsante="Aggiungi" svuota>
            <div className="mk-righe">
              <label>Nome attività<input name="nome" required /></label>
              <label>Città<input name="citta" /></label>
            </div>
            <div className="mk-righe">
              <label>Email<input name="email" type="email" /></label>
              <label>Telefono<input name="telefono" /></label>
              <label>Tipo<select name="categoria"><option value="officine">Officina</option><option value="flotte">Flotta</option><option value="partner">Partner</option></select></label>
            </div>
          </Modulo>
        </article>
      </div>

      <article className="mk-box">
        <div className="mk-box-testa"><h2>Sequenze email</h2><span className="mk-piccolo">Si fermano da sole quando il contatto risponde, si disiscrive o lo escludi</span></div>
        {seqs.length === 0 ? <p className="mk-vuoto">Nessuna sequenza. Fanne scrivere una all&apos;AI qui sotto, poi rileggila e attivala.</p> : (
          <ul className="mk-lista">
            {seqs.map((s) => (
              <li key={s.id}>
                <details>
                  <summary><span className="mk-riga" style={{ display: "inline-flex", gap: 10 }}><b>{s.nome}</b><span className="mk-pill">{NOMI_TARGET[s.target] ?? s.target}</span><span className={`mk-pill ${s.attiva ? "mk-pill-ok" : ""}`}>{s.attiva ? "Attiva" : "Ferma"}</span><span className="mk-piccolo">{s.passi.length} email</span></span></summary>
                  <Modulo azione={salvaSequenza} pulsante="Salva la sequenza" className="mk-form" >
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="n" value={s.passi.length + 1} />
                    <div className="mk-righe" style={{ marginTop: 12 }}>
                      <label>Nome<input name="nome" defaultValue={s.nome} /></label>
                      <label className="mk-canali" style={{ alignSelf: "end" }}><span style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="checkbox" name="attiva" defaultChecked={s.attiva} style={{ width: "auto" }} />Attiva</span></label>
                    </div>
                    {[...s.passi, { giorno: (s.passi.at(-1)?.giorno ?? 0) + 7, canale: "email", oggetto: "", testo: "" } as Passo].map((p, i) => (
                      <div key={i} className="mk-passo">
                        <span className="mk-lab">{i < s.passi.length ? `Email ${i + 1}` : "Aggiungi un'altra email (facoltativo)"}</span>
                        <div className="mk-righe">
                          <label>Giorno<input name={`giorno_${i}`} defaultValue={p.giorno} inputMode="numeric" /></label>
                          <label style={{ gridColumn: "span 2" }}>Oggetto<input name={`oggetto_${i}`} defaultValue={p.oggetto} /></label>
                        </div>
                        <label>Testo ({"{nome}"} e {"{citta}"} diventano i dati dell&apos;officina)<textarea name={`testo_${i}`} defaultValue={p.testo} /></label>
                      </div>
                    ))}
                  </Modulo>
                </details>
              </li>
            ))}
          </ul>
        )}
        <details>
          <summary>Scrivi una nuova sequenza con l&apos;AI</summary>
          <Modulo azione={creaSequenzaAI} pulsante="Scrivi la bozza" attesa="Sto scrivendo…">
            <div className="mk-righe" style={{ marginTop: 12 }}>
              <label>Nome<input name="nome" placeholder="Officine Abruzzo autunno" /></label>
              <label>Per chi<select name="target"><option value="officine">Officine</option><option value="flotte">Flotte e trasporti</option><option value="partner">Partner</option></select></label>
            </div>
            <label>Cosa vuoi spingere (facoltativo)<input name="idea" placeholder="es. puntare sulla garanzia a vita e sul ritiro gratis" /></label>
          </Modulo>
        </details>
      </article>

      <article className="mk-box">
        <div className="mk-box-testa">
          <h2>Contatti</h2>
          <nav className="mk-periodi" aria-label="Filtra">
            <Link href="/admin/marketing/prospezione" aria-current={!filtro ? "true" : undefined}>Tutti</Link>
            {Object.entries(STATI).map(([k, [n]]) => <Link key={k} href={`/admin/marketing/prospezione?stato=${k}`} aria-current={filtro === k ? "true" : undefined}>{n}</Link>)}
          </nav>
        </div>
        {attive.length && conta("nuovo") ? (
          <form action={avviaSequenzaPerTutti} className="mk-riga" style={{ justifyContent: "flex-start" }}>
            <span className="mk-piccolo">Metti tutti i nuovi con email in</span>
            <select name="sequenza_id" style={{ width: "auto" }}>{attive.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select>
            <select name="categoria" style={{ width: "auto" }} defaultValue=""><option value="">tutti i tipi</option><option value="officine">solo officine</option><option value="flotte">solo flotte</option><option value="partner">solo partner</option></select>
            <button className="mk-btn mk-btn-pic">Avvia</button>
          </form>
        ) : null}
        {ps.length === 0 ? <p className="mk-vuoto">Nessun contatto. Inizia da una ricerca con l&apos;AI.</p> : (
          <ul className="mk-lista">
            {ps.map((p) => (
              <li key={p.id}>
                <div className="mk-riga">
                  <span><b>{p.nome}</b> <span className="mk-piccolo">{[p.citta, p.provincia].filter(Boolean).join(" ")}</span></span>
                  <span className={`mk-pill ${STATI[p.stato]?.[1] ?? ""}`}>{STATI[p.stato]?.[0] ?? p.stato}{p.stato === "in_sequenza" ? ` · email ${p.passo + 1}${p.prossimo_invio ? ` il ${data(p.prossimo_invio)}` : ""}` : ""}</span>
                </div>
                <div className="mk-piccolo" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  {p.email ? <a href={`mailto:${p.email}`}>{p.email}</a> : <span>senza email</span>}
                  {p.telefono ? <a href={`tel:${p.telefono}`}>{p.telefono}</a> : null}
                  {p.sito ? <a href={p.sito.startsWith("http") ? p.sito : `https://${p.sito}`} target="_blank" rel="noopener noreferrer">sito</a> : null}
                  {p.fonte_url ? <a href={p.fonte_url} target="_blank" rel="noopener noreferrer">dove l&apos;ho trovato</a> : null}
                  {p.telefono ? <span>{p.opposizione_verificata ? "✓ controllato nel Registro Opposizioni" : "numero da controllare nel Registro Opposizioni"}</span> : null}
                </div>
                {p.note ? <p className="mk-piccolo" style={{ color: "var(--mk-ink)" }}>{p.note}</p> : null}
                {!["cliente", "disiscritto"].includes(p.stato) ? (
                  <form action={aggiornaProspect} className="mk-riga" style={{ justifyContent: "flex-start", gap: 6 }}>
                    <input type="hidden" name="id" value={p.id} />
                    {p.email && attive.length && ["nuovo", "risposto"].includes(p.stato) ? (
                      <>
                        <select name="sequenza_id" style={{ width: "auto", padding: "6px 8px", fontSize: 13 }}>{attive.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select>
                        <button className="mk-btn mk-btn-pic" name="azione" value="sequenza">Avvia sequenza</button>
                      </>
                    ) : null}
                    {p.stato !== "risposto" ? <button className="mk-btn mk-btn-2 mk-btn-pic" name="azione" value="risposto">Ha risposto</button> : null}
                    {p.stato !== "interessato" ? <button className="mk-btn mk-btn-2 mk-btn-pic" name="azione" value="interessato">Interessato</button> : null}
                    {p.telefono && !p.opposizione_verificata ? <button className="mk-btn mk-btn-2 mk-btn-pic" name="azione" value="opposizioni">Numero controllato</button> : null}
                    {p.stato !== "escluso" ? <button className="mk-btn mk-btn-2 mk-btn-pic" name="azione" value="escluso">Escludi</button> : <button className="mk-btn mk-btn-2 mk-btn-pic" name="azione" value="nuovo">Rimetti in lista</button>}
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </article>

      <p className="mk-legale"><b>Da verificare prima di accendere gli invii.</b> In Italia le email commerciali e le chiamate automatiche, anche verso le aziende, hanno regole precise sul consenso (Codice Privacy, art. 130, e GDPR). Le chiamate ai numeri iscritti al Registro Pubblico delle Opposizioni non sono permesse. Il sistema usa solo contatti pubblicati dalle aziende stesse, mette in ogni email chi siamo e il link per disiscriversi, e si ferma da solo a chi lo chiede. Prima di avviare le sequenze conviene un controllo con il consulente privacy o l&apos;avvocato. Non sono un avvocato: questa è un&apos;indicazione, non un parere legale.</p>
    </section>
  );
}
