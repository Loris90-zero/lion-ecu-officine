export type Impostazioni = {
  fasce?: unknown;
  prezzo_da?: boolean;
  percentuale: number;
  minimo_eur: number;
  arrotonda_eur: number;
  base: "mediana" | "minimo" | "massimo";
  cambio_usd?: number;
  cambio_gbp?: number;
  soglia_anomali?: number;
};

/** Prezzo riparazione = percentuale sul prezzo del nuovo trovato online. */
export function calcolaPrezzo(prezziNuovo: number[], imp: Impostazioni) {
  const v = prezziNuovo.filter((n) => isFinite(n) && n > 0).sort((a, b) => a - b);
  if (!v.length) return null;
  const base =
    imp.base === "minimo" ? v[0]
    : imp.base === "massimo" ? v[v.length - 1]
    : v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
  const grezzo = Math.max(Number(imp.minimo_eur), base * Number(imp.percentuale));
  const passo = Number(imp.arrotonda_eur) || 1;
  const prezzo = Math.ceil(grezzo / passo) * passo;
  return { base: Math.round(base), prezzo, risparmio: Math.round((1 - prezzo / base) * 100) };
}

type Voce = { prezzo_eur: number; url: string; valuta?: string; prezzo_originale?: number; venditore?: string; listino_eur?: number | null; condizione?: string };

