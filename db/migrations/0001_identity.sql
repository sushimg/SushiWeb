-- Sushi Systems Accounts — çekirdek kimlik şeması.
-- Spec: docs/superpowers/specs/2026-08-14-sushi-accounts-design.md

create extension if not exists citext;
create extension if not exists pgcrypto;  -- gen_random_uuid için

-- KİMLİK ---------------------------------------------------------------

create table accounts (
  id             uuid primary key default gen_random_uuid(),
  email          citext not null unique,
  email_verified boolean not null default false,
  display_name   text,
  status         text not null default 'active',
  created_at     timestamptz not null default now(),
  constraint accounts_status_valid
    check (status in ('active', 'suspended', 'deleted'))
);

create table identities (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references accounts(id) on delete cascade,
  provider    text not null,
  subject     text not null,
  secret_hash text,
  created_at  timestamptz not null default now(),
  unique (provider, subject),
  constraint identities_provider_valid
    check (provider in ('password', 'google')),
  -- Parola kimliğinin hash'i olmak zorunda; Google kimliğinin olmamalı.
  constraint identities_secret_matches_provider check (
    (provider = 'password' and secret_hash is not null) or
    (provider <> 'password' and secret_hash is null)
  )
);

create index identities_account_idx on identities(account_id);

-- KAPSAMLAR ------------------------------------------------------------

create table organizations (
  id         uuid primary key default gen_random_uuid(),
  slug       citext not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

create table products (
  id         uuid primary key default gen_random_uuid(),
  slug       citext not null unique,
  name       text not null,
  created_at timestamptz not null default now()
);

-- YETKİ ----------------------------------------------------------------

create table permissions (
  key         text primary key,
  description text not null
);

create table roles (
  id         uuid primary key default gen_random_uuid(),
  scope_type text not null,
  key        text not null,
  name       text not null,
  unique (scope_type, key),
  constraint roles_scope_valid check (scope_type in ('org', 'product'))
);

create table role_permissions (
  role_id        uuid not null references roles(id) on delete cascade,
  permission_key text not null references permissions(key) on delete cascade,
  primary key (role_id, permission_key)
);

-- Sistemin kalbi: "şu hesap, şu kapsamda, şu role sahip."
create table grants (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  scope_type text not null,
  scope_id   uuid not null,
  role_id    uuid not null references roles(id),
  granted_at timestamptz not null default now(),
  unique (account_id, scope_type, scope_id, role_id),
  constraint grants_scope_valid check (scope_type in ('org', 'product'))
);

-- Yetki sorgusu her istekte koşar; kapsam bazlı arama için indeks şart.
create index grants_lookup_idx on grants(account_id, scope_type, scope_id);
create index grants_scope_idx on grants(scope_type, scope_id);

-- OTURUM VE TOKEN'LAR --------------------------------------------------
-- Hiçbir token ham hâlde saklanmaz; yalnızca SHA-256 özeti.

create table sessions (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  user_agent text,
  created_at timestamptz not null default now()
);

create index sessions_account_idx on sessions(account_id);

create table email_verifications (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references accounts(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create table password_resets (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references accounts(id) on delete cascade,
  token_hash  text not null unique,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  created_at  timestamptz not null default now()
);

create table invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  email       citext not null,
  role_id     uuid not null references roles(id),
  token_hash  text not null unique,
  invited_by  uuid not null references accounts(id),
  expires_at  timestamptz not null,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Aynı adrese iki BEKLEYEN davet olamaz; kişi ayrıldıktan sonra tekrar
-- davet edilebilir. Yarış durumunda bile bozulamayacak tek yer burası.
create unique index invitations_pending_idx
  on invitations(org_id, email) where accepted_at is null;

create table rate_limits (
  bucket       text not null,
  subject      text not null,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (bucket, subject, window_start)
);
