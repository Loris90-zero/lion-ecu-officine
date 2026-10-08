import { richiediOfficina } from "@/lib/sessione";
import { Logo } from "@/components/Logo";
import { TabBar } from "@/components/TabBar";

export default async function LayoutOfficina({ children }: { children: React.ReactNode }) {
  const { officina, sb } = await richiediOfficina();
  const { data: staff } = await sb.rpc("is_staff");
  return (
    <div className="app">
      <header className="top">
        <Logo sotto={officina.ragione_sociale} />
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {staff ? <a className="linkbtn" href="/lab">Laboratorio</a> : null}
          <form action="/auth/esci" method="post"><button className="linkbtn" type="submit">Esci</button></form>
        </div>
      </header>
      {children}
      <TabBar />
    </div>
  );
}
