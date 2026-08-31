-- ============================================================================
-- CRMO — photography
--
-- Folds deals and projects into one `shoots` table, because a photography job
-- is one thing: the enquiry, the quote, the deposit, the shoot day, the edit,
-- the delivery and the licence term are stages of a single record, not two.
--
-- Adds the collections that make that record useful: lead_sources (where work
-- comes from), licenses (rights sold, and when they lapse), invoices (deposit
-- and balance, each carrying a frozen copy of what it billed for).
--
-- `projects` and `deals` are deliberately left in place. The client no longer
-- reads them, and the store migration has already folded their contents into
-- shoots locally — but dropping them here would destroy the only server-side
-- copy of anything the migration got wrong. Drop them by hand once you are
-- satisfied, in 0004.
-- ============================================================================

-- ------------------------------------------------------------ lead sources

create table if not exists public.lead_sources (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id           text not null,
  label        text not null,
  category     text not null default 'other'
               check (category in ('referral', 'direct', 'social', 'agency', 'repeat', 'other')),
  active       boolean not null default true,
  primary key (workspace_id, id)
);

-- ------------------------------------------------------------------ shoots

create table if not exists public.shoots (
  workspace_id             uuid not null references public.workspaces (id) on delete cascade,
  id                       text not null,
  name                     text not null,
  code                     text not null default '',
  summary                  text not null default '',
  contact_id               text,
  company_id               text,
  cover_url                text,
  art_seed                 text not null default '',
  stage_id                 text,
  health                   text not null default 'on-track',
  shoot_type               text not null default 'commercial'
                           check (shoot_type in ('editorial', 'event', 'portrait', 'commercial', 'product')),
  owner_id                 text,
  member_ids               text[] not null default '{}',

  -- sales
  lead_source_id           text,
  referred_by_contact_id   text,
  probability              integer not null default 0,
  inquired_at              date,
  quoted_at                date,

  -- money. No total column: it is summed from line_items in the client, so a
  -- quote edit cannot leave a stale figure behind.
  line_items               jsonb not null default '[]'::jsonb,
  deposit_pct              integer not null default 50,
  expected_close_date      date,

  -- schedule
  shoot_dates              jsonb not null default '[]'::jsonb,
  location_ids             text[] not null default '{}',
  talent_ids               text[] not null default '{}',

  -- production
  deliverables             jsonb not null default '[]'::jsonb,
  promised_turnaround_days integer,
  delivered_at             date,
  gallery_url              text,
  gallery_expires_at       date,
  catalog_path             text,

  -- paperwork
  contract_status          text not null default 'none'
                           check (contract_status in ('none', 'sent', 'signed', 'not-required')),
  release_status           text not null default 'none'
                           check (release_status in ('none', 'sent', 'signed', 'not-required')),
  contract_asset_id        text,
  release_asset_id         text,

  gmail_thread_url         text,
  tags                     text[] not null default '{}',
  brief                    jsonb not null default '{}'::jsonb,
  notes                    text not null default '',
  archived                 boolean not null default false,
  created_at               date,
  closed_at                date,
  primary key (workspace_id, id)
);

create index if not exists shoots_stage_idx on public.shoots (workspace_id, stage_id);
create index if not exists shoots_company_idx on public.shoots (workspace_id, company_id);

-- ---------------------------------------------------------------- licences

create table if not exists public.licenses (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id           text not null,
  shoot_id     text,
  company_id   text,
  name         text not null default '',
  scope        text not null default '',
  media        text[] not null default '{}',
  territory    text not null default '',
  start_date   date,
  end_date     date,
  fee          numeric not null default 0,
  exclusive    boolean not null default false,
  status       text not null default 'active'
               check (status in ('active', 'expiring', 'expired', 'renewed', 'lapsed')),
  asset_ids    text[] not null default '{}',
  notes        text not null default '',
  created_at   date,
  primary key (workspace_id, id)
);

-- The 60-day expiry sweep reads this every time the dashboard mounts.
create index if not exists licenses_end_idx on public.licenses (workspace_id, end_date);

-- ---------------------------------------------------------------- invoices

create table if not exists public.invoices (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id           text not null,
  shoot_id     text,
  number       text not null default '',
  kind         text not null default 'full'
               check (kind in ('deposit', 'balance', 'full')),
  -- Frozen at issue. Deliberately a copy of the shoot's line items rather than
  -- a reference: editing a quote must never rewrite an invoice already sent.
  line_items   jsonb not null default '[]'::jsonb,
  status       text not null default 'draft'
               check (status in ('draft', 'sent', 'paid', 'void')),
  issued_at    date,
  due_at       date,
  paid_at      date,
  notes        text not null default '',
  signoff      text not null default '',
  paper        text not null default 'light' check (paper in ('light', 'inverted')),
  created_at   date,
  primary key (workspace_id, id)
);

create index if not exists invoices_shoot_idx on public.invoices (workspace_id, shoot_id);

-- ------------------------------------------------- widen existing columns

-- Stages now span the whole lifecycle, not just open/won/lost.
--
-- Existing rows have to be moved onto the new vocabulary *before* the check is
-- reinstated, or the constraint is rejected by the data already in the table.
-- 'open' was a sales stage, so it lands on 'quoted'; won and lost carry over
-- unchanged. The client replaces the whole pipeline on its next sync anyway —
-- this is only here so the constraint has something valid to apply to.
alter table public.pipeline_stages drop constraint if exists pipeline_stages_kind_check;

update public.pipeline_stages
   set kind = 'quoted'
 where kind not in ('lead', 'quoted', 'booked', 'production', 'delivered',
                    'licensing', 'won', 'lost');

alter table public.pipeline_stages add constraint pipeline_stages_kind_check
  check (kind in ('lead', 'quoted', 'booked', 'production', 'delivered',
                  'licensing', 'won', 'lost'));

alter table public.contacts        add column if not exists gmail_thread_url text;
alter table public.activity_events add column if not exists thread_url       text;

-- project_id -> shoot_id on everything that hung off a project. Guarded so the
-- migration can be re-run; Postgres has no `rename column if exists`.
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('milestones', 'project_id', 'shoot_id'),
      ('tasks',      'project_id', 'shoot_id'),
      ('moodboards', 'project_id', 'shoot_id'),
      ('assets',     'project_id', 'shoot_id')
    ) as t(tbl, old_col, new_col)
  loop
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = r.tbl and column_name = r.old_col
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = r.tbl and column_name = r.new_col
    ) then
      execute format('alter table public.%I rename column %I to %I', r.tbl, r.old_col, r.new_col);
    end if;
  end loop;
end $$;

-- A task belonged to either a project or a deal; now there is only the shoot.
alter table public.tasks   drop column if exists deal_id;
alter table public.assets  alter column kind set default 'photo';

-- ------------------------------------------------------------------- RLS

do $$
declare t text;
begin
  foreach t in array array[
    'lead_sources', 'shoots', 'licenses', 'invoices'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_rw', t);
    execute format(
      'create policy %I on public.%I for all
         using (public.is_member(workspace_id))
         with check (public.is_member(workspace_id))',
      t || '_rw', t
    );
  end loop;
end $$;
