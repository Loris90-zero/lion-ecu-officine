import { richiediTitolare } from "@/lib/sessione";
import { NOMI_TARGET } from "@/lib/marketing";
import { Modulo } from "../Modulo";
import { salvaSpesa, eliminaSpesa } from "../azioni";

export const dynamic = "force-dynamic";
const eur = (v: number) => `${Math.round(v).toLocaleString("it-IT")} €`;
const PIATT: Record<string, string> = { meta: "Meta (Facebook e Instagram)", google: "Google Ads", tiktok: "TikTok", linkedin: "LinkedIn", altro: "Altro" };

export default async function Ads() {
  const { sb } = await richiediTitolare();
  const da = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
  const { data } = await sb.from("marketing_spesa").select("*").gte("giorno", da).order("giorno", { ascending: false }).limit(300);
  const righe = (data ?? []) as { id: number; giorno: string; piattaforma: string; campagna: string; target: string; spesa_eur: number; click: number | null; impression: number | null; fonte: string }[];
  const campagne = new Map<string, { piattaforma: string; target: string; spesa: number; click: number; giorni: number; fonte: string }>();
  for (const r of righe) {
    const k = `${r.piattaforma}|${r.campagna || "—"}`;
    const c = campagne.get(k) ?? { piattaforma: r.piattaforma, target: r.target, spesa: 0, click: 0, giorni: 0, fonte: r.fonte };
    c.spesa += Number(r.spesa_eur); c.click += r.click ?? 0; c.giorni++;
    campagne.set(k, c);
  }
  const oggi = new Date().toISOString().slice(0, 10);

  return (
    <section className="mk-pagina">
      <header className="mk-testa">
        <div>
          <p className="mk-sopra">Ads e spesa</p>
          <h1 className="mk-h1">Le campagne e quanto costano</h1>
          <p className="mk-sotto">Quando colleghiamo Meta, Google e TikTok la spesa di ogni campagna arriva qui da sola ogni mattina. Nel frattempo puoi inserirla a mano.</p>
        </div>
      </header>

      <article className="mk-box">
        <div className="mk-box-testa"><h2>Campagne degli ultimi 60 giorni</h2></div>
        {campagne.size === 0 ? <p className="mk-vuoto">Nessuna campagna ancora. Il nome della campagna dice anche il target: se contiene «flotte» o «partner» i contatti vengono contati lì.</p> : (
          <div className="mk-tab-w">
            <table className="mk-tab">
              <thead><tr><th>Campagna</th><th>Piattaforma</th><th>Target</th><th>Giorni</th><th>Click</th><th>Spesa</th><th>Da</th></tr></thead>
              <tbody>
                {[...campagne.entries()].sort((a, b) => b[1].spesa - a[1].spesa).map(([k, c]) => (
                  <tr key={k}><td><b>{k.split("|")[1]}</b></td><td>{PIATT[c.piattaforma] ?? c.piattaforma}</td><td>{NOMI_TARGET[c.target] ?? c.target}</td><td>{c.giorni}</td><td>{c.click || "—"}</td><td><b>{eur(c.spesa)}</b></td><td><span className={`mk-pill ${c.fonte === "manuale" ? "" : "mk-pill-ok"}`}>{c.fonte === "manuale" ? "a mano" : c.fonte}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <div className="mk-griglia2">
        <article className="mk-box">
          <div className="mk-box-testa"><h2>Inserisci la spesa di un giorno</h2></div>
          <Modulo azione={salvaSpesa} pulsante="Salva la spesa">
            <div className="mk-righe">
              <label>Giorno<input type="date" name="giorno" defaultValue={oggi} required /></label>
              <label>Piattaforma<select name="piattaforma" defaultValue="meta">{Object.entries(PIATT).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
              <label>Target<select name="target" defaultValue="officine">{["officine", "flotte", "partner", "tutti"].map((k) => <option key={k} value={k}>{NOMI_TARGET[k]}</option>)}</select></label>
            </div>
            <label>Nome della campagna<input name="campagna" placeholder="es. officine-abruzzo-ottobre" /></label>
            <div className="mk-righe">
              <label>Spesa (€)<input name="spesa" inputMode="decimal" placeholder="25" required /></label>
              <label>Click<input name="click" inputMode="numeric" /></label>
              <label>Impression<input name="impression" inputMode="numeric" /></label>
            </div>
          </Modulo>
        </article>

        <article className="mk-box">
          <div className="mk-box-testa"><h2>Come leggere da dove arrivano</h2></div>
          <p className="mk-piccolo" style={{ fontSize: 14, lineHeight: 1.6 }}>
            Ogni annuncio deve portare al sito con il nome della campagna nell&apos;indirizzo. Esempio:<br />
            <code style={{ color: "var(--mk-acc)", wordBreak: "break-all" }}>eculion.it/?utm_source=meta&amp;utm_medium=paid&amp;utm_campaign=officine-abruzzo&amp;t=officine</code><br /><br />
            Così il sistema sa che quel contatto viene da Meta, da quella campagna e da quel target, e calcola il costo per contatto e per ritiro di ognuno. Quando lanciamo le campagne dai connettori questi indirizzi li mette Claude in automatico.
          </p>
        </article>
      </div>

      {righe.length ? (
        <article className="mk-box">
          <details>
            <summary>Tutte le righe di spesa ({righe.length})</summary>
            <ul className="mk-lista" style={{ marginTop: 12 }}>
              {righe.map((r) => (
                <li key={r.id} className="mk-riga" style={{ display: "flex" }}>
                  <span>{r.giorno} · {PIATT[r.piattaforma] ?? r.piattaforma} · {r.campagna || "—"} · <b>{eur(Number(r.spesa_eur))}</b></span>
                  {r.fonte === "manuale" ? <form action={eliminaSpesa}><input type="hidden" name="id" value={r.id} /><button className="mk-btn mk-btn-2 mk-btn-pic">Elimina</button></form> : <span className="mk-pill mk-pill-ok">{r.fonte}</span>}
                </li>
              ))}
            </ul>
          </details>
        </article>
      ) : null}
    </section>
  );
}
