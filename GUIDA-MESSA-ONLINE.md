# Lion ECU Officine — come metterla online

Questa è l'app ufficiale per le officine clienti: una **webapp installabile** dal telefono, senza store.

**Cosa fa l'app**

- **Officina:** accesso con Google o con un link via email, registrazione dei dati al primo ingresso, ricerca centralina con AI (prezzo del nuovo e prezzo della riparazione), richiesta di ritiro con foto, stato della riparazione in 6 fasi, pagamento online dopo la diagnosi, garanzie e certificati.
- **Laboratorio** (`/lab`): elenco delle pratiche, cambio di fase, esito della diagnosi, prezzo confermato, note per l'officina, corriere e tracking, impostazioni del prezzo a percentuale, gestione dello staff.

Tempo stimato per la messa online: circa 1-2 ore, seguendo i passi in ordine.

> **Regola d'oro:** le chiavi (Supabase, Anthropic, Stripe) si incollano **solo** nei pannelli di Vercel e Supabase. Mai in chat, email o WhatsApp.

---

## 1. GitHub: dove sta il codice

1. Crea un account su **github.com**, se non ce l'hai.
2. Crea un repository **privato** chiamato `lion-ecu-officine`.
3. Carica il codice. Hai due possibilità:
   - **Consigliata:** collega GitHub a Claude dalle impostazioni dei connettori, e Claude carica il codice e gli aggiornamenti futuri;
   - oppure dal sito di GitHub: «Add file» → «Upload files», trascinando tutto il contenuto della cartella dello zip.

## 2. Supabase: database, accessi e foto

1. Crea un account su **supabase.com** → «New project». Scegli la regione **Frankfurt** (UE) e salva la password del database in un posto sicuro.
2. Vai in **SQL Editor** → «New query», incolla tutto il file `supabase/schema.sql` e premi **Run**.
3. Nella stessa schermata aggiungi te stesso allo staff (con la tua email vera), poi premi **Run**:
   ```sql
   insert into public.staff(email, nome) values ('tua-email@esempio.it', 'Loris');
   ```
4. Vai in **Project Settings → API** e copia, per il passo 5:
   - `Project URL`
   - `anon public`
   - `service_role` (segreta: non deve mai finire nel browser o in chat)

### Accesso con email

Il servizio email di prova di Supabase manda pochissime email e solo agli indirizzi del team. **Prima di aprire l'app alle officine** serve un servizio email vero:

1. Crea un account su un servizio di invio email, per esempio Resend o Brevo, e verifica il dominio.
2. In Supabase vai in **Authentication → Emails → SMTP Settings** e inserisci i dati del servizio.
3. In **Authentication → Emails → Templates** traduci in italiano il testo dell'email «Magic Link».

### Accesso con Google

1. Vai su **console.cloud.google.com** → crea un progetto → «APIs & Services» → «OAuth consent screen». Imposta tipo **External**, con nome app e logo.
2. «Credentials» → «Create credentials» → «OAuth client ID» → tipo **Web application**.
3. In «Authorized redirect URIs» inserisci: `https://<il-tuo-progetto>.supabase.co/auth/v1/callback`
4. Copia Client ID e Client Secret, poi in Supabase vai in **Authentication → Sign In / Providers → Google**, attivalo e incollali.

### Indirizzi consentiti

In Supabase vai in **Authentication → URL Configuration**:

