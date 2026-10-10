export type Officina = {
  id: string; owner_id: string; ragione_sociale: string; partita_iva: string | null;
  referente: string; telefono: string; email: string | null; indirizzo_ritiro: string | null;
  citta: string | null; consenso_whatsapp: boolean; creato_il: string;
  pec: string | null; codice_sdi: string | null; sede_legale: string | null; orari_ritiro: string | null; mezzi: string[];
};

export type Pratica = {
  id: string; numero: string; officina_id: string;
  tipo_mezzo: string; mezzo: string; centralina: string | null; codice_etichetta: string | null;
  sintomo: string; codici_errore: string | null; indirizzo_ritiro: string; giorno_ritiro: string; fascia_ritiro: string;
  prezzo_stimato_eur: number | null; prezzo_nuovo_base_eur: number | null; foto: string[];
  accetta_preventivo: boolean; prezzo_accettato_eur: number | null; accettato_il: string | null;
  sconto_pct: number; prezzo_pagato_eur: number | null;
  certificato: { guasto: string; testo: string; interventi: string[]; componenti: string[]; collaudo: string; tecnico: string } | null;
  fase: number; esito: "riparabile" | "non_riparabile" | null; prezzo_confermato_eur: number | null;
  pagato: boolean; pagato_il: string | null; stripe_session_id: string | null;
  nota_laboratorio: string | null; guasto_riparato: string | null; corriere: string | null; tracking: string | null;
  creato_il: string; aggiornato_il: string;
};

export type Evento = { id: number; pratica_id: string; fase: number | null; testo: string; creato_il: string };

export type RisultatoCerca = {
  trovata: boolean;
  marca?: string; modello?: string; tipo?: string; famiglia?: string;
  codici: string[]; veicoli: string[];
  dati_tecnici: { voce: string; valore: string }[];
  problemi_comuni: { problema: string; sintomi?: string }[];
  prezzi_nuova: { prezzo_eur: number; listino_eur?: number | null; venditore?: string; url: string; valuta?: string; prezzo_originale?: number }[];
  altri_prezzi: { prezzo_eur: number; condizione?: string; venditore?: string; url: string; valuta?: string; prezzo_originale?: number }[];
  fonti: { titolo?: string; url: string }[];
  note?: string;
  prezzo?: { base: number; prezzo: number; risparmio: number } | null;
  dallaCache?: boolean;
  v?: number;
  generico?: boolean;
  baseDa?: "laboratorio" | "ricerca" | null;
  baseFonte?: { nome?: string | null; url?: string | null } | null;
};
