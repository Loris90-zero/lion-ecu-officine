import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import type { Officina } from "./types";

/** Utente loggato + la sua officina. Se manca qualcosa, rimanda alla pagina giusta. */
export async function richiediOfficina() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/accedi");
  const { data: officina } = await sb.from("officine").select("*").eq("owner_id", user.id).maybeSingle();
  if (!officina) {
    const { data: staff } = await sb.rpc("is_staff");
    redirect(staff ? "/lab" : "/registrazione");
  }
  return { sb, user, officina: officina as Officina };
}

export async function richiediStaff() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/accedi");
  const { data: staff } = await sb.rpc("is_staff");
  if (!staff) redirect("/");
  return { sb, user };
}
