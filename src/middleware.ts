import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SORGENTE, DURATA_COOKIE, classifica, daAggiornare, dominioCookie, leggiAttribuzione, scriviAttribuzione } from "@/lib/attribuzione";

/** Al primo arrivo (o arrivando da un annuncio) ricorda da dove viene la persona. */
function segnaSorgente(request: NextRequest, response: NextResponse, host: string) {
  const p = request.nextUrl.pathname;
  if (p.startsWith("/api") || p.startsWith("/_next") || request.method !== "GET") return response;
  const vecchia = leggiAttribuzione(request.cookies.get(COOKIE_SORGENTE)?.value);
  const nuova = classifica(request.nextUrl.searchParams, request.headers.get("referer"), p);
  if (!vecchia && !nuova && !request.cookies.get(COOKIE_SORGENTE)) {
    // arrivo diretto: lo segniamo come tale, così non viene sovrascritto da una navigazione interna
    const d = { s: "diretto" as const, m: "diretto" as const, l: p.slice(0, 120), d: new Date().toISOString() };
    response.cookies.set(COOKIE_SORGENTE, scriviAttribuzione(d), { maxAge: DURATA_COOKIE, path: "/", sameSite: "lax", domain: dominioCookie(host) });
    return response;
  }
  if (daAggiornare(vecchia, nuova) && nuova)
    response.cookies.set(COOKIE_SORGENTE, scriviAttribuzione(nuova), { maxAge: DURATA_COOKIE, path: "/", sameSite: "lax", domain: dominioCookie(host) });
  return response;
}

const PUBBLICHE = ["/accedi", "/auth", "/api/stripe/webhook", "/api/cerca-pubblica", "/api/traccia", "/api/cron", "/disiscriviti", "/manifest.webmanifest", "/manifest-lab.webmanifest", "/sw.js", "/icone", "/privacy", "/sito", "/robots.txt", "/sitemap.xml"];
const PUBBLICHE_ESATTE = ["/tecnici"];

/** Domini del sito pubblico: lì il sito sta alla radice (le pagine vivono in /sito). */
const DOMINI_SITO = ["eculion.it", "www.eculion.it"];
const DELL_APP = ["/_next", "/api", "/auth", "/disiscriviti", "/icone", "/sw.js", "/manifest", "/privacy", "/robots.txt", "/sitemap.xml", "/favicon"];

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0];
  if (DOMINI_SITO.includes(host)) {
    const p = request.nextUrl.pathname;
    if (host.startsWith("www.")) { const url = request.nextUrl.clone(); url.host = "eculion.it"; return NextResponse.redirect(url, 301); }
    if (p.startsWith("/sito")) { const url = request.nextUrl.clone(); url.pathname = p.slice(5) || "/"; return NextResponse.redirect(url, 301); }
    if (!DELL_APP.some((x) => p.startsWith(x))) { const url = request.nextUrl.clone(); url.pathname = `/sito${p === "/" ? "" : p}`; return segnaSorgente(request, NextResponse.rewrite(url), host); }
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  // Chi apre la radice senza essere entrato (e non dall'app installata) vede il sito, non la pagina di accesso
  if (!user && path === "/" && request.nextUrl.searchParams.get("app") !== "1" && !DOMINI_SITO.includes(host)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sito";
    url.searchParams.delete("app");
    return segnaSorgente(request, NextResponse.redirect(url), host);
  }
  if (!user && !PUBBLICHE.some((p) => path.startsWith(p)) && !PUBBLICHE_ESATTE.includes(path)) {
    if (host.endsWith(".vercel.app")) {
      const url = request.nextUrl.clone();
      url.pathname = path.startsWith("/lab") || path.startsWith("/tecnici") || path.startsWith("/admin") ? "/tecnici" : "/accedi";
      url.search = "";
      const r = NextResponse.redirect(url);
      r.headers.set("X-Robots-Tag", "noindex, nofollow");
      return r;
    }
    const url = request.nextUrl.clone();
    url.pathname = path.startsWith("/lab") || path.startsWith("/tecnici") || path.startsWith("/admin") ? "/tecnici" : "/accedi";
    url.search = "";
    return NextResponse.redirect(url);
  }
  // Indirizzo di prova (vercel.app): Google e Bing possono leggerlo ma non devono metterlo nei risultati
  if (host.endsWith(".vercel.app")) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (path.startsWith("/sito") || path.startsWith("/accedi") || path.startsWith("/registrazione")) segnaSorgente(request, response, host);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|webp|ico)$).*)"],
};
