-- =====================================================================
-- Lion ECU Officine — schema del database (Supabase / Postgres)
-- Da incollare una volta in Supabase → SQL Editor → New query → Run.
-- =====================================================================

-- ---------- Staff del laboratorio ----------
-- Chi è in questa tabella vede tutte le pratiche e il pannello /lab.
create table if not exists public.staff (
  email text primary key,
  nome  text,
  creato_il timestamptz not null default now()
);

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff s where lower(s.email) = lower(auth.jwt() ->> 'email'));
$$;

-- ---------- Officine (clienti) ----------
create table if not exists public.officine (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  ragione_sociale text not null,
  partita_iva text,
  referente text not null,
  telefono text not null,
  email text,
  indirizzo_ritiro text,               -- chiesto al primo ritiro
  citta text,
  consenso_whatsapp boolean not null default false,
  pec text,
  codice_sdi text,
  sede_legale text,
  orari_ritiro text,
  mezzi text[] not null default '{}',
  consenso_privacy_il timestamptz not null default now(),
  creato_il timestamptz not null default now()
);

-- ---------- Gestione commerciale delle officine (solo staff) ----------
create table if not exists public.officine_crm (
  officina_id uuid primary key references public.officine(id) on delete cascade,
  stato text not null default 'nuova' check (stato in ('nuova','contattata','attiva','ferma','persa')),
  note text,
  prossimo_contatto date,
  aggiornato_il timestamptz not null default now()
);

-- ---------- Impostazioni (una riga sola) ----------
create table if not exists public.impostazioni (
  id int primary key default 1 check (id = 1),
  percentuale numeric not null default 0.35,   -- prezzo riparazione = % del nuovo
  minimo_eur numeric not null default 150,
  arrotonda_eur numeric not null default 10,
  base text not null default 'mediana' check (base in ('mediana','minimo','massimo')),
  -- programma punti: 1 € pagato (IVA esclusa) = 1 punto, sugli ultimi fedelta_mesi mesi
  fedelta_mesi int not null default 12,
  soglia_partner_eur numeric not null default 3000,
  sconto_partner numeric not null default 0.10,
  soglia_gold_eur numeric not null default 6000,
  sconto_gold numeric not null default 0.15,
  cambio_usd numeric not null default 0.90,
  cambio_gbp numeric not null default 1.15,
  soglia_anomali numeric not null default 0.40,
  aggiornato_il timestamptz not null default now()
);
insert into public.impostazioni (id) values (1) on conflict do nothing;

-- ---------- Pratiche (una per centralina) ----------
create sequence if not exists public.pratiche_numero_seq;

create table if not exists public.pratiche (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique default ('LES-' || to_char(now(), 'YY') || '-' || lpad(nextval('public.pratiche_numero_seq')::text, 4, '0')),
  officina_id uuid not null references public.officine(id) on delete cascade,
  -- dati inseriti dall'officina
  tipo_mezzo text not null,
  mezzo text not null,
  centralina text,
  codice_etichetta text,
  sintomo text not null,
  codici_errore text,
  indirizzo_ritiro text not null,
  giorno_ritiro text not null,
  fascia_ritiro text not null,
  prezzo_stimato_eur numeric,          -- dalla ricerca centralina, se fatta
  prezzo_nuovo_base_eur numeric,
  foto text[] not null default '{}',   -- percorsi nello storage "foto"
  accetta_preventivo boolean not null default false, -- spunta finale del modulo ritiro
  prezzo_accettato_eur numeric,        -- prezzo accettato dall'officina (null = da confermare dopo diagnosi)
  accettato_il timestamptz,
  -- dati gestiti dal laboratorio
  fase smallint not null default 0 check (fase between 0 and 5),
  esito text check (esito in ('riparabile','non_riparabile')),
  prezzo_confermato_eur numeric,
  pagato boolean not null default false,
  sconto_pct numeric not null default 0,   -- sconto del livello applicato al pagamento
  prezzo_pagato_eur numeric,               -- importo effettivamente pagato (dopo lo sconto)
  pagato_il timestamptz,
  stripe_session_id text,
  nota_laboratorio text,
  guasto_riparato text,
  corriere text,
  tracking text,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);
create index if not exists pratiche_officina_idx on public.pratiche(officina_id, creato_il desc);

-- Fasi (uguali al CRM di ivot):
-- 0 Ritiro prenotato · 1 Centralina arrivata · 2 Diagnosi
-- 3 Reinvio confermato · 4 Garanzia disponibile · 5 Fattura inviata

