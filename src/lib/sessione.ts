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

export type Ruolo = "titolare" | "admin" | "tecnico";

/** Utente dello staff attivo. In attesa di approvazione → pagina di attesa; officina → la sua app. */
export async function richiediStaff() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/tecnici");
  const { data: io } = await sb.from("staff").select("email, nome, ruolo, attivo").eq("email", (user.email ?? "").toLowerCase()).maybeSingle();
  if (!io) redirect("/");
  if (!io.attivo) redirect("/tecnici/richiesta");
  const ruolo = io.ruolo as Ruolo;
  return { sb, user, ruolo, admin: ruolo === "admin" || ruolo === "titolare", titolare: ruolo === "titolare", nome: (io.nome as string | null) ?? null };
}

/** Solo il titolare (super admin): finanza e accessi. */
export async function richiediTitolare() {
  const s = await richiediStaff();
  if (!s.titolare) redirect("/lab");
  return s;
}

/** Solo amministratori (prezzi, impostazioni, staff). */
export async function richiediAdmin() {
  const s = await richiediStaff();
  if (!s.admin) redirect("/lab");
  return s;
}
