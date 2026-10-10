import Link from "next/link";
import { richiediTitolare } from "@/lib/sessione";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Super admin — EcuLion", manifest: "/manifest-lab.webmanifest" };

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  await richiediTitolare();
  return (
    <div className="wide">
      <header className="top lab-top">
        <Logo sotto="Super admin" href="/admin" />
        <nav className="lab-nav">
          <Link href="/admin" className="linkbtn">Finanza</Link>
          <Link href="/admin/costi" className="linkbtn">Costi</Link>
          <Link href="/admin/laboratorio" className="linkbtn">Tecnici</Link>
          <Link href="/lab/officine" className="linkbtn">Clienti</Link>
          <Link href="/admin/accessi" className="linkbtn">Accessi</Link>
          <Link href="/admin/impostazioni" className="linkbtn">Parametri</Link>
          <Link href="/lab" className="linkbtn">Laboratorio →</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