-- ---------- Storico eventi (timeline) ----------
create table if not exists public.eventi (
  id bigserial primary key,
  pratica_id uuid not null references public.pratiche(id) on delete cascade,
  fase smallint,
  testo text not null,
  creato_il timestamptz not null default now()
);
create index if not exists eventi_pratica_idx on public.eventi(pratica_id, creato_il);

-- ---------- Ricerche centralina (cache e limite giornaliero) ----------
create table if not exists public.ricerche (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  chiave text,                 -- codice normalizzato, per la cache
  risultato jsonb,
  creato_il timestamptz not null default now()
);
create index if not exists ricerche_chiave_idx on public.ricerche(chiave, creato_il desc);
create index if not exists ricerche_user_idx on public.ricerche(user_id, creato_il desc);

-- ---------- Trigger: protezione dei campi del laboratorio ----------
create or replace function public.pratiche_proteggi() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_staff() and coalesce(auth.role(), '') <> 'service_role' then
      new.fase := 0; new.esito := null; new.prezzo_confermato_eur := null;
      new.pagato := false; new.pagato_il := null; new.stripe_session_id := null;
      new.nota_laboratorio := null; new.guasto_riparato := null;
      new.corriere := null; new.tracking := null;
      new.sconto_pct := 0; new.prezzo_pagato_eur := null;
    end if;
    new.accettato_il := case when new.accetta_preventivo then now() else null end;
    if not new.accetta_preventivo then new.prezzo_accettato_eur := null; end if;
    return new;
  end if;
  new.aggiornato_il := now();
  return new;
end $$;
drop trigger if exists pratiche_proteggi on public.pratiche;
create trigger pratiche_proteggi before insert or update on public.pratiche
for each row execute function public.pratiche_proteggi();

-- ---------- Trigger: scrive gli eventi della timeline ----------
create or replace function public.pratiche_eventi() returns trigger
language plpgsql security definer set search_path = public as $$
declare nomi text[] := array['Ritiro prenotato','Centralina arrivata','Diagnosi','Reinvio confermato','Garanzia disponibile','Fattura inviata'];
begin
  if tg_op = 'INSERT' then
    insert into public.eventi(pratica_id, fase, testo) values (new.id, 0, nomi[1]);
  else
    if new.fase is distinct from old.fase then
      insert into public.eventi(pratica_id, fase, testo) values (new.id, new.fase, nomi[new.fase + 1]);
    end if;
    if new.esito is distinct from old.esito and new.esito is not null then
      insert into public.eventi(pratica_id, fase, testo) values (new.id, new.fase,
        case when new.esito = 'riparabile' then 'Diagnosi: centralina riparabile' else 'Diagnosi: non riparabile, rispedizione gratuita' end);
    end if;
    if new.pagato and not old.pagato then
      insert into public.eventi(pratica_id, fase, testo) values (new.id, new.fase, 'Pagamento ricevuto');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists pratiche_eventi on public.pratiche;
create trigger pratiche_eventi after insert or update on public.pratiche
for each row execute function public.pratiche_eventi();

-- ---------- Permessi (Row Level Security) ----------
alter table public.staff enable row level security;
alter table public.officine enable row level security;
alter table public.impostazioni enable row level security;
alter table public.pratiche enable row level security;
alter table public.eventi enable row level security;
alter table public.ricerche enable row level security;

-- staff: solo lo staff vede l'elenco
drop policy if exists staff_select on public.staff;
create policy staff_select on public.staff for select using (public.is_staff());
drop policy if exists staff_insert on public.staff;
create policy staff_insert on public.staff for insert with check (public.is_staff());
drop policy if exists staff_delete on public.staff;
create policy staff_delete on public.staff for delete using (public.is_staff() and lower(email) <> lower(auth.jwt() ->> 'email'));

-- officine: ognuno la sua, lo staff tutte
drop policy if exists officine_select on public.officine;
create policy officine_select on public.officine for select using (owner_id = auth.uid() or public.is_staff());
drop policy if exists officine_insert on public.officine;
create policy officine_insert on public.officine for insert with check (owner_id = auth.uid());
drop policy if exists officine_update on public.officine;
create policy officine_update on public.officine for update using (owner_id = auth.uid() or public.is_staff());

-- impostazioni: lettura per chi è dentro, modifica solo staff
drop policy if exists impostazioni_select on public.impostazioni;
create policy impostazioni_select on public.impostazioni for select using (auth.uid() is not null);
drop policy if exists impostazioni_update on public.impostazioni;
create policy impostazioni_update on public.impostazioni for update using (public.is_staff());

