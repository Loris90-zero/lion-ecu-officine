import { richiediTitolare } from "@/lib/sessione";
import { periodoMk, caricaMarketing } from "@/lib/marketing";
import { statoConnettori } from "@/lib/connettori";
import { Vista } from "./Vista";

export const dynamic = "force-dynamic";

export default async function Marketing({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { sb } = await richiediTitolare();
  const per = periodoMk((await searchParams).p);
  const [dati, conn] = await Promise.all([caricaMarketing(sb, per), statoConnettori(sb)]);
  return <Vista per={per} dati={dati} conn={conn} />;
}
