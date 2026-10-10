import Link from "next/link";
import { u } from "@/sito/config";

/** Per chi oggi non ha centraline da riparare: diventare partner. */
export function CtaPartner({ scuro = false }: { scuro?: boolean }) {
  return (
    <Link href={u("/partner")} className={`s-cta-partner${scuro ? " s-cta-scuro" : ""}`}>
      <span>Non hai centraline da riparare al momento ma vuoi diventare nostro partner?</span>
      <b>Clicca qui</b>
    </Link>
  );
}
