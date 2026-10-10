import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { supabaseServer } from "@/lib/supabase/server";
import { FormRichiesta } from "./FormRichiesta";

export default async function RichiestaAccesso() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/tecnici");
  const { data: io } = await sb.from("staff").select("attivo").eq("email", (user.email ?? "").toLowerCase()).maybeSingle();
  if (io?.attivo) redirect("/lab");
  const nome = (user.user_metadata?.full_name as string | undefined) ?? "";
  return (
    <main className="auth">
      <Logo grande sotto="Laboratorio" href="/tecnici" />
      {io ? (
        <div className="section">
          <h1>Richiesta inviata</h1>
          <p className="muted">Un responsabile deve approvare il tuo accesso. Quando lo fa, riapri l&apos;app: entrerai direttamente nel pannello.</p>
          <a className="btn btn-ghost btn-block" href="/tecnici/richiesta">Controlla di nuovo</a>
        </div>
      ) : (
        <>
          <div className="section">
            <h1>Registrati come tecnico</h1>
            <p className="muted">Accesso con <b>{user.email}</b>. Dopo l&apos;approvazione riceverai le notifiche dei nuovi lavori e potrai aggiornare le pratiche dal telefono.</p>
          </div>
          <FormRichiesta nome={nome} />
        </>
      )}
      <form action="/auth/esci" method="post"><button className="linkbtn" type="submit">Esci da {user.email}</button></form>
    </main>
  );
}
