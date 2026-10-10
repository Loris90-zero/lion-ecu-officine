/**
 * Configurazione del sito pubblico eculion.it.
 * BASE: oggi il sito vive sotto /sito (anteprima su vercel.app). Quando colleghiamo il dominio
 * si imposta NEXT_PUBLIC_SITO_BASE="" e il middleware serve il sito alla radice di eculion.it.
 */
export const BASE = process.env.NEXT_PUBLIC_SITO_BASE ?? "/sito";
export const APP = process.env.NEXT_PUBLIC_APP_URL ?? "";          // es. https://app.eculion.it (vuoto = stesso dominio)
export const SITO_URL = process.env.NEXT_PUBLIC_SITO_URL ?? "https://eculion.it";

export const u = (path = "/") => (path === "/" ? BASE || "/" : `${BASE}${path}`);
export const app = (path = "/accedi") => `${APP}${path}`;

/** Contatti: null = non ancora deciso, la voce non compare. Da completare (vedi DA-COLLEGARE.md). */
export const CONTATTI = {
  telefono: null as string | null,       // es. "+39 085 …"
  whatsapp: null as string | null,       // solo cifre con prefisso, es. "39333…"
  email: null as string | null,          // es. "info@eculion.it"
  citta: "Montesilvano (PE)",
  indirizzo: null as string | null,
  ragioneSociale: null as string | null,
  partitaIva: null as string | null,
};

export type Mezzo = { slug: string; nome: string; plurale: string; intro: string; centraline: string[]; guasti: string[] };

export const MEZZI: Mezzo[] = [
  { slug: "camion", nome: "Camion", plurale: "camion e trattori stradali", intro: "Centraline motore, cambio automatizzato, freni EBS e sospensioni pneumatiche di camion e trattori stradali.", centraline: ["Centralina motore (ECU)", "Cambio automatizzato (TCU)", "Freni EBS e ABS", "Sospensioni pneumatiche (ECAS)", "Retarder", "Cruscotto e body controller"], guasti: ["Il mezzo va in recovery sotto carico", "Nessuna comunicazione con la diagnosi", "Spie freni o EBS accese", "Il cambio non innesta o resta in folle"] },
  { slug: "bus", nome: "Bus", plurale: "autobus e pullman", intro: "Elettronica di autobus urbani e pullman turistici: motore, cambio, porte, climatizzazione e freni.", centraline: ["Centralina motore (ECU)", "Cambio automatico", "Freni EBS e ABS", "Gestione porte", "Climatizzazione", "Body controller"], guasti: ["Errori intermittenti sulla rete CAN", "Porte che non rispondono", "Riduzione di potenza", "Spie freni accese"] },
  { slug: "gru", nome: "Gru", plurale: "gru e autogru", intro: "Centraline di gru su autocarro e autogru: limitatori di carico, radiocomandi e gestione idraulica.", centraline: ["Limitatore di carico", "Gestione idraulica", "Ricevitore radiocomando", "Centralina motore del carro"], guasti: ["Blocchi di sicurezza senza motivo", "Movimenti non disponibili", "Errori del limitatore di carico"] },
  { slug: "movimento-terra", nome: "Movimento terra", plurale: "escavatori, pale e macchine movimento terra", intro: "Elettronica di escavatori, pale gommate, terne e dumper: motore, idraulica e cabina.", centraline: ["Centralina motore (ECU)", "Centralina idraulica", "Display e cabina", "Joystick e comandi"], guasti: ["La macchina perde potenza", "Comandi idraulici che non rispondono", "Display spento o con errori"] },
  { slug: "agricole", nome: "Macchine agricole", plurale: "trattori e macchine agricole", intro: "Centraline di trattori, mietitrebbie e semoventi: motore, trasmissione, sollevatore e attrezzi.", centraline: ["Centralina motore (ECU)", "Trasmissione", "Sollevatore elettronico", "Display e terminali"], guasti: ["Trasmissione in emergenza", "Sollevatore che non risponde", "Riduzione di potenza"] },
  { slug: "barche", nome: "Barche", plurale: "barche e motori marini", intro: "Centraline di motori marini entrobordo e fuoribordo e dell'elettronica di bordo.", centraline: ["Centralina motore marino", "Comandi elettronici", "Gestione trasmissione"], guasti: ["Il motore non sale di giri", "Allarmi sul pannello", "Comandi che non rispondono"] },
  { slug: "industriali", nome: "Macchine industriali", plurale: "macchine e motori industriali", intro: "Centraline di gruppi elettrogeni, motopompe, carrelli elevatori e motori industriali.", centraline: ["Centralina motore industriale", "Controller del gruppo elettrogeno", "Gestione carrello elevatore"], guasti: ["Arresti di sicurezza ripetuti", "Il motore non parte", "Letture dei sensori sbagliate"] },
];

export const NAV = [
  { href: "/officine", nome: "Per le officine" },
  { href: "/centraline", nome: "Centraline" },
  { href: "/guasti", nome: "Guasti e guide" },
  { href: "/garanzia", nome: "Garanzia" },
  { href: "/chi-siamo", nome: "Chi siamo" },
  { href: "/contatti", nome: "Contatti" },
];

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
