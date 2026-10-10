import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { FormAccesso } from "../accedi/FormAccesso";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AccessoTecnici({ searchParams }: { searchParams: Promise<{ errore?: string }> }) {
  const { errore } = await searchParams;
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (user) redirect("/tecnici/richiesta");
  return (
    <main className="auth">
      <Logo grande sotto="Laboratorio" href="/tecnici" />
      <div className="section">
        <h1>Accesso tecnici e staff</h1>
        <p className="muted">Entra con la tua email di lavoro. La prima volta ti registri e un responsabile approva il tuo accesso.</p>
      </div>
      {errore ? <p className="err">Accesso non riuscito. Riprova, oppure usa l&apos;altro metodo.</p> : null}
      <FormAccesso dopo="/tecnici/richiesta" segnaposto="nome@eculion.it" />
      <p className="hint">Sei un&apos;officina cliente? <a href="/accedi">Entra da qui</a>.</p>
    </main>
  );
}
