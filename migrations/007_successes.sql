-- Types énumérés
create type success_type as enum ('vente_partage', 'dossier_partenaire', 'coup_de_pouce');
create type success_origin as enum ('mardi_presentation', 'mardi_recherche', 'mardi_conseil', 'rencontre_chateau', 'autre');
create type success_stage as enum ('en_cours', 'compromis', 'vente_definitive', 'finalise', 'annule');
create type success_status as enum ('brouillon', 'soumis', 'confirme', 'publie', 'refuse', 'retire');
create type participant_role as enum ('declarant', 'binome', 'partenaire', 'contributeur');
create type confirmation_status as enum ('en_attente', 'confirme', 'correction_demandee', 'refuse');

-- Table principale des réussites
create table successes (
  id uuid primary key default gen_random_uuid(),
  type success_type not null,
  title text not null,
  story text,
  origin success_origin not null default 'autre',
  property_id uuid references shared_properties(id) on delete set null,
  stage success_stage not null default 'en_cours',
  stage_date date,
  photo_url text,
  status success_status not null default 'brouillon',
  featured boolean not null default false,
  admin_note text,
  declared_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Participants liés à une réussite
create table success_participants (
  id uuid primary key default gen_random_uuid(),
  success_id uuid not null references successes(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  partner_id uuid references partners(id) on delete set null,
  role participant_role not null default 'contributeur',
  confirmation_status confirmation_status not null default 'en_attente',
  confirmation_note text,
  publish_consent boolean not null default false,
  anonymized_consent boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Données financières privées par participant
create table success_financials (
  id uuid primary key default gen_random_uuid(),
  success_id uuid not null references successes(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  total_fees numeric,
  share_percent numeric not null default 50,
  calculated_amount numeric,
  actual_amount numeric,
  encashment_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (success_id, user_id)
);

-- Index pour les requêtes fréquentes
create index idx_successes_declared_by on successes(declared_by);
create index idx_successes_status on successes(status);
create index idx_successes_type on successes(type);
create index idx_successes_stage_date on successes(stage_date);
create index idx_success_participants_success on success_participants(success_id);
create index idx_success_participants_user on success_participants(user_id);
create index idx_success_financials_user on success_financials(user_id);

-- RLS
alter table successes enable row level security;
alter table success_participants enable row level security;
alter table success_financials enable row level security;

-- Politiques successes : lecture pour les membres actifs (sauf brouillons des autres)
create policy "successes_select" on successes for select using (
  status in ('soumis', 'confirme', 'publie')
  or declared_by = auth.uid()
  or exists (select 1 from success_participants sp where sp.success_id = id and sp.user_id = auth.uid())
);
create policy "successes_insert" on successes for insert with check (declared_by = auth.uid());
create policy "successes_update" on successes for update using (
  declared_by = auth.uid()
  or exists (select 1 from profiles where id = auth.uid() and 'admin' = any(roles))
);

-- Politiques participants
create policy "participants_select" on success_participants for select using (
  exists (select 1 from successes s where s.id = success_id and (
    s.status in ('soumis', 'confirme', 'publie')
    or s.declared_by = auth.uid()
    or user_id = auth.uid()
  ))
);
create policy "participants_insert" on success_participants for insert with check (
  exists (select 1 from successes s where s.id = success_id and s.declared_by = auth.uid())
);
create policy "participants_update" on success_participants for update using (
  user_id = auth.uid()
  or exists (select 1 from successes s where s.id = success_id and s.declared_by = auth.uid())
);

-- Politiques financials : strictement privé
create policy "financials_select" on success_financials for select using (user_id = auth.uid());
create policy "financials_insert" on success_financials for insert with check (user_id = auth.uid());
create policy "financials_update" on success_financials for update using (user_id = auth.uid());

-- Trigger updated_at
create or replace function update_successes_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger successes_updated_at
  before update on successes
  for each row execute function update_successes_updated_at();

create trigger financials_updated_at
  before update on success_financials
  for each row execute function update_successes_updated_at();
