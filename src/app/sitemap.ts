import type { MetadataRoute } from "next";
import { SITO_URL, MEZZI } from "@/sito/config";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fisse = ["", "/officine", "/centraline", "/guasti", "/garanzia", "/partner", "/chi-siamo", "/contatti", "/faq", "/lavora-con-noi"].map((p) => ({ url: `${SITO_URL}${p}`, changeFrequency: "weekly" as const }));
  const mezzi = MEZZI.map((m) => ({ url: `${SITO_URL}/mezzi/${m.slug}`, changeFrequency: "monthly" as const }));
  type R = { slug: string; aggiornato_il: string }[] | null;
  let c: R = null, a: R = null;
  try {
    const admin = supabaseAdmin();
    const r = await Promise.all([
      admin.from("pagine_centraline").select("slug, aggiornato_il").eq("stato", "pubblicata"),
      admin.from("articoli").select("slug, aggiornato_il").eq("stato", "pubblicata"),
    ]);
    c = r[0].data; a = r[1].data;
  } catch { /* senza database (build locale): solo le pagine fisse */ }
  return [
    ...fisse, ...mezzi,
    ...(c ?? []).map((x) => ({ url: `${SITO_URL}/centraline/${x.slug}`, lastModified: x.aggiornato_il })),
    ...(a ?? []).map((x) => ({ url: `${SITO_URL}/guasti/${x.slug}`, lastModified: x.aggiornato_il })),
  ];
}