-- pratiche: l'officina vede e crea le sue, lo staff vede e modifica tutto
drop policy if exists pratiche_select on public.pratiche;
create policy pratiche_select on public.pratiche for select using (
  public.is_staff() or officina_id in (select id from public.officine where owner_id = auth.uid()));
drop policy if exists pratiche_insert on public.pratiche;
create policy pratiche_insert on public.pratiche for insert with check (
  officina_id in (select id from public.officine where owner_id = auth.uid()));
drop policy if exists pratiche_update on public.pratiche;
create policy pratiche_update on public.pratiche for update using (public.is_staff());

-- eventi: lettura come le pratiche, scrittura solo dai trigger
drop policy if exists eventi_select on public.eventi;
create policy eventi_select on public.eventi for select using (
  public.is_staff() or pratica_id in (
    select p.id from public.pratiche p join public.officine o on o.id = p.officina_id where o.owner_id = auth.uid()));

-- officine_crm: solo staff (note interne, l'officina non le vede)
alter table public.officine_crm enable row level security;
drop policy if exists officine_crm_staff_select on public.officine_crm;
create policy officine_crm_staff_select on public.officine_crm for select using (public.is_staff());
drop policy if exists officine_crm_staff_insert on public.officine_crm;
create policy officine_crm_staff_insert on public.officine_crm for insert with check (public.is_staff());
drop policy if exists officine_crm_staff_update on public.officine_crm;
create policy officine_crm_staff_update on public.officine_crm for update using (public.is_staff());

-- ricerche: nessun accesso dal browser (solo server)

-- ---------- Storage foto ----------
insert into storage.buckets (id, name, public) values ('foto', 'foto', false) on conflict do nothing;
drop policy if exists foto_insert on storage.objects;
create policy foto_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'foto' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists foto_select on storage.objects;
create policy foto_select on storage.objects for select to authenticated
  using (bucket_id = 'foto' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));

-- ---------- Funzioni non richiamabili dall'esterno ----------
revoke execute on function public.pratiche_proteggi() from public, anon, authenticated;
revoke execute on function public.pratiche_eventi() from public, anon, authenticated;
revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- ---------- Primo membro dello staff ----------
-- Sostituisci con l'email con cui entri tu nell'app, poi esegui:
-- insert into public.staff(email, nome) values ('tua-email@esempio.it', 'Loris');

-- ---------- Prezzi di riferimento (prezzo del nuovo originale per codice) ----------
create table if not exists public.prezzi_riferimento (
  id bigserial primary key,
  codici text[] not null,
  descrizione text,
  prezzo_eur numeric not null check (prezzo_eur > 0),
  valuta text not null default 'EUR',
  prezzo_originale numeric,
  fonte_nome text,
  fonte_url text,
  origine text not null default 'ricerca' check (origine in ('ricerca','laboratorio')),
  attivo boolean not null default true,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);
create index if not exists prezzi_riferimento_codici_idx on public.prezzi_riferimento using gin (codici);
create index if not exists prezzi_riferimento_url_idx on public.prezzi_riferimento (fonte_url);

-- ---------- Negozi di ricambi consultati per primi dalla ricerca ----------
create table if not exists public.fonti_preferite (
  dominio text primary key,
  categoria text not null,
  nota text,
  attivo boolean not null default true,
  creato_il timestamptz not null default now()
);

alter table public.prezzi_riferimento enable row level security;
alter table public.fonti_preferite enable row level security;
create policy prezzi_rif_staff on public.prezzi_riferimento for all using (public.is_staff()) with check (public.is_staff());
create policy fonti_pref_staff on public.fonti_preferite for all using (public.is_staff()) with check (public.is_staff());

-- =====================================================================
-- Aggiunte: staff con ruoli, notifiche, messaggi, relazioni dei tecnici
-- =====================================================================
alter table public.staff add column if not exists ruolo text not null default 'tecnico' check (ruolo in ('admin','tecnico'));
alter table public.staff add column if not exists attivo boolean not null default false;   -- in attesa finché un admin non approva
alter table public.staff add column if not exists telefono text;
alter table public.staff add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.staff add column if not exists letto_fino timestamptz not null default now();

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff s where lower(s.email) = lower(auth.jwt() ->> 'email') and s.attivo);
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff s where lower(s.email) = lower(auth.jwt() ->> 'email') and s.attivo and s.ruolo = 'admin');
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
alter policy staff_insert on public.staff with check (public.is_admin());
drop policy if exists staff_update on public.staff;
create policy staff_update on public.staff for update using (public.is_admin());
alter policy staff_delete on public.staff using (public.is_admin() and lower(email) <> lower(auth.jwt() ->> 'email'));
alter policy staff_select on public.staff using (public.is_staff() or lower(email) = lower(auth.jwt() ->> 'email'));

