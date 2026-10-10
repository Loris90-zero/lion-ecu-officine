import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { GuidaInstallazione } from "./Guida";

export const metadata = { title: "Installa l'app — EcuLion" };

export default async function Installa({ searchParams }: { searchParams: Promise<{ benvenuto?: string }> }) {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/accedi");
  const { benvenuto } = await searchParams;
  return (
    <main className="auth" style={{ paddingBlock: 24 }}>
      <Logo grande />
      <div className="section">
        {benvenuto ? <p className="okmsg">Fatto, la tua officina è registrata.</p> : null}
        <h1>Metti EcuLion sul telefono</h1>
        <p className="muted">Un minuto, una volta sola. Poi la apri come le altre app, dalla schermata Home.</p>
      </div>
      <GuidaInstallazione dopo={benvenuto ? "/?benvenuto=1" : "/"} />
    </main>
  );
}
