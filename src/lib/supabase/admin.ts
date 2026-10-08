import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Client con chiave di servizio: ignora i permessi. Usarlo SOLO lato server. */
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
