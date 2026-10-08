import { richiediOfficina } from "@/lib/sessione";
import { FormProfilo } from "./FormProfilo";

export const metadata = { title: "Profilo — Lion ECU" };

export default async function Profilo() {
  const { sb, officina: o, user } = await richiediOfficina();
  const { data: staff } = await sb.rpc("is_staff");
  const campi: [string, boolean][] = [
    ["Partita IVA", !!o.partita_iva],
    ["Codice SDI o PEC", !!(o.codice_sdi || o.pec)],
    ["Sede legale", !!o.sede_legale],
    ["Email", !!o.email],
    ["Orari", !!o.orari_ritiro],
    ["Mezzi su cui lavorate", (o.mezzi ?? []).length > 0],
  ];
  const fatti = campi.filter(([, ok]) => ok).length;
  const pct = Math.round(((4 + fatti) / (4 + campi.length)) * 100);
  const mancano = campi.filter(([, ok]) => !ok).map(([n]) => n);

  return (
    <section className="screen">
      <div className="section">
        <h1>Profilo</h1>
        <p className="muted">I dati della vostra officina. Ci servono per i ritiri del corriere, le fatture e i certificati di garanzia.</p>
      </div>
      <div className="box" style={{ borderColor: pct < 100 ? "var(--accent)" : "var(--line)" }}>
        <div className="row"><b>{pct < 100 ? "Completa il profilo" : "Profilo completo"}</b><span className="mono">{pct}%</span></div>
        <div className="steps" style={{ gridTemplateColumns: "1fr" }}><i className="done" style={{ width: `${pct}%` }} /></div>
        {mancano.length ? <p className="hint">Mancano: {mancano.join(", ")}.</p> : null}
      </div>
      <FormProfilo o={o} />
      <div className="box">
        <span className="label">Account</span>
        <p style={{ fontSize: 14 }}>Accedi con <b>{user.email}</b></p>
        <form action="/auth/esci" method="post"><button className="btn btn-ghost btn-block" type="submit">Esci</button></form>
        {staff ? <a className="linkbtn" href="/lab">Vai al pannello laboratorio</a> : null}
      </div>
    </section>
  );
}
