"use server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function disiscrivi(fd: FormData) {
  const t = String(fd.get("t") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(t)) redirect("/disiscriviti");
  const admin = supabaseAdmin();
  const { data: p } = await admin.from("prospect").update({ stato: "disiscritto", prossimo_invio: null }).eq("token", t).select("id").maybeSingle();
  if (p) await admin.from("prospect_attivita").insert({ prospect_id: p.id, tipo: "disiscritto" });
  redirect(`/disiscriviti?t=${t}&ok=1`);
}