create table if not exists public.notifiche (
  id bigserial primary key,
  per_ruolo text not null default 'tutti' check (per_ruolo in ('tutti','tecnico','admin')),
  tipo text not null, titolo text not null, testo text, link text,
  pratica_id uuid references public.pratiche(id) on delete cascade,
  creato_il timestamptz not null default now()
);
alter table public.notifiche enable row level security;
drop policy if exists notifiche_select on public.notifiche;
create policy notifiche_select on public.notifiche for select using (public.is_admin() or (public.is_staff() and per_ruolo in ('tutti','tecnico')));

create table if not exists public.push_iscrizioni (          -- solo server
  endpoint text primary key, email text not null, p256dh text not null, auth text not null,
  creato_il timestamptz not null default now()
);
alter table public.push_iscrizioni enable row level security;

create table if not exists public.messaggi (
  id bigserial primary key,
  pratica_id uuid references public.pratiche(id) on delete cascade,
  officina_id uuid not null references public.officine(id) on delete cascade,
  canale text not null default 'whatsapp' check (canale in ('whatsapp','email','sms')),
  destinatario text not null, tipo text not null, testo text not null,
  stato text not null default 'da_inviare' check (stato in ('da_inviare','inviato','inviato_a_mano','errore','senza_consenso')),
  creato_da text, creato_il timestamptz not null default now(), inviato_il timestamptz
);
alter table public.messaggi enable row level security;
drop policy if exists messaggi_staff_select on public.messaggi;
create policy messaggi_staff_select on public.messaggi for select using (public.is_staff());
drop policy if exists messaggi_staff_insert on public.messaggi;
create policy messaggi_staff_insert on public.messaggi for insert with check (public.is_staff());
drop policy if exists messaggi_staff_update on public.messaggi;
create policy messaggi_staff_update on public.messaggi for update using (public.is_staff());

create table if not exists public.interventi (                -- banca dati riparazioni (solo staff)
  pratica_id uuid primary key references public.pratiche(id) on delete cascade,
  testo_tecnico text not null, audio_path text, tecnico text, struttura jsonb,
  centralina text, codice text, tipo_mezzo text,
  creato_il timestamptz not null default now(), aggiornato_il timestamptz not null default now()
);
alter table public.interventi enable row level security;
drop policy if exists interventi_staff_select on public.interventi;
create policy interventi_staff_select on public.interventi for select using (public.is_staff());
drop policy if exists interventi_staff_insert on public.interventi;
create policy interventi_staff_insert on public.interventi for insert with check (public.is_staff());
drop policy if exists interventi_staff_update on public.interventi;
create policy interventi_staff_update on public.interventi for update using (public.is_staff());

alter table public.pratiche add column if not exists certificato jsonb;   -- dati del certificato visibili all'officina

insert into storage.buckets (id, name, public) values ('audio', 'audio', false) on conflict do nothing;
drop policy if exists audio_staff_insert on storage.objects;
create policy audio_staff_insert on storage.objects for insert to authenticated with check (bucket_id = 'audio' and public.is_staff());
drop policy if exists audio_staff_select on storage.objects;
create policy audio_staff_select on storage.objects for select to authenticated using (bucket_id = 'audio' and public.is_staff());
-- Nota: in pratiche_proteggi() l'officina non può impostare sconto_pct, prezzo_pagato_eur e certificato.

-- =====================================================================
-- Super admin (titolare) e finanza
-- =====================================================================
alter table public.staff drop constraint if exists staff_ruolo_check;
alter table public.staff add constraint staff_ruolo_check check (ruolo in ('titolare','admin','tecnico'));
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff s where lower(s.email) = lower(auth.jwt() ->> 'email') and s.attivo and s.ruolo in ('admin','titolare'));
$$;
create or replace function public.is_titolare() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff s where lower(s.email) = lower(auth.jwt() ->> 'email') and s.attivo and s.ruolo = 'titolare');
$$;
revoke execute on function public.is_titolare() from public, anon;
grant execute on function public.is_titolare() to authenticated;

