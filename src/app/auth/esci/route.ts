import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  return NextResponse.redirect(`${base}/accedi`, { status: 303 });
}
