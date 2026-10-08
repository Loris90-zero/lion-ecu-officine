"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Lavori", d: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" },
  { href: "/cerca", label: "Cerca", d: "M15.5 15.5L21 21M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z" },
  { href: "/ritiro", label: "Ritiro", d: "M1 6h13v10H1zM14 10h4l3 3v3h-7M7 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" },
  { href: "/garanzie", label: "Garanzie", d: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5" },
];

export function TabBar() {
  const path = usePathname();
  const attivo = (h: string) => (h === "/" ? path === "/" || path.startsWith("/pratica") : path.startsWith(h));
  return (
    <nav className="tabs" aria-label="Sezioni">
      <div>
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className="tab" aria-current={attivo(t.href) ? "page" : undefined}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={t.d} /></svg>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
