import { Logo } from "@/components/Logo";
import { FormAccesso } from "./FormAccesso";

export const metadata = { title: "Accedi — EcuLion" };

export default async function Accedi({ searchParams }: { searchParams: Promise<{ errore?: string; lead?: string; email?: string; via?: string }> }) {
  const { errore, lead, email, via } = await searchParams;
  const token = lead && /^[0-9a-f-]{36}$/i.test(lead) ? lead : null;
  const dopo = token ? `/registrazione?lead=${token}` : undefined;
  return (
    <main className="auth">
      <Logo grande />
      <div className="section">
        <h1>{token ? "Ultimo passo: entra nell'app" : "Entra nell'app delle officine"}</h1>
        <p className="muted">{token ? "Le tue risposte sono salvate. Entra e calcola il primo preventivo." : "Ritiro gratuito delle centraline, stato delle riparazioni e garanzie, tutto dal telefono."}</p>
      </div>
      {errore ? <p className="err">Accesso non riuscito. Riprova, oppure usa l&apos;altro metodo.</p> : null}
      <FormAccesso dopo={dopo} emailIniziale={email ?? ""} auto={token && (via === "google" || via === "email") ? via : undefined} />
      <p className="hint">Entrando accetti l&apos;<a href="/privacy">informativa privacy</a>.</p>
    </main>
  );
}
