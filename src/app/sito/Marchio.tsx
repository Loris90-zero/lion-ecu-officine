import Link from "next/link";
import { u } from "@/sito/config";

/** Marchio provvisorio: in attesa del logo definitivo. */
export function Marchio() {
  return (
    <Link href={u("/")} className="s-marchio" aria-label="EcuLion, home">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <polygon points="100.0,4.0 134.0,41.1 183.1,52.0 168.0,100.0 183.1,148.0 134.0,158.9 100.0,196.0 66.0,158.9 16.9,148.0 32.0,100.0 16.9,52.0 66.0,41.1" fill="#e08a1e" />
        <polygon points="100,40 146,70 138,128 100,166 62,128 54,70" fill="#24384d" />
        <g fill="#e08a1e"><polygon points="66,90 96,100 72,110" /><polygon points="134,90 104,100 128,110" /><polygon points="84,124 116,124 100,144" /></g>
      </svg>
      EcuLion
    </Link>
  );
}
