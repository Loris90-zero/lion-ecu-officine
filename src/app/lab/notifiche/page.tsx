import Link from "next/link";
import { richiediStaff } from "@/lib/sessione";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AttivaNotifiche } from "@/components/AttivaNotifiche";

const quando = (d: string) => new Date(d).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });

export default async function Notifiche() {
  const { sb, user } = await richiediStaff();
  const email = (user.email ?? "").toLowerCase();
  const { data: io } = await sb.from("staff").select("letto_fino").eq("email", email).maybeSingle();
  const { data } = await sb.from("notifiche").select("*").order("creato_il", { ascending: false }).limit(100);
  const letto = io?.letto_fino ?? new Date(0).toISOString();
  // Aprire la pagina le segna come lette
  await supabaseAdmin().from("staff").update({ letto_fino: new Date().toISOString() }).eq("email", email);
  const lista = (data ?? []) as { id: number; titolo: string; testo: string | null; link: string | null; creato_il: string }[];
  return (
    <section className="screen" style={{ maxWidth: 640 }}>
      <h1>Notifiche</h1>
      <AttivaNotifiche />
      {lista.length === 0 ? <p className="muted">Nessuna notifica per ora.</p> : (
        <ul className="notifiche">
          {lista.map((n) => {
            const corpo = <><div className="row"><b>{n.titolo}</b>{n.creato_il > letto ? <span className="pallino" aria-label="nuova">•</span> : null}</div>{n.testo ? <p>{n.testo}</p> : null}<span className="hint">{quando(n.creato_il)}</span></>;
            return <li key={n.id} className={n.creato_il > letto ? "nuova" : ""}>{n.link ? <Link href={n.link}>{corpo}</Link> : corpo}</li>;
          })}
        </ul>
      )}
    </section>
  );
}
