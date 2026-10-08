import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { FormRegistrazione } from "./FormRegistrazione";

export const metadata = { title: "Registrazione — Lion ECU" };

export default async function Registrazione() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/accedi");
  const { data: esiste } = await sb.from("officine").select("id").eq("owner_id", user.id).maybeSingle();
  if (esiste) redirect("/");
  const nome = (user.user_metadata?.full_name as string | undefined) ?? "";
  return (
    <main className="auth" style={{ paddingBlock: 24 }}>
      <Logo />
      <div className="section">
        <h1>I dati della tua officina</h1>
        <p className="muted">Un minuto, una volta sola. Servono per i ritiri del corriere e per i certificati di garanzia.</p>
      </div>
      <FormRegistrazione email={user.email ?? ""} nome={nome} />
    </main>
  );
}