- **Site URL:** `https://app.lionecusystem.it` (o l'indirizzo che userai)
- **Redirect URLs:** aggiungi `https://app.lionecusystem.it/auth/callback` e, per le prove, `https://<nome>.vercel.app/auth/callback`

## 3. Anthropic: l'AI della ricerca centraline

1. Crea un account su **console.anthropic.com**, aggiungi un metodo di pagamento e imposta un **limite di spesa mensile**.
2. «API Keys» → «Create key», poi copiala per il passo 5.
3. Costi: ogni ricerca usa il modello AI più fino a 4 ricerche web. Le ricerche web costano 10 $ ogni 1.000, più i token del modello. L'app tiene in memoria per 14 giorni le ricerche dello stesso codice, così non le ripaga, e limita ogni officina a 30 ricerche al giorno (valore modificabile).

## 4. Stripe: pagamenti

1. In **dashboard.stripe.com** completa l'attivazione dell'account con i dati aziendali.
2. «Developers» → «API keys» → copia la **Secret key** (`sk_live_…`). Per le prove usa prima quella di test (`sk_test_…`).
3. Dopo il passo 5, quando l'app è online: «Developers» → «Webhooks» → «Add endpoint»
   - URL: `https://app.lionecusystem.it/api/stripe/webhook`
   - Evento: `checkout.session.completed`
   - Copia il **Signing secret** (`whsec_…`) e aggiungilo su Vercel come `STRIPE_WEBHOOK_SECRET`.

> Stripe incassa, ma **non emette la fattura elettronica** verso lo SDI. La fattura la emettete con il vostro gestionale, come oggi. Nell'app la fase «Fattura inviata» la imposta il laboratorio.

## 5. Vercel: mettere online l'app

1. Crea un account su **vercel.com** con GitHub. Il piano gratuito è riservato all'uso non commerciale: per un'app aziendale controlla le condizioni e valuta il piano Pro.
2. «Add New» → «Project» → importa `lion-ecu-officine`.
3. In «Environment Variables» inserisci (vedi anche `.env.example`):

| Nome | Valore |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL di Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chiave anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | chiave service_role |
| `NEXT_PUBLIC_SITE_URL` | `https://app.lionecusystem.it` (senza barra finale) |
| `ANTHROPIC_API_KEY` | chiave Anthropic |
| `ANTHROPIC_MODEL` | `claude-sonnet-5-5` |
| `STRIPE_SECRET_KEY` | chiave segreta Stripe |
| `STRIPE_WEBHOOK_SECRET` | signing secret del webhook (passo 4) |
| `LIMITE_RICERCHE_GIORNO` | `30` |

4. Premi **Deploy**.
5. «Settings» → «Domains» → aggiungi `app.lionecusystem.it` e segui le istruzioni per il DNS presso il tuo registrar.
6. La ricerca centralina può durare fino a 1-2 minuti. Se va in timeout, aumenta la durata massima delle funzioni nelle impostazioni del progetto Vercel (dipende dal piano).

## 6. Prima prova, in quest'ordine

1. Apri l'app dal telefono → **Continua con Google** → vieni portato al pannello `/lab`, perché sei staff.
2. Vai in **Impostazioni** e imposta percentuale, minimo e arrotondamento del prezzo.
3. Con un'altra email (un'officina di prova): registrati → **Cerca** un codice (es. `0281020459`) → **Richiedi il ritiro**.
4. Nel pannello `/lab` apri la pratica → fase «Centralina arrivata» → poi «Diagnosi», esito **Riparabile**, prezzo → Salva.
5. Dall'officina di prova: paga con una carta di test Stripe (`4242 4242 4242 4242`, data futura, CVC qualsiasi) → la pratica risulta pagata.
6. Nel pannello: «Reinvio confermato» con corriere e tracking → «Garanzia disponibile» con il guasto riparato → l'officina vede il certificato.

## 7. Prima di aprire alle officine

- [ ] **Informativa privacy** scritta dal consulente, da inserire in `src/app/privacy/page.tsx` (ora c'è un segnaposto).
- [ ] Servizio email (SMTP) configurato su Supabase.
- [ ] Percentuale e minimo del prezzo decisi e inseriti in `/lab/impostazioni`.
- [ ] Stripe in modalità live, con webhook live.
- [ ] Limite di spesa impostato su Anthropic.

## Cosa non c'è ancora (versione 2)

- **Premi e inviti** tra officine.
- **Collegamento con ivot:** WhatsApp automatici a ogni cambio di fase e contatti nel CRM. Dipende dalla risposta dell'assistenza ivot sull'API in ingresso.
- **Foto delle centraline prese dal web:** oggi la scheda mostra i link alle fonti.

## Struttura del codice

```
supabase/schema.sql          database, permessi, trigger (fasi uguali al CRM ivot)
src/app/(officina)/          schermate dell'officina: lavori, cerca, ritiro, pratica, garanzie
src/app/lab/                 pannello del laboratorio
src/app/api/cerca/           ricerca centralina (Claude + ricerca web), cache e limite
src/app/api/pagamento/       crea il pagamento Stripe
src/app/api/stripe/webhook/  conferma il pagamento
src/lib/cerca.ts             istruzioni dell'AI e controllo delle fonti
src/lib/prezzo.ts            prezzo riparazione = percentuale del nuovo
```

**Sicurezza dei prezzi:** l'AI può proporre solo prezzi del nuovo presenti in pagine web realmente trovate dalla ricerca. Ogni prezzo con un link non restituito dalla ricerca viene scartato. Il prezzo della riparazione lo calcola il server con le vostre impostazioni, mai l'AI, e il laboratorio lo conferma dopo la diagnosi.
