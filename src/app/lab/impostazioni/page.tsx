import { richiediAdmin } from "@/lib/sessione";
import { FormImpostazioni, FormStaff, FormFedelta } from "./Forms";
import { gestisciStaff } from "../azioni";
import type { RegoleFedelta } from "@/lib/fedelta";
import type { Impostazioni } from "@/lib/prezzo";

export default async function ImpostazioniLab() {
  const { sb } = await richiediAdmin();
  const { data: imp } = await sb.from("impostazioni").select("*").eq("id", 1).single();
  const { data: staff } = await sb.from("staff").select("*").order("creato_il");
  type S = { email: string; nome: string | null; ruolo: string; attivo: boolean; telefono: string | null };
  const tutti = (staff ?? []) as S[];
  const inAttesa = tutti.filter((s) => !s.attivo);
  const attivi = tutti.filter((s) => s.attivo);
  return (
    <section className="screen" style={{ maxWidth: 640 }}>
      <h1>Impostazioni</h1>
      <div className="box">
        <h2>Prezzo della riparazione</h2>
        <p className="muted" style={{ fontSize: 14 }}>Il prezzo che l&apos;officina vede nella ricerca è una percentuale del prezzo della centralina nuova trovato online.</p>
        <FormImpostazioni imp={imp as Impostazioni} />
      </div>
      <div className="box">
        <h2>Programma punti</h2>
        <p className="muted" style={{ fontSize: 14 }}>1 punto per ogni € di riparazioni pagate (IVA esclusa). Livelli: Base, Partner, Partner Gold. Lo sconto si applica da solo al pagamento.</p>
        <FormFedelta r={imp as RegoleFedelta} />
      </div>
      <div className="box">
        <h2>Staff del laboratorio</h2>
        <p className="muted" style={{ fontSize: 14 }}>I tecnici si registrano da <b>/tecnici</b> e restano in attesa finché non li approvi. Gli amministratori vedono anche prezzi e impostazioni.</p>
        {inAttesa.length ? (
          <div className="box" style={{ borderColor: "var(--accent)" }}>
            <span className="label">Richieste in attesa · {inAttesa.length}</span>
            {inAttesa.map((s) => (
              <form key={s.email} action={gestisciStaff} className="riga-staff">
                <input type="hidden" name="email" value={s.email} />
                <div><b>{s.nome ?? s.email}</b><div className="hint">{s.email}{s.telefono ? ` · ${s.telefono}` : ""}</div></div>
                <div className="azioni-staff">
                  <button className="btn btn-primary btn-sm" name="azione" value="approva_tecnico">Approva tecnico</button>
                  <button className="btn btn-ghost btn-sm" name="azione" value="approva_admin">Approva admin</button>
                  <button className="linkbtn" name="azione" value="rimuovi">Rifiuta</button>
                </div>
              </form>
            ))}
          </div>
        ) : null}
        {attivi.map((s) => (
          <form key={s.email} action={gestisciStaff} className="riga-staff">
            <input type="hidden" name="email" value={s.email} />
            <div><b>{s.nome ?? s.email}</b> <span className="hint">· {s.ruolo === "titolare" ? "Titolare" : s.ruolo === "admin" ? "Amministratore" : "Tecnico"}</span><div className="hint">{s.email}{s.telefono ? ` · ${s.telefono}` : ""}</div></div>
            <div className="azioni-staff">
              {s.ruolo === "titolare" ? null : s.ruolo === "admin"
                ? <button className="linkbtn" name="azione" value="approva_tecnico">Rendi tecnico</button>
                : <button className="linkbtn" name="azione" value="approva_admin">Rendi admin</button>}
              {s.ruolo === "titolare" ? null : <button className="linkbtn" name="azione" value="disattiva">Disattiva</button>}
            </div>
          </form>
        ))}
        <span className="label">Aggiungi direttamente</span>
        <FormStaff />
      </div>
    </section>
  );
}
