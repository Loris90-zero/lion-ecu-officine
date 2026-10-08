import { redirect } from "next/navigation";

/** Il ritiro ora si prenota dalla home: porta lì i dati eventualmente passati. */
export default async function Ritiro({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const p = new URLSearchParams({ ritiro: "1" });
  for (const k of ["centralina", "codice", "nota", "stima", "base"]) if (sp[k]) p.set(k, sp[k]!);
  redirect(`/?${p.toString()}`);
}
