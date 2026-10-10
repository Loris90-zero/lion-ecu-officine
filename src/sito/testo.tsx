import { Fragment } from "react";

/** Testo semplice degli articoli: paragrafi, "## titoli", "### sottotitoli" ed elenchi con "- ". Niente HTML. */
export function Testo({ corpo }: { corpo: string }) {
  const blocchi = corpo.replace(/\r/g, "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocchi.map((b, i) => {
        if (b.startsWith("### ")) return <h3 key={i}>{b.slice(4)}</h3>;
        if (b.startsWith("## ")) return <h2 key={i}>{b.slice(3)}</h2>;
        const righe = b.split("\n");
        if (righe.every((r) => r.startsWith("- "))) return <ul key={i}>{righe.map((r, j) => <li key={j}>{r.slice(2)}</li>)}</ul>;
        return <p key={i}>{righe.map((r, j) => <Fragment key={j}>{j ? <br /> : null}{r}</Fragment>)}</p>;
      })}
    </>
  );
}
