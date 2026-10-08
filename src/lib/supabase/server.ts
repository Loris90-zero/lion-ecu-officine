import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Client Supabase lato server, con la sessione dell'utente (rispetta i permessi). */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(list) {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // chiamato da un Server Component: il middleware aggiorna i cookie
          }
        },
      },
    }
  );
}
