import Link from "next/link";

export function Logo({ sotto, href = "/" }: { sotto?: string; href?: string }) {
  return (
    <Link href={href} className="brand">
      <span className="mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="#eba13f" strokeWidth="2" strokeLinecap="round">
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3M9.5 12h5" />
        </svg>
      </span>
      <span style={{ minWidth: 0 }}>
        <b>Lion ECU System</b>
        {sotto ? <small>{sotto}</small> : null}
      </span>
    </Link>
  );
}
