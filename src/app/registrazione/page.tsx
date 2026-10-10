import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { FormRegistrazione } from "./FormRegistrazione";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata = { title: "Registrazione — EcuLion" };

export default async function Registrazione() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/accedi");
  const { data: esiste } = await sb.from("officine").select("id").eq("owner_id", user.id).maybeSingle();
  if (esiste) redirect("/");
  const nome = (user.user_metadata?.full_name as string | undefined) ?? "";
  const { data: lead } = await supabaseAdmin().from("lead").select("id").eq("email", (user.email ?? "").toLowerCase()).is("officina_id", null).limit(1).maybeSingle();
  return (
    <main className="auth" style={{ paddingBlock: 24 }}>
      <Logo grande />
      <div className="section">
        <h1>I dati della tua officina</h1>
        <p className="muted">Quattro dati e cinque domande veloci, poi sei dentro. L&apos;indirizzo di ritiro te lo chiediamo al primo ritiro, i dati per la fattura solo quando paghi.</p>
      </div>
      <FormRegistrazione email={user.email ?? ""} nome={nome} quizFatto={!!lead} />
    </main>
  );
}
