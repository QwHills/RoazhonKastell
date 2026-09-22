-- ============================================================
-- Roazhon Kastell — Schéma de base de données
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- Extension pour générer des UUID
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────
-- ENUM types
-- ──────────────────────────────────────────────

create type user_role as enum (
  'adherent',
  'partenaire',
  'gestionnaire_membres',   -- Gianni
  'gestionnaire_evenements', -- Julien
  'associe',
  'admin'
);

create type member_status as enum ('actif', 'inactif', 'en_attente');
create type partner_status as enum ('brouillon', 'soumis', 'valide', 'refuse');
create type event_status as enum ('brouillon', 'publie', 'annule', 'archive');
create type event_visibility as enum ('public', 'adherents', 'partenaires', 'tous_membres');
create type inscription_status as enum ('inscrit', 'liste_attente', 'annule');
create type property_status as enum ('disponible', 'sous_offre', 'vendu', 'retire');
create type search_status as enum ('active', 'en_pause', 'terminee');
create type idea_status as enum ('a_etudier', 'retenue', 'en_cours', 'realisee', 'non_retenue');
create type article_status as enum ('brouillon', 'soumis', 'publie', 'archive');
create type payment_status as enum ('en_attente', 'paye', 'en_retard', 'annule');

-- ──────────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ──────────────────────────────────────────────

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  photo_url text,
  iad_slug text,
  city text,
  bio text,
  specialties text[],
  roles user_role[] not null default '{}'::user_role[],
  member_status member_status not null default 'en_attente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_iad_slug on profiles (iad_slug);
create index idx_profiles_member_status on profiles (member_status);

-- ──────────────────────────────────────────────
-- PARTENAIRES (entreprises)
-- ──────────────────────────────────────────────

create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  sector text,
  description text,
  services text,
  contact_reason text,
  coverage_area text,
  website text,
  social_links jsonb default '{}',
  logo_url text,
  photos text[],
  remuneration boolean not null default false,
  internal_conditions text,
  status partner_status not null default 'brouillon',
  published_version_id uuid,
  created_by uuid references profiles(id),
  validated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table partner_contacts (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  name text not null,
  role text,
  phone text,
  email text,
  note text,
  sort_order int not null default 0
);

