export type Impostazioni = {
  percentuale: number;
  minimo_eur: number;
  arrotonda_eur: number;
  base: "mediana" | "minimo" | "massimo";
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
