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

-- ---------- Impostazioni (una riga sola) ----------
create table if not exists public.impostazioni (
  id int primary key default 1 check (id = 1),
  percentuale numeric not null default 0.35,   -- prezzo riparazione = % del nuovo
  minimo_eur numeric not null default 150,
  arrotonda_eur numeric not null default 10,
  base text not null default 'mediana' check (base in ('mediana','minimo','massimo')),
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
