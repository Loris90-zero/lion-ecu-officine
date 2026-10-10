import Link from "next/link";
import { richiediStaff } from "@/lib/sessione";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Laboratorio — Lion ECU" };

export default async function LayoutLab({ children }: { children: React.ReactNode }) {
  await richiediStaff();
  return (
    <div className="wide">
      <header className="top">
        <Logo sotto="Pannello laboratorio" href="/lab" />
        <nav style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 14 }}>
          <Link href="/lab" className="linkbtn">Pratiche</Link>
          <Link href="/lab/officine" className="linkbtn">Officine</Link>
          <Link href="/lab/prezzi" className="linkbtn">Prezzi</Link>
          <Link href="/lab/impostazioni" className="linkbtn">Impostazioni</Link>
          <Link href="/registrazione" className="linkbtn">Vista officina</Link>
          <form action="/auth/esci" method="post"><button className="linkbtn" type="submit">Esci</button></form>
        </nav>
      </header>
      {children}
    </div>
  );
}
