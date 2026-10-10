import Link from "next/link";
import { richiediStaff } from "@/lib/sessione";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Laboratorio — EcuLion",
  manifest: "/manifest-lab.webmanifest",
  appleWebApp: { capable: true, title: "EcuLion Lab", statusBarStyle: "default" as const },
};

export default async function LayoutLab({ children }: { children: React.ReactNode }) {
  const { sb, admin, user } = await richiediStaff();
  const { data: io } = await sb.from("staff").select("letto_fino").eq("email", (user.email ?? "").toLowerCase()).maybeSingle();
  const { count } = await sb.from("notifiche").select("id", { count: "exact", head: true }).gt("creato_il", io?.letto_fino ?? new Date(0).toISOString());
  const nuove = count ?? 0;
  return (
    <div className="wide">
      <header className="top lab-top">
        <Logo sotto="Laboratorio" href="/lab" />
        <nav className="lab-nav">
          <Link href="/lab" className="linkbtn">Pratiche</Link>
          <Link href="/lab/notifiche" className="linkbtn campanella" aria-label={`Notifiche${nuove ? `, ${nuove} nuove` : ""}`}>
            Notifiche{nuove ? <span className="pallino">{nuove > 99 ? "99+" : nuove}</span> : null}
          </Link>
          <Link href="/lab/officine" className="linkbtn">Officine</Link>
          {admin ? <Link href="/lab/prezzi" className="linkbtn">Prezzi</Link> : null}
          {admin ? <Link href="/lab/impostazioni" className="linkbtn">Impostazioni</Link> : null}
          {admin ? <Link href="/registrazione" className="linkbtn">Vista officina</Link> : null}
          <form action="/auth/esci?a=tecnici" method="post"><button className="linkbtn" type="submit">Esci</button></form>
        </nav>
      </header>
      {children}
    </div>
  );
}