create table if not exists public.impostazioni_finanza (
  id int primary key default 1 check (id = 1),
  corriere_per_pratica numeric not null default 15, materiali_per_pratica numeric not null default 30,
  iva_vendite numeric not null default 0.22, iva_costi_variabili numeric not null default 0.22,
  commissione_pct numeric not null default 0.015, commissione_fissa numeric not null default 0.25,
  aliquota_tasse numeric not null default 0.279, mesi_cliente numeric not null default 12, quota_cac numeric not null default 0.33,
  aggiornato_il timestamptz not null default now()
);
insert into public.impostazioni_finanza (id) values (1) on conflict do nothing;
create table if not exists public.costi_ricorrenti (
  id bigserial primary key, nome text not null,
  categoria text not null check (categoria in ('operai','affitto_utenze','commercialista','software','pubblicita','assicurazioni','altro')),
  importo_mensile numeric not null check (importo_mensile >= 0), iva numeric not null default 0,
  dal date not null default date_trunc('month', now())::date, al date, attivo boolean not null default true,
  creato_il timestamptz not null default now()
);
create table if not exists public.costi (
  id bigserial primary key, data date not null default current_date,
  categoria text not null check (categoria in ('operai','affitto_utenze','commercialista','software','pubblicita','assicurazioni','corriere','materiali','attrezzature','altro')),
  descrizione text not null, importo numeric not null check (importo >= 0), iva numeric not null default 0.22,
  creato_il timestamptz not null default now()
);
create table if not exists public.beni_ammortizzabili (
  id bigserial primary key, nome text not null, costo numeric not null check (costo > 0), anni numeric not null check (anni > 0),
  acquistato_il date not null default current_date, creato_il timestamptz not null default now()
);
alter table public.impostazioni_finanza enable row level security;
alter table public.costi_ricorrenti enable row level security;
alter table public.costi enable row level security;
alter table public.beni_ammortizzabili enable row level security;
drop policy if exists fin_imp_all on public.impostazioni_finanza;
create policy fin_imp_all on public.impostazioni_finanza for all using (public.is_titolare()) with check (public.is_titolare());
drop policy if exists fin_cr_all on public.costi_ricorrenti;
create policy fin_cr_all on public.costi_ricorrenti for all using (public.is_titolare()) with check (public.is_titolare());
drop policy if exists fin_c_all on public.costi;
create policy fin_c_all on public.costi for all using (public.is_titolare()) with check (public.is_titolare());
drop policy if exists fin_b_all on public.beni_ammortizzabili;
create policy fin_b_all on public.beni_ammortizzabili for all using (public.is_titolare()) with check (public.is_titolare());

-- =====================================================================
-- Sito pubblico: lead del quiz, catalogo centraline, guide, candidature
-- (le letture pubbliche passano dal server con filtro stato = 'pubblicata')
-- =====================================================================
create table if not exists public.lead (
  id bigserial primary key, nome_officina text not null, nome text not null, telefono text not null, email text not null,
  provincia text, risposte jsonb not null default '{}', score int not null default 0, origine text, utm jsonb,
  officina_id uuid references public.officine(id) on delete set null, creato_il timestamptz not null default now()
);
alter table public.lead enable row level security;
alter table public.officine add column if not exists score int;
create table if not exists public.pagine_centraline (
  slug text primary key, titolo text not null, codice text, marca text, famiglia text, tipo text,
  veicoli text[] not null default '{}', mezzi text[] not null default '{}', descrizione text,
  guasti jsonb not null default '[]', faq jsonb not null default '[]', prezzo_da numeric, prezzo_nuovo numeric,
  stato text not null default 'bozza' check (stato in ('bozza','pubblicata')), ricerca_chiave text,
  creato_il timestamptz not null default now(), aggiornato_il timestamptz not null default now()
);
alter table public.pagine_centraline enable row level security;
create table if not exists public.articoli (
  slug text primary key, titolo text not null, sommario text, corpo text not null, categoria text,
  centralina_slug text references public.pagine_centraline(slug) on delete set null,
  stato text not null default 'bozza' check (stato in ('bozza','pubblicata')), pubblicato_il timestamptz,
  creato_il timestamptz not null default now(), aggiornato_il timestamptz not null default now()
);
alter table public.articoli enable row level security;
create table if not exists public.candidature (
  id bigserial primary key, nome text not null, email text not null, telefono text, ruolo text not null, messaggio text,
  creato_il timestamptz not null default now()
);
alter table public.candidature enable row level security;
-- policy: vedi la migrazione «sito_contenuti_lead» (staff legge lead; admin gestisce pagine e articoli; admin legge candidature)
