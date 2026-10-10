import { u } from "@/sito/config";

/** La targhetta di alluminio della centralina: il codice si cerca da qui. */
export function Targa() {
  return (
    <form className="s-targa" action={u("/centraline")} method="get" role="search">
      <i className="r1" aria-hidden="true" /><i className="r2" aria-hidden="true" />
      <div className="s-targa-riga"><span>EcuLion</span><span>Laboratorio centraline</span></div>
      <label htmlFor="codice-targa">Codice sull&apos;etichetta della centralina</label>
      <input id="codice-targa" name="q" placeholder="0281 020 459" autoComplete="off" spellCheck={false} />
      <button className="s-btn s-btn-p" type="submit">Cerca la centralina</button>
      <p>Il codice è stampato sull&apos;etichetta: per esempio 0281 020 459 o EDC17CV41. Nell&apos;app puoi anche fotografarla.</p>
    </form>
  );
}
