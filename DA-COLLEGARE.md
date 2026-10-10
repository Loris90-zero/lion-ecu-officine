# EcuLion — checklist: cosa manca da collegare

Ultimo step, dopo aver finito l'app. Aggiornata ad ogni modifica.

## Da costruire nell'app (prima del collegamento)
- [ ] **Score del cliente** nella sezione Clienti (quiz + comportamento: pratiche, spesa, frequenza, apertura app)
- [ ] **Notifica di score alto al venditore** assegnato all'officina
- [ ] **Area venditori** con dashboard personale: le sue officine, chi chiamare, score, provvigioni (50 € per cliente attivato + 5% sui lavori, da confermare)
- [ ] **Ads automatiche**: libreria creatività per target (Claude scrive i ganci, Canva/Descript fanno grafiche e video), test a budget piccolo, regole giornaliere sui numeri veri (vincenti +20% di budget, perdenti in pausa, nuove varianti delle migliori), tetto giornaliero e mensile, pulsante «ferma tutto», storico azioni + notifica. Da decidere: costo per ritiro massimo (quello della Finanza?), tetto mensile, approvazione creatività, aumenti automatici o con «Approva»
- [ ] Listino riparazioni per famiglia di centralina (al posto della % sul nuovo): da decidere

## Sito eculion.it
- [ ] **Comprare il dominio** eculion.it (dati della società) e collegarlo a Vercel: eculion.it → sito, app.eculion.it → app
- [ ] Su Vercel: `NEXT_PUBLIC_SITO_BASE=""`, `NEXT_PUBLIC_SITO_URL=https://eculion.it`, `NEXT_PUBLIC_APP_URL=https://app.eculion.it` (così il sito va alla radice e Google lo indicizza)
- [ ] **Banner cookie** e consenso prima del pixel Meta
- [ ] **Contatti veri** in `src/sito/config.ts`: telefono, WhatsApp, email, indirizzo, ragione sociale, P.IVA
- [ ] **Foto e video veri** del laboratorio e di Alex al banco prova (home e Chi siamo)
- [ ] **Caso vero** per il confronto in home (prezzo del nuovo e prezzo EcuLion di una centralina reale) al posto dell'esempio 1.500/500
- [ ] Due righe in più su Alex (provenienza, specialità) per la sezione «Chi ripara»
- [ ] Ricerca dal sito: valutare i limiti (oggi 5 al giorno per visitatore, 150 al giorno in tutto) e una protezione anti-bot se servirà
- [ ] Prime **10-20 pagine del catalogo** (dal pannello Laboratorio → Sito) e prime guide, controllate a mano prima di pubblicarle
- [ ] Google Search Console e **Bing Webmaster Tools** + invio della sitemap
- [ ] Redirect 301 dell'indirizzo di prova lion-ecu-officine.vercel.app verso eculion.it (Bing lo aveva già indicizzato) e togliere il «noindex» dal dominio vero
- [ ] Versioni in inglese, tedesco e rumeno
- [ ] Mappa delle officine partner per camionisti, quando ci sono i primi partner

## Account e chiavi (le inserisce Loris su Vercel/Supabase, mai in chat)
- [ ] **Dominio ufficiale** (es. app.eculion.it) su Vercel + Site URL e Redirect URL in Supabase
- [ ] **Resend**: email automatiche dal dominio (accesso, benvenuto, fasi, diagnosi, garanzia) + SMTP in Supabase
- [ ] **Stripe**: chiavi + webhook, addebito **prezzo + IVA 22%**, verificare commissione reale nei Parametri finanza
- [ ] **Login con Google** (Google Cloud + Supabase): è il modo più semplice per i meccanici, lo usa il passo finale del questionario
- [ ] Email di accesso in italiano con anche il **codice a 6 cifre** (Supabase → Email templates): su iPhone l'app installata non si apre dal link, serve il codice
- [ ] **Informativa privacy** dal consulente (`src/app/privacy/page.tsx`)
- [ ] **Qonto**: chiave API, conti secondari (IVA, Tasse, Spese fisse, Stipendi), accantonamenti giornalieri automatici (prima in prova, saldo minimo, tetto giornaliero), movimenti reali nella dashboard, bonifici abbinati alle pratiche

