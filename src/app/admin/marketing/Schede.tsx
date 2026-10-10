"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SCHEDE = [
  ["/admin/marketing", "Panoramica"],
  ["/admin/marketing/ads", "Ads e spesa"],
  ["/admin/marketing/social", "Social"],
  ["/admin/marketing/prospezione", "Prospezione AI"],
  ["/admin/marketing/telefono", "Agente telefonico"],
  ["/admin/marketing/connettori", "Connettori"],
] as const;

export function Schede() {
  const p = usePathname();
  return (
    <nav className="mk-schede" aria-label="Sezioni marketing">
      {SCHEDE.map(([h, n]) => {
        const attiva = h === "/admin/marketing" ? p === h : p.startsWith(h);
        return <Link key={h} href={h} aria-current={attiva ? "page" : undefined}>{n}</Link>;
      })}
    </nav>
  );
}
