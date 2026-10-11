import type { Fascia } from "@/lib/prezzo";

/** Il listino a fasce: tre prezzi, chiari, uguali per tutti. */
export function Fasce({ fasce, da }: { fasce: Fascia[]; da: boolean }) {
  return (
    <div className="s-fasce">
      {fasce.map((f) => (
        <div key={f.n} className="s-fascia">
          <span className="s-fascia-nome">{f.nome}</span>
          <b>{da ? <small>da </small> : null}{f.prezzo.toLocaleString("it-IT")} €<small> + IVA</small></b>
          <p>{f.descrizione}</p>
        </div>
      ))}
    </div>
  );
}
