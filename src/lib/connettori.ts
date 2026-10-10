import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Stato dei collegamenti del marketing. Alcuni sono chiavi del server (Resend, WhatsApp, agente vocale),
 * altri sono connettori di Claude che scrivono qui i dati (Adspirer per le ads, Metricool per i social):
 * per quelli lo stato si legge dai dati arrivati di recente.
 */
export type Connettore = { id: string; nome: string; cosa: string; perche: string; stato: "collegato" | "da_collegare"; dove: string };

export async function statoConnettori(sb: SupabaseClient): Promise<Connettore[]> {
  const treGiorni = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
  const [ads, social] = await Promise.all([
    sb.from("marketing_spesa").select("piattaforma").neq("fonte", "manuale").gte("giorno", treGiorni).limit(50),
    sb.from("social_post").select("id").not("id_esterni", "is", null).limit(1),
  ]);
  const piatt = new Set((ads.data ?? []).map((r) => r.piattaforma as string));
  const env = (k: string) => !!process.env[k];
  const s = (ok: boolean) => (ok ? "collegato" : "da_collegare") as Connettore["stato"];
  return [
    { id: "meta", nome: "Meta Ads", cosa: "Facebook e Instagram: spesa, click e contatti di ogni campagna, ogni giorno.", perche: "Costo per contatto e per target", stato: s(piatt.has("meta")), dove: "Adspirer, connettore di Claude" },
    { id: "google", nome: "Google Ads", cosa: "Ricerca e YouTube: spesa e conversioni per campagna.", perche: "Chi cerca «riparazione centralina» su Google", stato: s(piatt.has("google")), dove: "Adspirer, connettore di Claude" },
    { id: "tiktok", nome: "TikTok Ads", cosa: "Spesa e risultati dei video sponsorizzati.", perche: "Video brevi per meccanici", stato: s(piatt.has("tiktok")), dove: "Adspirer, connettore di Claude" },
    { id: "metricool", nome: "Metricool", cosa: "Pubblica i post del calendario e riporta like, commenti e visualizzazioni.", perche: "Calendario social automatico", stato: s((social.data ?? []).length > 0), dove: "Connettore di Claude" },
    { id: "canva", nome: "Canva", cosa: "Crea le grafiche dei post e delle inserzioni con il logo e i colori EcuLion.", perche: "Creatività", stato: "da_collegare", dove: "Connettore di Claude" },
    { id: "descript", nome: "Descript", cosa: "Monta i video: tagli, sottotitoli, formati verticali.", perche: "Reel e TikTok", stato: "da_collegare", dove: "Connettore di Claude" },
    { id: "whatsapp", nome: "WhatsApp Business API", cosa: "Messaggi automatici a ogni passo della pratica e conteggio di chi scrive da WhatsApp.", perche: "Sapere quanti contatti arrivano da WhatsApp", stato: s(env("WHATSAPP_TOKEN")), dove: "Meta Business o Bird" },
    { id: "resend", nome: "Email (Resend)", cosa: "Manda le email delle sequenze di prospezione e i codici di accesso.", perche: "Funnel email automatico", stato: s(env("RESEND_API_KEY") && env("EMAIL_MITTENTE")), dove: "Chiave nel pannello Vercel" },
    { id: "voce", nome: "Agente telefonico AI", cosa: "Chiama o risponde con una voce naturale, segue il copione e registra l'esito.", perche: "Richiamare i contatti caldi", stato: s(env("VOICE_API_KEY")), dove: "Vapi o Retell AI + numero italiano" },
    { id: "gsc", nome: "Google Search Console", cosa: "Ricerche organiche che portano al sito, posizioni e click.", perche: "SEO, dopo il dominio", stato: "da_collegare", dove: "Dopo l'acquisto di eculion.it" },
  ];
}
