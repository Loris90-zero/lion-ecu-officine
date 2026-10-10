import Link from "next/link";
import { u } from "@/sito/config";

/** Logo EcuLion: «chiaro» = testo nero per sfondi chiari, «scuro» = testo bianco per sfondi scuri. */
export function Marchio({ su = "chiaro" }: { su?: "chiaro" | "scuro" }) {
  return (
    <Link href={u("/")} className="s-marchio" aria-label="EcuLion, home">
      <img src={su === "scuro" ? "/brand/logo-scuro-breve.png" : "/brand/logo-chiaro-breve.png"} alt="EcuLion" width={1000} height={505} />
    </Link>
  );
}