## Comunicazione e marketing
- [ ] **WhatsApp ufficiale** (Bird o API Meta, numero dedicato): i messaggi delle fasi partono da soli (oggi: un tocco dal telefono del tecnico)
- [ ] **ivot**: risposta dell'assistenza su API/webhook e ads (messaggio già pronto)
- [ ] **Agente AI su tutti i canali**: email, WhatsApp, Messenger, Direct, commenti + pannello Conversazioni
- [ ] Connettori: **MCP ufficiale Meta Ads** (mcp.facebook.com/ads, in beta) per creare le campagne + **API Marketing di Meta** (chiave fissa della Business Manager) per le regole di budget; **Adspirer** solo se serve per Google e TikTok; **Bird, Metricool, Canva, Descript**
- [ ] **Landing con quiz** e punteggio lead (punteggio nel pannello Officine e in «Da chiamare»)
- [ ] **Pixel Meta + Conversions API**
- [ ] **Spesa ads automatica** (Meta API/MCP, ed eventualmente Adspirer → tabella `marketing_spesa`): ogni mattina un'attività programmata di Claude legge Meta/Google/TikTok e scrive spesa, click e impression per campagna e target. Poi far leggere la stessa spesa anche alla Finanza (oggi la Finanza usa i costi «Pubblicità» inseriti a mano: attenzione a non contarla due volte)
- [ ] **Link degli annunci con UTM e target**: `?utm_source=meta&utm_medium=paid&utm_campaign=NOME&t=officine|flotte|partner`
- [x] Riepilogo mattutino a Loris (cron Vercel alle 6:00 UTC, push solo al titolare). Facoltativo: `CRON_SECRET` su Vercel
- [ ] **Metricool**: pubblica i post del calendario Social (`social_post`) e riporta like/commenti/visualizzazioni in `risultati`
- [ ] **Canva** (grafiche) e **Descript** (montaggio video) per le bozze del calendario
- [ ] **WhatsApp Business API**: contare i messaggi veri ricevuti per sorgente (oggi si contano i click sul pulsante WhatsApp)
- [ ] **Prospezione AI**: Resend con `RESEND_API_KEY`, `EMAIL_MITTENTE` (es. «Loris di EcuLion <loris@eculion.it>»), `EMAIL_RISPOSTE`; dominio verificato (SPF/DKIM) e meglio un sottodominio dedicato agli invii commerciali; risposte ed aperture via webhook Resend → `prospect_attivita`
- [ ] **Verifica legale prima degli invii**: email commerciali e chiamate a freddo verso aziende (art. 130 Codice Privacy, GDPR, Registro Pubblico delle Opposizioni) con consulente privacy/avvocato
- [ ] **Agente telefonico AI**: Vapi o Retell AI + numero italiano, `VOICE_API_KEY`, copione da scrivere insieme, webhook esiti → `prospect_attivita` (tipo «chiamata»); usi: richiamare contatti caldi, rispondere fuori orario, seguire la prospezione, ricordare i ritiri
- [ ] Google Search Console nel Marketing (dopo il dominio)

## Laboratorio
- [ ] **Corriere automatico** (BRT/GLS/SDA o Sendcloud/Packlink): prenotazione + tracking (oggi manuale)
- [ ] **Spartizione automatica dei lavori** tra i tecnici
- [ ] Banca dati interventi usata dalla ricerca centraline (casi simili già riparati)
- [ ] Negozi preferiti per gru e macchine industriali (fornitori di Loris)

## Brand
- [x] Logo EcuLion di Loris (L gialla con il leone) in app, laboratorio, super admin e sito; icone e colori giallo/nero
- [ ] File vettoriali del logo (SVG o PDF) per stampa e massima nitidezza

## Più avanti
- [ ] **Software di contabilità** collegato (fatture SDI attive e passive, partendo dal servizio di fatturazione che usate)
- [ ] Premi e inviti tra officine
