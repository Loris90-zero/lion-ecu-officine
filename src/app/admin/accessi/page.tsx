import { richiediTitolare } from "@/lib/sessione";
import { gestisciStaff } from "@/app/lab/azioni";
import { FormTitolare } from "./FormTitolare";

export default async function Accessi() {
  const { sb, user } = await richiediTitolare();
  const { data } = await sb.from("staff").select("email, nome, ruolo, attivo").order("creato_il");
  const tutti = (data ?? []) as { email: string; nome: string | null; ruolo: string; attivo: boolean }[];
  const titolari = tutti.filter((s) => s.ruolo === "titolare");
  const io = (user.email ?? "").toLowerCase();
  return (
    <section className="screen" style={{ maxWidth: 680 }}>
      <h1>Accessi super admin</h1>
      <p className="muted">I titolari vedono tutto: finanza, clienti, laboratorio, prezzi e staff. Tecnici e amministratori si gestiscono da Laboratorio → Impostazioni.</p>
      <div className="box">
        <span className="label">Titolari · {titolari.length}</span>
        {titolari.map((s) => (
          <form key={s.email} action={gestisciStaff} className="riga-staff">
            <input type="hidden" name="email" value={s.email} />
            <div><b>{s.nome ?? s.email}</b><div className="hint">{s.email}{!s.attivo ? " · disattivato" : ""}</div></div>
            {s.email !== io ? <div className="azioni-staff"><button className="linkbtn" name="azione" value="approva_admin">Togli super admin</button></div> : <span className="hint">sei tu</span>}
          </form>
        ))}
      </div>
      <div className="box">
        <span className="label">Aggiungi un super admin</span>
        <p className="hint" style={{ margin: 0 }}>Scrivi la sua email: quando entra da <b>/tecnici</b> con quella email vede subito tutto, senza approvazione. Se è già nello staff, viene promosso.</p>
        <FormTitolare />
      </div>
    </section>
  );
}