create table partner_members (
  partner_id uuid not null references partners(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  primary key (partner_id, user_id)
);

-- ──────────────────────────────────────────────
-- ÉVÉNEMENTS
-- ──────────────────────────────────────────────

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  program jsonb,
  image_url text,
  location text,
  address text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  category text,
  visibility event_visibility not null default 'public',
  status event_status not null default 'brouillon',
  max_attendees int,
  registration_deadline timestamptz,
  external_link text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_events_starts_at on events (starts_at);
create index idx_events_status on events (status);

create table event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  guest_name text,
  guest_email text,
  guest_phone text,
  guest_company text,
  status inscription_status not null default 'inscrit',
  registered_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create unique index idx_unique_registration
  on event_registrations (event_id, coalesce(user_id, '00000000-0000-0000-0000-000000000000'), coalesce(guest_email, ''));

-- ──────────────────────────────────────────────
-- BIENS PARTAGÉS
-- ──────────────────────────────────────────────

create table shared_properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  iad_url text,
  iad_reference text,
  transaction_type text,
  property_type text,
  city text,
  postal_code text,
  neighborhood text,
  price int,
  living_area int,
  land_area int,
  rooms int,
  bedrooms int,
  has_garden boolean,
  has_terrace boolean,
  has_balcony boolean,
  has_parking boolean,
  has_garage boolean,
  extra_features jsonb default '{}',
  photo_url text,
  description text,
  status property_status not null default 'disponible',
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_properties_city on shared_properties (city);
create index idx_properties_status on shared_properties (status);

-- ──────────────────────────────────────────────
-- RECHERCHES ACQUÉREURS
-- ──────────────────────────────────────────────

create table buyer_searches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  cities text[],
  property_types text[],
  transaction_type text not null default 'achat',
  max_budget int,
  min_area int,
  min_bedrooms int,
  required_features text[],
  preferred_features text[],
  tolerances text,
  status search_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_searches_status on buyer_searches (status);

-- ──────────────────────────────────────────────
-- RAPPROCHEMENTS
-- ──────────────────────────────────────────────

create table matches (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references shared_properties(id) on delete cascade,
  search_id uuid not null references buyer_searches(id) on delete cascade,
  compatible_criteria text[],
  gaps text[],
  missing_info text[],
  dismissed boolean not null default false,
  dismissed_reason text,
  contacted boolean not null default false,
  created_at timestamptz not null default now(),
  unique (property_id, search_id)
);

-- ──────────────────────────────────────────────
-- BOÎTE À IDÉES
-- ──────────────────────────────────────────────

create table ideas (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  category text,
  description text not null,
  status idea_status not null default 'a_etudier',
  response text,
  responded_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table idea_supports (
  idea_id uuid not null references ideas(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

-- ──────────────────────────────────────────────
-- RESSOURCES
-- ──────────────────────────────────────────────

create table resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  description text,
  file_url text,
  visibility event_visibility not null default 'tous_membres',
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- ARTICLES / BLOG
-- ──────────────────────────────────────────────

create table articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id),
  title text not null,
  slug text not null unique,
  content text not null default '',
  excerpt text,
  category text,
  image_url text,
  sources text,
  status article_status not null default 'brouillon',
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- FINANCES
-- ──────────────────────────────────────────────

create table financial_entries (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  category text not null,
  amount int not null,
  type text not null check (type in ('recette', 'depense')),
  due_date date,
  paid_at date,
  payment_status payment_status not null default 'en_attente',
  related_profile_id uuid references profiles(id),
  related_partner_id uuid references partners(id),
  receipt_url text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_financial_due_date on financial_entries (due_date);
create index idx_financial_category on financial_entries (category);

-- ──────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────────

alter table profiles enable row level security;
alter table partners enable row level security;
alter table partner_contacts enable row level security;
alter table partner_members enable row level security;
alter table events enable row level security;
alter table event_registrations enable row level security;
alter table shared_properties enable row level security;
alter table buyer_searches enable row level security;
alter table matches enable row level security;
alter table ideas enable row level security;
alter table idea_supports enable row level security;
alter table resources enable row level security;
alter table articles enable row level security;
alter table financial_entries enable row level security;

-- Helper: check if user has a given role
create or replace function has_role(check_role user_role)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and check_role = any(roles)
  );
$$;

-- Helper: check if user is admin or gestionnaire_membres
create or replace function is_staff()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and (
      'admin' = any(roles)
      or 'gestionnaire_membres' = any(roles)
      or 'gestionnaire_evenements' = any(roles)
    )
  );
$$;

-- PROFILES policies
create policy "Profiles are viewable by authenticated users"
  on profiles for select to authenticated
  using (true);

create policy "Users can update own profile"
  on profiles for update to authenticated
  using (id = auth.uid());

create policy "Staff can update any profile"
  on profiles for update to authenticated
  using (is_staff());

create policy "Staff can insert profiles"
  on profiles for insert to authenticated
  with check (is_staff() or id = auth.uid());

-- PARTNERS policies
create policy "Published partners are publicly visible"
  on partners for select
  using (status = 'valide');

create policy "Staff sees all partners"
  on partners for select to authenticated
  using (is_staff());

create policy "Partner members see own partner"
  on partners for select to authenticated
  using (exists (
    select 1 from partner_members
    where partner_members.partner_id = partners.id
    and partner_members.user_id = auth.uid()
  ));

create policy "Staff can manage partners"
  on partners for all to authenticated
  using (is_staff());

create policy "Partner members can update own partner"
  on partners for update to authenticated
  using (exists (
    select 1 from partner_members
    where partner_members.partner_id = partners.id
    and partner_members.user_id = auth.uid()
  ));

-- PARTNER_CONTACTS policies
create policy "Contacts of visible partners are readable"
  on partner_contacts for select
  using (exists (
    select 1 from partners
    where partners.id = partner_contacts.partner_id
    and (partners.status = 'valide' or is_staff())
  ));

create policy "Staff can manage contacts"
  on partner_contacts for all to authenticated
  using (is_staff());

-- EVENTS policies
create policy "Published events are publicly visible"
  on events for select
  using (status = 'publie');

create policy "Staff sees all events"
  on events for select to authenticated
  using (is_staff() or has_role('gestionnaire_evenements'));

create policy "Event managers can manage events"
  on events for all to authenticated
  using (has_role('gestionnaire_evenements') or has_role('admin'));

-- EVENT_REGISTRATIONS policies
create policy "Users see own registrations"
  on event_registrations for select to authenticated
  using (user_id = auth.uid());

create policy "Staff sees event registrations"
  on event_registrations for select to authenticated
  using (is_staff() or has_role('gestionnaire_evenements'));

create policy "Anyone can register to public events"
  on event_registrations for insert
  with check (exists (
    select 1 from events
    where events.id = event_registrations.event_id
    and events.status = 'publie'
  ));

create policy "Users can cancel own registration"
  on event_registrations for update to authenticated
  using (user_id = auth.uid());

-- SHARED_PROPERTIES policies
create policy "Members see shared properties"
  on shared_properties for select to authenticated
  using (has_role('adherent') or is_staff());

create policy "Members can manage own properties"
  on shared_properties for all to authenticated
  using (owner_id = auth.uid());

-- BUYER_SEARCHES policies
create policy "Members see buyer searches"
  on buyer_searches for select to authenticated
  using (has_role('adherent') or is_staff());

create policy "Members can manage own searches"
  on buyer_searches for all to authenticated
  using (owner_id = auth.uid());

-- MATCHES policies
create policy "Members see relevant matches"
  on matches for select to authenticated
  using (
    exists (
      select 1 from shared_properties
      where shared_properties.id = matches.property_id
      and shared_properties.owner_id = auth.uid()
    )
    or exists (
      select 1 from buyer_searches
      where buyer_searches.id = matches.search_id
      and buyer_searches.owner_id = auth.uid()
    )
    or is_staff()
  );

-- IDEAS policies
create policy "Members see ideas"
  on ideas for select to authenticated
  using (has_role('adherent') or is_staff());

create policy "Members can create ideas"
  on ideas for insert to authenticated
  with check (has_role('adherent'));

create policy "Authors can update own ideas"
  on ideas for update to authenticated
  using (author_id = auth.uid());

create policy "Staff can manage ideas"
  on ideas for all to authenticated
  using (is_staff());

-- IDEA_SUPPORTS policies
create policy "Members can support ideas"
  on idea_supports for all to authenticated
  using (has_role('adherent'));

-- RESOURCES policies
create policy "Members see resources"
  on resources for select to authenticated
  using (has_role('adherent') or has_role('partenaire') or is_staff());

create policy "Staff can manage resources"
  on resources for all to authenticated
  using (is_staff());

-- ARTICLES policies
create policy "Published articles are public"
  on articles for select
  using (status = 'publie');

create policy "Authors see own articles"
  on articles for select to authenticated
  using (author_id = auth.uid());

create policy "Staff sees all articles"
  on articles for select to authenticated
  using (is_staff());

create policy "Members can create articles"
  on articles for insert to authenticated
  with check (has_role('adherent') or has_role('partenaire'));

create policy "Authors can update own articles"
  on articles for update to authenticated
  using (author_id = auth.uid());

create policy "Staff can manage articles"
  on articles for all to authenticated
  using (is_staff());

-- FINANCIAL_ENTRIES policies
create policy "Associes and admin see finances"
  on financial_entries for select to authenticated
  using (has_role('associe') or has_role('admin'));

create policy "Admin can manage finances"
  on financial_entries for all to authenticated
  using (has_role('admin'));

create policy "Gestionnaire membres sees cotisations"
  on financial_entries for select to authenticated
  using (
    has_role('gestionnaire_membres')
    and category in ('cotisation', 'reglement_partenaire')
  );

-- ──────────────────────────────────────────────
-- TRIGGER: auto-create profile on signup
-- ──────────────────────────────────────────────

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ──────────────────────────────────────────────
-- TRIGGER: updated_at auto-refresh
-- ──────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at();
create trigger partners_updated_at before update on partners
  for each row execute procedure update_updated_at();
create trigger events_updated_at before update on events
  for each row execute procedure update_updated_at();
create trigger properties_updated_at before update on shared_properties
  for each row execute procedure update_updated_at();
create trigger searches_updated_at before update on buyer_searches
  for each row execute procedure update_updated_at();
create trigger ideas_updated_at before update on ideas
  for each row execute procedure update_updated_at();
create trigger articles_updated_at before update on articles
  for each row execute procedure update_updated_at();
create trigger financial_updated_at before update on financial_entries
  for each row execute procedure update_updated_at();
