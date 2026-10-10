import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const a = new URL(request.url).searchParams.get("a");
  return NextResponse.redirect(`${base}/${a === "tecnici" ? "tecnici" : "accedi"}`, { status: 303 });
}
