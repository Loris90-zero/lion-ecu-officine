import "server-only";
import webpush from "web-push";
import { createECDH, createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Notifica = {
  per_ruolo?: "tutti" | "tecnico" | "admin";
  tipo: string;
  titolo: string;
  testo?: string;
  link?: string;
  pratica_id?: string;
};

/**
 * Chiavi VAPID per le notifiche push, derivate dalla chiave segreta del server già presente:
 * nessuna chiave nuova da creare o copiare. La pubblica si legge da /api/push.
 */
export function chiaviVapid() {
  const segreto = process.env.VAPID_PRIVATE_KEY ? null : process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
    return { pubblica: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, privata: process.env.VAPID_PRIVATE_KEY };
  if (!segreto) return null;
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(createHash("sha256").update(`eculion-vapid|${segreto}`).digest());
  return { pubblica: ecdh.getPublicKey().toString("base64url"), privata: ecdh.getPrivateKey().toString("base64url") };
}

let pronto: boolean | null = null;
function vapid() {
  if (pronto !== null) return pronto;
  const k = chiaviVapid();
  pronto = !!k;
  if (k) webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:info@eculion.it", k.pubblica, k.privata);
  return pronto;
}

/**
 * Notifica allo staff: la salva (elenco nell'app) e la manda come push ai telefoni iscritti.
 * Va chiamata con il client admin (service role). Non blocca mai il flusso se qualcosa fallisce.
 */
export async function notificaStaff(admin: SupabaseClient, n: Notifica) {
  const per_ruolo = n.per_ruolo ?? "tutti";
  try {
    await admin.from("notifiche").insert({ per_ruolo, tipo: n.tipo, titolo: n.titolo, testo: n.testo ?? null, link: n.link ?? null, pratica_id: n.pratica_id ?? null });
    if (!vapid()) return;
    let q = admin.from("staff").select("email").eq("attivo", true);
    if (per_ruolo === "admin") q = q.eq("ruolo", "admin");
    const { data: dest } = await q;
    const email = (dest ?? []).map((d) => d.email);
    if (!email.length) return;
    const { data: iscr } = await admin.from("push_iscrizioni").select("endpoint, p256dh, auth").in("email", email);
    const payload = JSON.stringify({ titolo: n.titolo, testo: n.testo ?? "", link: n.link ?? "/lab/notifiche" });
    await Promise.all((iscr ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24 });
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await admin.from("push_iscrizioni").delete().eq("endpoint", s.endpoint);
      }
    }));
  } catch {
    // una notifica persa non deve far fallire la prenotazione o il pagamento
  }
}
