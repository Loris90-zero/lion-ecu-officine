import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBBLICHE = ["/accedi", "/auth", "/api/stripe/webhook", "/manifest.webmanifest", "/manifest-lab.webmanifest", "/sw.js", "/icone", "/privacy"];
const PUBBLICHE_ESATTE = ["/tecnici"];

export async function middleware(request: NextRequest) {
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
  if (!user && !PUBBLICHE.some((p) => path.startsWith(p)) && !PUBBLICHE_ESATTE.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = path.startsWith("/lab") || path.startsWith("/tecnici") ? "/tecnici" : "/accedi";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|webp|ico)$).*)"],
};
