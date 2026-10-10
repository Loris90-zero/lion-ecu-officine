# EcuLion — checklist: cosa manca da collegare

Ultimo step, dopo aver finito l'app. Aggiornata ad ogni modifica.

## Da costruire nell'app (prima del collegamento)
- [ ] **Score del cliente** nella sezione Clienti (quiz + comportamento: pratiche, spesa, frequenza, apertura app)
- [ ] **Notifica di score alto al venditore** assegnato all'officina
- [ ] **Area venditori** con dashboard personale: le sue officine, chi chiamare, score, provvigioni (50 € per cliente attivato + 5% sui lavori, da confermare)

## Sito eculion.it
- [ ] **Comprare il dominio** eculion.it (dati della società) e collegarlo a Vercel: eculion.it → sito, app.eculion.it → app
- [ ] Su Vercel: `NEXT_PUBLIC_SITO_BASE=""`, `NEXT_PUBLIC_SITO_URL=https://eculion.it`, `NEXT_PUBLIC_APP_URL=https://app.eculion.it` (così il sito va alla radice e Google lo indicizza)
- [ ] **Banner cookie** e consenso prima del pixel Meta
- [ ] **Contatti veri** in `src/sito/config.ts`: telefono, WhatsApp, email, indirizzo, ragione sociale, P.IVA
- [ ] **Foto e video veri** del laboratorio (pagina Chi siamo e home)
- [ ] Prime **10-20 pagine del catalogo** (dal pannello Laboratorio → Sito) e prime guide, controllate a mano prima di pubblicarle
- [ ] Google Search Console + invio della sitemap
- [ ] Versioni in inglese, tedesco e rumeno
- [ ] Mappa delle officine partner per camionisti, quando ci sono i primi partner

## Account e chiavi (le inserisce Loris su Vercel/Supabase, mai in chat)
- [ ] **Dominio ufficiale** (es. app.eculion.it) su Vercel + Site URL e Redirect URL in Supabase
- [ ] **Resend**: email automatiche dal dominio (accesso, benvenuto, fasi, diagnosi, garanzia) + SMTP in Supabase
- [ ] **Stripe**: chiavi + webhook, addebito **prezzo + IVA 22%**, verificare commissione reale nei Parametri finanza
- [ ] **Login con Google** (Google Cloud + Supabase)
- [ ] **Informativa privacy** dal consulente (`src/app/privacy/page.tsx`)
- [ ] **Qonto**: chiave API, conti secondari (IVA, Tasse, Spese fisse, Stipendi), accantonamenti giornalieri automatici (prima in prova, saldo minimo, tetto giornaliero), movimenti reali nella dashboard, bonifici abbinati alle pratiche

## Comunicazione e marketing
- [ ] **WhatsApp ufficiale** (Bird o API Meta, numero dedicato): i messaggi delle fasi partono da soli (oggi: un tocco dal telefono del tecnico)
- [ ] **ivot**: risposta dell'assistenza su API/webhook e ads (messaggio già pronto)
- [ ] **Agente AI su tutti i canali**: email, WhatsApp, Messenger, Direct, commenti + pannello Conversazioni
- [ ] Connettori: **Bird, Metricool, Canva, Descript, Adspirer**
- [ ] **Landing con quiz** e punteggio lead (punteggio nel pannello Officine e in «Da chiamare»)
- [ ] **Pixel Meta + Conversions API**
- [ ] **Spesa pubblicitaria automatica** da Meta/Google nella dashboard finanza
- [ ] **Riepilogo mattutino** automatico a Loris

## Laboratorio
- [ ] **Corriere automatico** (BRT/GLS/SDA o Sendcloud/Packlink): prenotazione + tracking (oggi manuale)
- [ ] **Spartizione automatica dei lavori** tra i tecnici
- [ ] Banca dati interventi usata dalla ricerca centraline (casi simili già riparati)
- [ ] Negozi preferiti per gru e macchine industriali (fornitori di Loris)

## Brand
- [ ] **Logo definitivo** (bozze A–E sulla tavola) e nome EcuLion in tutta l'app (oggi «Lion ECU System»)

## Più avanti
- [ ] **Software di contabilità** collegato (fatture SDI attive e passive, partendo dal servizio di fatturazione che usate)
- [ ] Premi e inviti tra officine
