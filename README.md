# Lion ECU Officine

Webapp per le officine clienti di Lion ECU System: ricerca centraline con AI, ritiro gratuito, stato delle riparazioni, pagamento dopo la diagnosi, garanzie. Include il pannello del laboratorio in `/lab`.

Stack: Next.js 15, Supabase (database, accesso, foto), Anthropic Claude con ricerca web, Stripe.

**Per metterla online leggi `GUIDA-MESSA-ONLINE.md`.**

In locale: copia `.env.example` in `.env.local`, compila le chiavi, poi `npm install` e `npm run dev`.
