import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { FormRegistrazione } from "./FormRegistrazione";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata = { title: "Registrazione — EcuLion" };

export default async function Registrazione({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/accedi");
  const { data: esiste } = await sb.from("officine").select("id").eq("owner_id", user.id).maybeSingle();
  if (esiste) redirect("/");
  const nome = (user.user_metadata?.full_name as string | undefined) ?? "";
  const { lead: token } = await searchParams;
  const admin = supabaseAdmin();
  // Questionario già fatto sul sito: lo riconosciamo dal codice nel link o dall'email
  let lead: { token: string } | null = null;
  if (token && /^[0-9a-f-]{36}$/i.test(token)) lead = (await admin.from("lead").select("token").eq("token", token).is("officina_id", null).maybeSingle()).data;
  if (!lead) lead = (await admin.from("lead").select("token").eq("email", (user.email ?? "").toLowerCase()).is("officina_id", null).order("creato_il", { ascending: false }).limit(1).maybeSingle()).data;
  return (
    <main className="auth" style={{ paddingBlock: 24 }}>
      <Logo grande />
      <div className="section">
        <h1>{lead ? "Ci siamo quasi" : "I dati della tua officina"}</h1>
        <p className="muted">{lead ? "Tre dati e sei dentro." : "Tre dati e qualche domanda veloce, poi sei dentro."} L&apos;indirizzo di ritiro te lo chiediamo al primo ritiro, i dati per la fattura solo quando paghi.</p>
      </div>
      <FormRegistrazione email={user.email ?? ""} nome={nome} leadToken={lead?.token ?? null} />
    </main>
  );
}
