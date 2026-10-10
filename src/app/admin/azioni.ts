"use server";
import { revalidatePath } from "next/cache";
import { richiediTitolare } from "@/lib/sessione";

export type StatoF = { ok?: string; errore?: string };
/** Numeri all'italiana: "1.250,50", "1250,5", "1.250" o "0.25". */
function numero(t: string) {
  const x = t.trim().replace(/\s|€/g, "");
  if (!x) return NaN;
  if (x.includes(",")) return Number(x.replace(/\./g, "").replace(",", "."));
  if (/^\d{1,3}(\.\d{3})+$/.test(x)) return Number(x.replace(/\./g, ""));
  return Number(x);
}
const num = (fd: FormData, k: string) => numero(String(fd.get(k) ?? ""));
const pct = (fd: FormData, k: string) => numero(String(fd.get(k) ?? "")) / 100;
const CAT_R = ["operai", "affitto_utenze", "commercialista", "software", "pubblicita", "assicurazioni", "altro"];
const CAT_C = [...CAT_R, "corriere", "materiali", "attrezzature"];

function fine() { revalidatePath("/admin"); revalidatePath("/admin/costi"); }

export async function aggiungiRicorrente(_: StatoF, fd: FormData): Promise<StatoF> {
  const { sb } = await richiediTitolare();
  const nome = String(fd.get("nome") ?? "").trim().slice(0, 120);
  const categoria = String(fd.get("categoria"));
  const importo = num(fd, "importo");
  const iva = pct(fd, "iva");
  const dal = String(fd.get("dal") || new Date().toISOString().slice(0, 7)) + "-01";
  if (!nome || !CAT_R.includes(categoria) || !(importo >= 0) || !(iva >= 0 && iva <= 0.22)) return { errore: "Controlla nome, categoria, importo e IVA (0–22)." };
  const { error } = await sb.from("costi_ricorrenti").insert({ nome, categoria, importo_mensile: importo, iva, dal });
  if (error) return { errore: "Non salvato." };
  fine(); return { ok: "Costo mensile aggiunto." };
}

export async function aggiungiCosto(_: StatoF, fd: FormData): Promise<StatoF> {
  const { sb } = await richiediTitolare();
  const descrizione = String(fd.get("descrizione") ?? "").trim().slice(0, 160);
  const categoria = String(fd.get("categoria"));
  const importo = num(fd, "importo");
  const iva = pct(fd, "iva");
  const data = String(fd.get("data") || new Date().toISOString().slice(0, 10));
  if (!descrizione || !CAT_C.includes(categoria) || !(importo > 0) || !(iva >= 0 && iva <= 0.22) || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return { errore: "Controlla descrizione, categoria, importo, IVA e data." };
  const { error } = await sb.from("costi").insert({ descrizione, categoria, importo, iva, data });
  if (error) return { errore: "Non salvato." };
  fine(); return { ok: "Spesa aggiunta." };
}

export async function aggiungiBene(_: StatoF, fd: FormData): Promise<StatoF> {
  const { sb } = await richiediTitolare();
  const nome = String(fd.get("nome") ?? "").trim().slice(0, 120);
  const costo = num(fd, "costo");
  const anni = Number(String(fd.get("anni") ?? "").replace(",", "."));
  const acquistato_il = String(fd.get("acquistato_il") || new Date().toISOString().slice(0, 10));
  if (!nome || !(costo > 0) || !(anni > 0 && anni <= 30)) return { errore: "Controlla nome, costo e anni (1–30)." };
  const { error } = await sb.from("beni_ammortizzabili").insert({ nome, costo, anni, acquistato_il });
  if (error) return { errore: "Non salvato." };
  fine(); return { ok: "Attrezzatura aggiunta." };
}

export async function eliminaVoce(fd: FormData) {
  const { sb } = await richiediTitolare();
  const tabella = String(fd.get("tabella"));
  const id = Number(fd.get("id"));
  if (!["costi_ricorrenti", "costi", "beni_ammortizzabili"].includes(tabella) || !id) return;
  if (tabella === "costi_ricorrenti") await sb.from(tabella).update({ attivo: false, al: new Date().toISOString().slice(0, 10) }).eq("id", id);
  else await sb.from(tabella).delete().eq("id", id);
  fine();
}

export async function salvaParametri(_: StatoF, fd: FormData): Promise<StatoF> {
  const { sb } = await richiediTitolare();
  const dati = {
    corriere_per_pratica: num(fd, "corriere_per_pratica"),
    materiali_per_pratica: num(fd, "materiali_per_pratica"),
    iva_vendite: pct(fd, "iva_vendite"),
    iva_costi_variabili: pct(fd, "iva_costi_variabili"),
    commissione_pct: pct(fd, "commissione_pct"),
    commissione_fissa: num(fd, "commissione_fissa"),
    aliquota_tasse: pct(fd, "aliquota_tasse"),
    mesi_cliente: num(fd, "mesi_cliente"),
    quota_cac: pct(fd, "quota_cac"),
    aggiornato_il: new Date().toISOString(),
  };
  if (Object.values(dati).some((v) => typeof v === "number" && !(v >= 0))) return { errore: "Controlla i valori: devono essere numeri positivi." };
  const { error } = await sb.from("impostazioni_finanza").update(dati).eq("id", 1);
  if (error) return { errore: "Non salvato." };
  revalidatePath("/admin"); revalidatePath("/admin/impostazioni");
  return { ok: "Parametri salvati." };
}

/** Modulo di registrazione per un nuovo super admin: entra e vede tutto. */
export async function aggiungiTitolare(_: StatoF, fd: FormData): Promise<StatoF> {
  const { sb } = await richiediTitolare();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const nome = String(fd.get("nome") ?? "").trim() || null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { errore: "Email non valida." };
  const { data: esiste } = await sb.from("staff").select("email").eq("email", email).maybeSingle();
  const { error } = esiste
    ? await sb.from("staff").update({ ruolo: "titolare", attivo: true, ...(nome ? { nome } : {}) }).eq("email", email)
    : await sb.from("staff").insert({ email, nome, ruolo: "titolare", attivo: true });
  if (error) return { errore: "Non salvato." };
  revalidatePath("/admin/accessi");
  return { ok: `${email} è super admin: entra da /tecnici e vede tutto.` };
}