/** Pagine di elenco o ricerca (marketplace): mostrano tanti annunci, il prezzo non è affidabile. */
export function paginaElenco(url: string) {
  try {
    const u = new URL(url);
    const h = u.hostname, p = u.pathname;
    if (/(^|\.)ebay\./.test(h) && /^\/(b|sch|e)\//.test(p)) return true;
    if (/subito\.it|aaannunci|agronetto|kijiji|bakeca|vivastreet/.test(h)) return true;
    if (u.searchParams.has("_nkw") || u.searchParams.has("q") || u.searchParams.has("search") || /\/search|\/ricerca|\/cerca/.test(p)) return true;
    return false;
  } catch { return true; }
}

/** Compatibili, aftermarket e marketplace esteri di ricambi generici: non sono la base giusta. */
export function nonOriginale(x: { url: string; venditore?: string; condizione?: string }) {
  try {
    const h = new URL(x.url).hostname;
    if (/alibaba|aliexpress|made-in-china|dhgate|temu|wish\.com|banggood/.test(h)) return true;
  } catch { return true; }
  return /compatib|non originale|aftermarket|replica|copia/i.test(`${x.venditore || ""} ${x.condizione || ""}`);
}

/** Converte le valute, sposta tra gli "altri prezzi" le pagine di elenco e i prezzi anomali. */
export function normalizzaPrezzi<T extends { prezzi_nuova: Voce[]; altri_prezzi: Voce[] }>(r: T, imp: Impostazioni): T {
  const cambio = (v?: string) => {
    const k = (v || "EUR").toUpperCase();
    if (k === "EUR" || k === "€") return 1;
    if (k === "USD" || k === "$") return Number(imp.cambio_usd) || 0.9;
    if (k === "GBP" || k === "£") return Number(imp.cambio_gbp) || 1.15;
    return null;
  };
  const converti = (x: Voce): Voce | null => {
    const c = cambio(x.valuta);
    const orig = Number(x.prezzo_originale ?? x.prezzo_eur);
    if (c === null || !(orig > 0)) return null;
    return { ...x, prezzo_originale: orig, prezzo_eur: Math.round(orig * c) };
  };
  let nuovi: Voce[] = [];
  const altri: Voce[] = [];
  for (const x of r.prezzi_nuova) {
    const y = converti(x); if (!y) continue;
    if (paginaElenco(y.url)) altri.push({ ...y, condizione: "pagina di elenco, non verificabile" });
    else if (nonOriginale(y)) altri.push({ ...y, condizione: "compatibile, non originale" });
    else nuovi.push(y);
  }
  for (const x of r.altri_prezzi) { const y = converti(x); if (y) altri.push(y); }
  // Un "nuovo" che costa meno dell'usato originale non è credibile
  const maxUsato = Math.max(0, ...altri.filter((a) => /usat/i.test(a.condizione || "")).map((a) => a.prezzo_eur));
  if (maxUsato > 0) {
    altri.push(...nuovi.filter((n) => n.prezzo_eur <= maxUsato).map((n) => ({ ...n, condizione: "costa meno dell'usato, non credibile" })));
    nuovi = nuovi.filter((n) => n.prezzo_eur > maxUsato);
  }
  const soglia = Number(imp.soglia_anomali) || 0.4;
  if (nuovi.length > 1) {
    const max = Math.max(...nuovi.map((n) => n.prezzo_eur));
    const scartati = nuovi.filter((n) => n.prezzo_eur < max * soglia);
    nuovi = nuovi.filter((n) => n.prezzo_eur >= max * soglia);
    altri.push(...scartati.map((n) => ({ ...n, condizione: "troppo basso per un nuovo, escluso" })));
  }
  return { ...r, prezzi_nuova: nuovi, altri_prezzi: altri };
}

/* ===== Prezzo a fasce: il prezzo della riparazione dipende dal tipo di centralina ===== */

export const CATEGORIE_CENTRALINA = {
  motore: "Motore", cambio: "Cambio", freni: "Freni EBS e ABS", sospensioni: "Sospensioni",
  idraulica: "Idraulica e gru", cruscotto: "Cruscotti e quadri", carrozzeria: "Body controller e moduli", altro: "Altre centraline",
} as const;
export type Categoria = keyof typeof CATEGORIE_CENTRALINA;
export type Fascia = { n: number; nome: string; prezzo: number; descrizione: string; categorie: Categoria[] };

export const FASCE_PREDEFINITE: Fascia[] = [
  { n: 1, nome: "Fascia 1", prezzo: 300, descrizione: "Centraline piccole: cruscotti, body controller, moduli e quadri minori", categorie: ["cruscotto", "carrozzeria"] },
  { n: 2, nome: "Fascia 2", prezzo: 450, descrizione: "Centraline medie: freni EBS e ABS, cambio, sospensioni, idraulica", categorie: ["freni", "cambio", "sospensioni", "idraulica", "altro"] },
  { n: 3, nome: "Fascia 3", prezzo: 600, descrizione: "Centraline motore di camion, bus e macchine movimento terra", categorie: ["motore"] },
];

export function fasceDa(v: unknown): Fascia[] {
  if (!Array.isArray(v) || !v.length) return FASCE_PREDEFINITE;
  const f = v.map((x: Partial<Fascia>, i) => ({
    n: Number(x.n) || i + 1, nome: String(x.nome || `Fascia ${i + 1}`), prezzo: Number(x.prezzo) || 0,
    descrizione: String(x.descrizione || ""), categorie: (Array.isArray(x.categorie) ? x.categorie : []).filter((c): c is Categoria => c in CATEGORIE_CENTRALINA),
  })).filter((x) => x.prezzo > 0);
  return f.length ? f.sort((a, b) => a.prezzo - b.prezzo) : FASCE_PREDEFINITE;
}

/** Riconosce il tipo di centralina da quello che ha trovato la ricerca: prima dal tipo, poi da famiglia e marca. */
const REGOLE: [Categoria, RegExp][] = [
  ["cruscotto", /cruscott|quadro strument|strumentazione|instrument|cluster|tachigraf/],
  ["sospensioni", /sospension|suspension|ecas|livellament/],
  ["cambio", /cambio|trasmission|gearbox|transmission|\btcu\b|opticruise|i-shift|tipmatic|allison|powershift/],
  ["freni", /freni|frenant|brake|\bebs\b|\babs\b|retarder|intarder/],
  ["idraulica", /idraulic|hydraul|\bgru\b|crane|sollevament/],
  ["motore", /motor|engine|\becm\b|\bedc|\bms ?\d|\bmr\b|\bpld\b|\badm\b|\bacm\b|\bdcu\b|\bcm ?\d{3,4}|iniezion|injection|diesel|\bemr\b|common rail/],
  ["carrozzeria", /body|carrozzeria|\bbcm\b|\bvcu\b|\bsam\b|comfort|luci|clima|immobiliz|gateway/],
];
const MARCHE: [Categoria, RegExp][] = [["freni", /knorr|wabco/], ["cambio", /\bzf\b/]];

export function categoriaDa(r: { tipo?: string; famiglia?: string; modello?: string; marca?: string }): Categoria {
  const tipo = (r.tipo ?? "").toLowerCase();
  const tutto = `${tipo} ${r.famiglia ?? ""} ${r.modello ?? ""}`.toLowerCase();
  for (const testo of [tipo, tutto]) for (const [c, re] of REGOLE) if (testo && re.test(testo)) return c;
  const marca = (r.marca ?? "").toLowerCase();
  for (const [c, re] of MARCHE) if (re.test(marca)) return c;
  return "altro";
}

export type PrezzoRiparazione = { base: number; prezzo: number; risparmio: number; fascia: number; nomeFascia: string; categoria: Categoria; da: boolean };

/** Prezzo della riparazione = prezzo della fascia. Il prezzo del nuovo (se c'è) serve solo a mostrare il risparmio. */
export function prezzoFascia(r: { tipo?: string; famiglia?: string; modello?: string; marca?: string }, prezziNuovo: number[], imp: Impostazioni & { fasce?: unknown; prezzo_da?: boolean }): PrezzoRiparazione {
  const fasce = fasceDa(imp.fasce);
  const categoria = categoriaDa(r);
  const f = fasce.find((x) => x.categorie.includes(categoria)) ?? fasce.find((x) => x.categorie.includes("altro")) ?? fasce[Math.floor(fasce.length / 2)];
  const nuovo = calcolaPrezzo(prezziNuovo, imp);
  const base = nuovo?.base ?? 0;
  const risparmio = base > f.prezzo ? Math.round((1 - f.prezzo / base) * 100) : 0;
  return { base: risparmio > 0 ? base : 0, prezzo: f.prezzo, risparmio, fascia: f.n, nomeFascia: f.nome, categoria, da: !!imp.prezzo_da };
}
