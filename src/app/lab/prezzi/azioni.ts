"use server";
import { revalidatePath } from "next/cache";
import { richiediStaff } from "@/lib/sessione";

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
const numero = (v: FormDataEntryValue | null) => Number(String(v ?? "").replace(/\./g, "").replace(",", "."));

export async function aggiungiPrezzo(fd: FormData) {
  const { sb } = await richiediStaff();
  const codici = String(fd.get("codici") ?? "").split(/[,;\n]+/).map(norm).filter((c) => c.length >= 4);
  const prezzo = numero(fd.get("prezzo"));
  if (!codici.length || !(prezzo > 0)) return;
  await sb.from("prezzi_riferimento").insert({
    codici, prezzo_eur: prezzo, prezzo_originale: prezzo, valuta: "EUR", origine: "laboratorio",
    descrizione: String(fd.get("descrizione") ?? "").trim() || null,
    fonte_nome: String(fd.get("fonte") ?? "").trim() || "Listino Lion ECU",
  });
  revalidatePath("/lab/prezzi");
}

export async function aggiornaPrezzo(fd: FormData) {
  const { sb } = await richiediStaff();
  const id = Number(fd.get("id"));
  const prezzo = numero(fd.get("prezzo"));
  if (!(id > 0) || !(prezzo > 0)) return;
  // Un prezzo corretto a mano diventa del laboratorio e vince sulla ricerca
  await sb.from("prezzi_riferimento").update({ prezzo_eur: prezzo, prezzo_originale: prezzo, valuta: "EUR", origine: "laboratorio", aggiornato_il: new Date().toISOString() }).eq("id", id);
  revalidatePath("/lab/prezzi");
}

export async function cambiaAttivo(fd: FormData) {
  const { sb } = await richiediStaff();
  const id = Number(fd.get("id"));
  await sb.from("prezzi_riferimento").update({ attivo: fd.get("attivo") === "1" }).eq("id", id);
  revalidatePath("/lab/prezzi");
}

export async function aggiungiFonte(fd: FormData) {
  const { sb } = await richiediStaff();
  const dominio = String(fd.get("dominio") ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  const categoria = String(fd.get("categoria") ?? "").trim();
  if (!dominio.includes(".") || !categoria) return;
  await sb.from("fonti_preferite").upsert({ dominio, categoria, nota: String(fd.get("nota") ?? "").trim() || null, attivo: true });
  revalidatePath("/lab/prezzi");
}

export async function cambiaFonte(fd: FormData) {
  const { sb } = await richiediStaff();
  await sb.from("fonti_preferite").update({ attivo: fd.get("attivo") === "1" }).eq("dominio", String(fd.get("dominio")));
  revalidatePath("/lab/prezzi");
}
