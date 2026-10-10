import { u } from "@/sito/config";

/** La targhetta di alluminio della centralina: il codice si cerca da qui. */
export function Targa({ id = "codice-targa" }: { id?: string }) {
  return (
    <form className="s-targa" action={u("/centraline")} method="get" role="search">
      <i className="r1" aria-hidden="true" /><i className="r2" aria-hidden="true" />
      <div className="s-targa-riga"><span>EcuLion</span><span>Laboratorio centraline</span></div>
      <label htmlFor={id}>Codice sull&apos;etichetta della centralina</label>
      <input id={id} name="q" placeholder="0281 020 459" autoComplete="off" spellCheck={false} />
      <button className="s-btn s-btn-p" type="submit">Calcola il preventivo</button>
      <p><b>Gratis, senza registrazione.</b> Il codice è sull&apos;etichetta della centralina, per esempio 0281 020 459.</p>
    </form>
  );
}
