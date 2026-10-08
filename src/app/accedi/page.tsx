import { Logo } from "@/components/Logo";
import { FormAccesso } from "./FormAccesso";

export const metadata = { title: "Accedi — Lion ECU" };

export default async function Accedi({ searchParams }: { searchParams: Promise<{ errore?: string }> }) {
  const { errore } = await searchParams;
  return (
    <main className="auth">
      <Logo />
      <div className="section">
        <h1>Entra nell&apos;app delle officine</h1>
        <p className="muted">Ritiro gratuito delle centraline, stato delle riparazioni e garanzie, tutto dal telefono.</p>
      </div>
      {errore ? <p className="err">Accesso non riuscito. Riprova, oppure usa l&apos;altro metodo.</p> : null}
      <FormAccesso />
      <p className="hint">Entrando accetti l&apos;<a href="/privacy">informativa privacy</a>.</p>
    </main>
  );
}
