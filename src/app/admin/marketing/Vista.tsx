import Link from "next/link";
import { PERIODI_MK, NOMI_TARGET, calcolaMk, serieMk, nomeSorgente, quota, type Riga, type Periodo, type DatiMk } from "@/lib/marketing";
import type { Connettore } from "@/lib/connettori";
import { Numero } from "./Numero";
import { Andamento, Ciambella, Imbuto, Sparkline } from "./Grafici";


const eur = (v: number | null) => (v === null ? "—" : `${Math.round(v).toLocaleString("it-IT")} €`);

function Delta({ ora, prima, meglioGiu = false }: { ora: number | null; prima: number | null; meglioGiu?: boolean }) {
  if (ora === null || prima === null || prima === 0) return <span className="mk-delta mk-d-nd">nessun confronto</span>;
  const d = ((ora - prima) / prima) * 100;
  if (Math.abs(d) < 0.5) return <span className="mk-delta">= periodo prima</span>;
  const buono = meglioGiu ? d < 0 : d > 0;
  return <span className={`mk-delta ${buono ? "mk-d-su" : "mk-d-giu"}`}>{d > 0 ? "▲" : "▼"} {Math.abs(Math.round(d))}% vs periodo prima</span>;
}

export function Vista({ per, dati, conn }: { per: Periodo; dati: DatiMk; conn: Connettore[] }) {
  const ora = calcolaMk(dati, per.da, per.a);
  const prima = calcolaMk(dati, per.prima.da, per.prima.a);
  const serie = serieMk(dati, per.giorni);
  const t = ora.tot, tp = prima.tot;
  const cpl = quota(t.spesa, t.lead), cplP = quota(tp.spesa, tp.lead);
  const cpr = quota(t.spesa, t.ritiri), cprP = quota(tp.spesa, tp.ritiri);
  const adsCollegate = conn.filter((c) => ["meta", "google", "tiktok"].includes(c.id) && c.stato === "collegato").length;
  const daApp = t.lead - ora.flotteForm;

  const kpi = [
    { k: "cpl", nome: "Costo per contatto", v: cpl, euro: true, dec: 2, prima: cplP, giu: true, spark: serie.map((s) => (s.lead ? s.spesa / s.lead : 0)), forte: true, nota: t.spesa ? `${eur(t.spesa)} / ${t.lead} contatti` : "serve la spesa ads" },
    { k: "spesa", nome: "Spesa ads", v: t.spesa, euro: true, dec: 0, prima: tp.spesa, giu: false, spark: serie.map((s) => s.spesa), nota: t.click ? `${t.click.toLocaleString("it-IT")} click` : "" },
    { k: "lead", nome: "Contatti", v: t.lead, prima: tp.lead, spark: serie.map((s) => s.lead), nota: `${ora.preventivi} preventivi dal sito` },
    { k: "app", nome: "App installate", v: t.app, prima: tp.app, spark: serie.map((s) => s.app), nota: `${t.registrati} nuovi registrati` },
    { k: "ritiri", nome: "Primi ritiri prenotati", v: t.ritiri, prima: tp.ritiri, spark: serie.map((s) => s.ritiri), nota: "clienti nuovi che hanno spedito" },
    { k: "cpr", nome: "Costo per ritiro", v: cpr, euro: true, dec: 0, prima: cprP, giu: true, spark: serie.map((s) => (s.ritiri ? s.spesa / s.ritiri : 0)), nota: "quanto costa un cliente vero" },
  ];

  const righeS = [...ora.perS.entries()].sort((a, b) => b[1].lead + b[1].spesa / 50 + b[1].visite / 20 - (a[1].lead + a[1].spesa / 50 + a[1].visite / 20));
  const maxS = Math.max(1, ...righeS.map(([, r]) => r.lead));
  const righeT = ["officine", "flotte", "partner", "altro", "tutti"].map((k) => [k, ora.perT.get(k)] as [string, Riga | undefined]).filter(([, r]) => r && (r.lead || r.spesa || r.ritiri));

  return (
    <section className="mk-pagina">
      <header className="mk-testa">
        <div>
          <p className="mk-sopra">Marketing · {per.nome}</p>
          <h1 className="mk-h1">{t.lead ? <>Hai ricevuto <em>{t.lead}</em> {t.lead === 1 ? "contatto" : "contatti"}{t.spesa ? <> a <em>{eur(cpl)}</em> l&apos;uno</> : null}.</> : <>Ancora nessun contatto in questo periodo.</>}</h1>
          <p className="mk-sotto">{t.ritiri ? `${t.ritiri} ${t.ritiri === 1 ? "officina nuova ha" : "officine nuove hanno"} già prenotato un ritiro. ` : ""}{t.whatsapp > daApp ? "Ti scrivono più su WhatsApp che dall'app." : t.lead || t.whatsapp ? "Arrivano più contatti dall'app e dal sito che da WhatsApp." : "I dati partono da oggi: ogni visita, WhatsApp e registrazione viene contata."}</p>
        </div>
        <nav className="mk-periodi" aria-label="Periodo">
          {PERIODI_MK.map(([k, n]) => <Link key={k} href={k === "7" ? "/admin/marketing" : `/admin/marketing?p=${k}`} aria-current={per.chiave === k ? "true" : undefined}>{n}</Link>)}
        </nav>
      </header>

      {adsCollegate === 0 ? (
        <div className="mk-avviso">
          <b>Le ads non sono ancora collegate.</b> Contatti, WhatsApp, app e ritiri si contano già da soli. Il costo per contatto si accende quando arriva la spesa: in automatico dai connettori, oppure <Link href="/admin/marketing/ads">inserita a mano</Link>.
        </div>
      ) : null}

      <div className="mk-kpi">
        {kpi.map((x, i) => (
          <article key={x.k} className={`mk-card${x.forte ? " mk-forte" : ""}`} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="mk-lab">{x.nome}</span>
            <b className="mk-val"><Numero v={x.v} euro={x.euro} dec={x.v !== null && x.dec && x.v < 100 ? x.dec : 0} /></b>
            <Delta ora={x.v} prima={x.prima} meglioGiu={x.giu} />
            <Sparkline valori={x.spark} colore={x.forte ? "#141414" : undefined} />
            {x.nota ? <small className="mk-nota">{x.nota}</small> : null}
          </article>
        ))}
      </div>

      <div className="mk-griglia2">
        <article className="mk-box mk-largo">
          <div className="mk-box-testa">
            <h2>Andamento giorno per giorno</h2>
            <ul className="mk-legenda"><li><i className="mk-c-lead" />Contatti</li><li><i className="mk-c-wa" />WhatsApp</li><li><i className="mk-c-spesa" />Spesa ads</li></ul>
          </div>
          <Andamento serie={serie} />
        </article>

        <article className="mk-box">
          <div className="mk-box-testa"><h2>Come ti contattano</h2></div>
          <Ciambella parti={[
            { nome: "WhatsApp", v: t.whatsapp, colore: "#25d366" },
            { nome: "App e sito", v: daApp, colore: "#ebb513" },
            { nome: "Modulo flotte", v: ora.flotteForm, colore: "#7aa7ff" },
          ]} />
          <p className="mk-piccolo">WhatsApp conta i click sul pulsante. Quando colleghiamo WhatsApp Business conterà i messaggi veri ricevuti.</p>
        </article>

        <article className="mk-box">
          <div className="mk-box-testa"><h2>Dalla visita al ritiro</h2></div>
          <Imbuto passi={[
            { nome: "Visite al sito", v: t.visite },
            { nome: "Preventivi calcolati", v: ora.preventivi },
            { nome: "Contatti", v: t.lead },
            { nome: "Registrati nell'app", v: t.registrati },
            { nome: "App installata", v: t.app },
            { nome: "Primo ritiro", v: t.ritiri },
          ]} />
        </article>
      </div>

      <article className="mk-box">
        <div className="mk-box-testa"><h2>Da dove arrivano</h2><span className="mk-piccolo">Ultimo canale che li ha portati da noi</span></div>
        {righeS.length === 0 ? <p className="mk-vuoto">Nessun dato ancora. Appena entra la prima visita la vedi qui.</p> : (
          <div className="mk-tab-w">
            <table className="mk-tab">
              <thead><tr><th>Sorgente</th><th>Visite</th><th>WhatsApp</th><th>Contatti</th><th>App</th><th>Ritiri</th><th>Spesa</th><th>€ / contatto</th></tr></thead>
              <tbody>
                {righeS.map(([k, r]) => (
                  <tr key={k}>
                    <td><span className={`mk-sorg mk-s-${k}`}>{nomeSorgente(k)}</span><div className="mk-barra"><i style={{ width: `${(r.lead / maxS) * 100}%` }} /></div></td>
                    <td>{r.visite}</td><td>{r.whatsapp}</td><td><b>{r.lead}</b></td><td>{r.app}</td><td><b>{r.ritiri}</b></td>
                    <td>{r.spesa ? eur(r.spesa) : "—"}</td><td>{eur(quota(r.spesa, r.lead))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="mk-box">
        <div className="mk-box-testa"><h2>Costo per target</h2><span className="mk-piccolo">Il target viene dal nome della campagna o dalle risposte del questionario</span></div>
        {righeT.length === 0 ? <p className="mk-vuoto">Nessun contatto o spesa nel periodo.</p> : (
          <div className="mk-target">
            {righeT.map(([k, r]) => (
              <div key={k} className="mk-t">
                <span className="mk-lab">{NOMI_TARGET[k] ?? k}</span>
                <div className="mk-t-num">
                  <div><b>{eur(quota(r!.spesa, r!.lead))}</b><small>per contatto</small></div>
                  <div><b>{eur(quota(r!.spesa, r!.ritiri))}</b><small>per ritiro</small></div>
                </div>
                <p className="mk-piccolo">{eur(r!.spesa)} spesi · {r!.lead} contatti · {r!.app} app · {r!.ritiri} ritiri</p>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="mk-box">
        <div className="mk-box-testa"><h2>Collegamenti</h2><Link href="/admin/marketing/connettori" className="mk-link">Vedi tutti →</Link></div>
        <ul className="mk-conn-mini">
          {conn.map((c) => <li key={c.id} className={c.stato === "collegato" ? "mk-ok" : ""}><i />{c.nome}</li>)}
        </ul>
        <p className="mk-piccolo">Ogni mattina alle 8 ti arriva sul telefono il riepilogo di ieri: contatti, costo per contatto, app installate e ritiri.</p>
      </article>
    </section>
  );
}
