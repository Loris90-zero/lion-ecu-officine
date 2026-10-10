import Link from "next/link";
import "./sito.css";
import { NAV, u, app, CONTATTI, MEZZI } from "@/sito/config";
import { Marchio } from "./Marchio";
import { Traccia } from "@/components/Traccia";

export const metadata = {
  title: { default: "EcuLion — Riparazione centraline per mezzi pesanti", template: "%s — EcuLion" },
  description: "Preventivo di riparazione della centralina in un minuto, dal codice. Per meccanici, meccatronici e flotte di mezzi pesanti: ritiro gratuito, paghi solo se è riparabile, garanzia a vita sul guasto riparato.",
  manifest: "/manifest.webmanifest",
};

export default function LayoutSito({ children }: { children: React.ReactNode }) {
  return (
    <div className="sito">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&display=swap" />
      <header className="s-top">
        <div className="s-wrap">
          <Marchio />
          <nav className="s-nav" aria-label="Menu principale">
            {NAV.map((n) => <Link key={n.href} href={u(n.href)}>{n.nome}</Link>)}
          </nav>
          <a className="s-btn s-btn-p s-entra" href={app("/accedi")}>Entra nell&apos;app</a>
          <details className="s-menu">
            <summary aria-label="Apri il menu">Menu</summary>
            <nav aria-label="Menu">
              {NAV.map((n) => <Link key={n.href} href={u(n.href)}>{n.nome}</Link>)}
              <a href={app("/accedi")}>Entra nell&apos;app</a>
            </nav>
          </details>
        </div>
      </header>
      <main>{children}</main>
      <Traccia dove="sito" />
      <footer className="s-piede">
        <div className="s-wrap">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Marchio su="scuro" />
            <p style={{ margin: 0, maxWidth: "32em" }}>Laboratorio di riparazione centraline elettroniche per mezzi pesanti, macchine da lavoro e barche. {CONTATTI.citta}.</p>
            {CONTATTI.ragioneSociale ? <p style={{ margin: 0 }}>{CONTATTI.ragioneSociale}{CONTATTI.partitaIva ? `, P.IVA ${CONTATTI.partitaIva}` : ""}</p> : null}
          </div>
          <div>
            <ul>
              {MEZZI.map((m) => <li key={m.slug}><Link href={u(`/mezzi/${m.slug}`)}>Centraline {m.nome.toLowerCase()}</Link></li>)}
            </ul>
          </div>
          <div>
            <ul>
              <li><Link href={u("/officine")}>Per le officine</Link></li>
              <li><Link href={u("/partner")}>Officine partner</Link></li>
              <li><Link href={u("/faq")}>Domande frequenti</Link></li>
              <li><Link href={u("/lavora-con-noi")}>Lavora con noi</Link></li>
              <li><Link href={u("/contatti")}>Contatti</Link></li>
              <li><a href="/privacy">Privacy</a></li>
              <li><a href={app("/tecnici")}>Area staff</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
