import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const base = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const n = url.searchParams.get("next") ?? "/";
  const dopo = n.startsWith("/") && !n.startsWith("//") ? n : "/";
  if (code) {
    const sb = await supabaseServer();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${base}${dopo}`);
  }
  return NextResponse.redirect(`${base}${dopo.startsWith("/tecnici") ? "/tecnici" : "/accedi"}?errore=1`);
}
