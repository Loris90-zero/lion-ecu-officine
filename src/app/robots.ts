import type { MetadataRoute } from "next";
import { SITO_URL } from "@/sito/config";

export default function robots(): MetadataRoute.Robots {
  // Finché il sito non è sul dominio ufficiale, non va indicizzato (evita contenuti duplicati su vercel.app)
  const ufficiale = process.env.NEXT_PUBLIC_SITO_BASE === "";
  return ufficiale
    ? { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/lab", "/admin", "/tecnici", "/pratica", "/garanzie", "/profilo"] }], sitemap: `${SITO_URL}/sitemap.xml` }
    : { rules: [{ userAgent: "*", disallow: "/" }] };
}
