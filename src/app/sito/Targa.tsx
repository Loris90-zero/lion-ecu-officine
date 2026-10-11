import { u } from "@/sito/config";
import { Wa } from "@/sito/Whatsapp";

/** La targhetta di alluminio della centralina: il codice si cerca da qui. */
export function Targa({ id = "codice-targa" }: { id?: string }) {
  return (
    <form className="s-targa" action={u("/preventivo")} method="get" role="search">
      <i className="r1" aria-hidden="true" /><i className="r2" aria-hidden="true" />
      <div className="s-targa-riga"><span>EcuLion</span><span>Laboratorio centraline</span></div>
      <label htmlFor={id}>Codice sull&apos;etichetta della centralina</label>
      <input id={id} name="q" placeholder="0281 020 459" autoComplete="off" spellCheck={false} />
      <button className="s-btn s-btn-p" type="submit">Calcola il preventivo</button>
      <div className="s-targa-altre">
        <a href={u("/preventivo/foto")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
          Fotografa l&apos;etichetta
        </a>
        <a href={u("/preventivo/senza-codice")}>Non ho il codice</a>
      </div>
      <Wa />
      <p><b>Gratis, senza registrazione.</b> Il codice è sull&apos;etichetta della centralina.</p>
    </form>
  );
}
