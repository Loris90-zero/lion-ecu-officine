import { richiediTitolare } from "@/lib/sessione";
import { SOGLIA_CALDO } from "@/sito/score";

export const dynamic = "force-dynamic";

const COMPITI = [
  ["Richiama i contatti caldi", `Chi finisce il questionario con score da ${SOGLIA_CALDO} in su viene richiamato entro pochi minuti, quando è ancora davanti al banco con la centralina in mano.`],
  ["Risponde fuori orario", "Al numero di EcuLion la sera e nel weekend risponde l'agente: dà il preventivo dal codice, prenota il ritiro e ti lascia il riassunto."],
  ["Segue la prospezione", "Le officine che aprono le email o rispondono «interessato» ricevono una chiamata per fissare la prima centralina di prova."],
  ["Ricorda i ritiri", "Il giorno prima del ritiro chiama per confermare l'orario e ricordare come imballare la centralina."],
];

export default async function Telefono() {
  const { sb } = await richiediTitolare();
  const collegato = !!process.env.VOICE_API_KEY;
  const { data } = await sb.from("prospect_attivita").select("id, esito, durata_s, dettaglio, registrazione_url, creato_il, prospect(nome)").eq("tipo", "chiamata").order("creato_il", { ascending: false }).limit(30);
  const chiamate = (data ?? []) as unknown as { id: number; esito: string | null; durata_s: number | null; dettaglio: string | null; registrazione_url: string | null; creato_il: string; prospect: { nome: string } | null }[];

  return (
    <section className="mk-pagina">
      <header className="mk-testa">
        <div>
          <p className="mk-sopra">Agente telefonico AI · {collegato ? "collegato" : "da collegare"}</p>
          <h1 className="mk-h1">Una voce che chiama e risponde per EcuLion</h1>
          <p className="mk-sotto">Parla italiano con voce naturale, conosce prezzi, tempi e garanzia, legge il preventivo dal codice e registra ogni chiamata con il riassunto. Quando c&apos;è da decidere, passa la chiamata a te o ad Alex.</p>
        </div>
      </header>
      <div className="mk-conn">
        {COMPITI.map(([t, d], i) => (
          <article key={t} style={{ animation: `mkEntra .5s ${i * 60}ms both` }}>
            <h3>{t}</h3>
            <p style={{ margin: 0, fontSize: 14 }}>{d}</p>
          </article>
        ))}
      </div>
      <article className="mk-box">
        <div className="mk-box-testa"><h2>Chiamate</h2></div>
        {chiamate.length === 0 ? <p className="mk-vuoto">Qui compariranno le chiamate con esito, durata, riassunto e registrazione.</p> : (
          <ul className="mk-lista">
            {chiamate.map((c) => (
              <li key={c.id}>
                <div className="mk-riga"><b>{c.prospect?.nome ?? "Contatto"}</b><span className="mk-pill">{c.esito ?? "—"}{c.durata_s ? ` · ${Math.round(c.durata_s / 60)} min` : ""}</span></div>
                {c.dettaglio ? <p className="mk-piccolo" style={{ color: "var(--mk-ink)" }}>{c.dettaglio}</p> : null}
                {c.registrazione_url ? <audio controls preload="none" src={c.registrazione_url} style={{ width: "100%" }} /> : null}
              </li>
            ))}
          </ul>
        )}
      </article>
      <article className="mk-box">
        <div className="mk-box-testa"><h2>Per accenderlo serve</h2></div>
        <ul className="mk-lista">
          <li>Un servizio di agenti vocali (Vapi o Retell AI) e un numero italiano collegato.</li>
          <li>Il copione: lo scriviamo insieme partendo dalle domande vere dei meccanici.</li>
          <li>La chiave del servizio inserita nel pannello Vercel, mai in chat.</li>
        </ul>
        <p className="mk-legale"><b>Regole sulle chiamate.</b> Le chiamate automatiche commerciali richiedono di solito il consenso di chi le riceve, e i numeri nel Registro Pubblico delle Opposizioni non vanno chiamati. Richiamare chi ci ha lasciato il numero e ha chiesto un preventivo è diverso da chiamare a freddo: va verificato con il consulente privacy prima di accenderlo. Non sono un avvocato: è un&apos;indicazione, non un parere legale.</p>
      </article>
    </section>
  );
}
