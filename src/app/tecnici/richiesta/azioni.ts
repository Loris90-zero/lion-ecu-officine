"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type StatoRichiesta = { errore?: string };

/** Il tecnico chiede l'accesso: resta in attesa finché un amministratore non lo approva. */
export async function chiediAccesso(_: StatoRichiesta, fd: FormData): Promise<StatoRichiesta> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) redirect("/tecnici");
  const nome = String(fd.get("nome") ?? "").trim().slice(0, 80);
  const telefono = String(fd.get("telefono") ?? "").trim().slice(0, 30);
  if (!nome || !telefono) return { errore: "Scrivi nome e cognome e il cellulare." };
  const admin = supabaseAdmin();
  const email = user.email.toLowerCase();
  const { data: esiste } = await admin.from("staff").select("email").eq("email", email).maybeSingle();
  if (!esiste) {
    const { error } = await admin.from("staff").insert({ email, nome, telefono, user_id: user.id, ruolo: "tecnico", attivo: false });
    if (error) return { errore: "Richiesta non inviata. Riprova tra poco." };
    // Avviso agli amministratori nel pannello
    await admin.from("notifiche").insert({ per_ruolo: "admin", tipo: "staff", titolo: "Nuova richiesta di accesso", testo: `${nome} (${email}) chiede di entrare nel laboratorio.`, link: "/lab/impostazioni" });
  }
  revalidatePath("/tecnici/richiesta");
  return {};
}
