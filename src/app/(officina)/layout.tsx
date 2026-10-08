import { richiediOfficina } from "@/lib/sessione";
import { Logo } from "@/components/Logo";
import { TabBar } from "@/components/TabBar";

export default async function LayoutOfficina({ children }: { children: React.ReactNode }) {
  const { officina } = await richiediOfficina();
  return (
    <div className="app">
      <header className="top">
        <Logo sotto={officina.ragione_sociale} />
      </header>
      {children}
      <TabBar />
    </div>
  );
}
