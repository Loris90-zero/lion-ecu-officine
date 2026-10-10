import Link from "next/link";

/** Logo EcuLion: versione con testo nero su chiaro, testo bianco in modalità scura. */
export function Logo({ sotto, href = "/", grande = false }: { sotto?: string; href?: string; grande?: boolean }) {
  return (
    <Link href={href} className={`brand${grande ? " brand-grande" : ""}`} aria-label="EcuLion">
      <picture>
        <source srcSet="/brand/logo-scuro-breve.png" media="(prefers-color-scheme: dark)" />
        <img src="/brand/logo-chiaro-breve.png" alt="EcuLion" className="brand-logo" width={1000} height={505} />
      </picture>
      {sotto ? <small>{sotto}</small> : null}
    </Link>
  );
}
