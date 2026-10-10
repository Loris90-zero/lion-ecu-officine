import { richiediStaff } from "@/lib/sessione";
import { FormImpostazioni, FormStaff, FormFedelta } from "./Forms";
import type { RegoleFedelta } from "@/lib/fedelta";
import type { Impostazioni } from "@/lib/prezzo";

export default async function ImpostazioniLab() {
  const { sb } = await richiediStaff();
  const { data: imp } = await sb.from("impostazioni").select("*").eq("id", 1).single();
  const { data: staff } = await sb.from("staff").select("*").order("creato_il");
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
        <p className="muted" style={{ fontSize: 14 }}>Queste persone, quando entrano nell&apos;app con la loro email, vedono il pannello laboratorio.</p>
        <ul className="src">{(staff ?? []).map((s: { email: string; nome: string | null }) => <li key={s.email}>{s.nome ? `${s.nome} · ` : ""}{s.email}</li>)}</ul>
        <FormStaff />
      </div>
    </section>
  );
}
