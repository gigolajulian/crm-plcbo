-- ============================================================================
-- CRMO — schema
--
-- Mirrors src/data/types.ts. Record ids stay as the text ids the client already
-- generates ("pj_quiet", "ct_mtffycpo1"), so seeding and offline work need no
-- id rewriting. They are only unique *within* a workspace — two studios can
-- both hold a "pj_quiet" — so every table is keyed on (workspace_id, id).
--
-- Nested value objects (a project's brief, a mood item's payload, an activity
-- event's links) are jsonb: they are always read and written whole, and giving
-- each its own table would buy nothing.
--
-- Cross-record integrity (project.company_id -> companies.id) is enforced in
-- the app rather than by composite foreign keys, which would double the size of
-- this file for little gain. workspace_id *is* a real foreign key, so deleting
-- a workspace cleans up everything under it.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- workspaces

create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  tagline     text not null default '',
  accent      text not null default 'lime',
  currency    text not null default 'USD',
  locale      text not null default 'en-US',
  created_at  timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  permission_role text not null default 'member'
                  check (permission_role in ('owner', 'admin', 'member', 'guest')),
  created_at      timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx
  on public.workspace_members (user_id);

-- ----------------------------------------------------------------- the studio

create table if not exists public.team_members (
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  id              text not null,
  -- Set when this studio member has actually signed in; null for people who
  -- exist in the roster but have no login yet.
  user_id         uuid references auth.users (id) on delete set null,
  name            text not null,
  role            text not null default '',
  permission_role text not null default 'member',
  email           text not null default '',
  avatar          text,
  capacity        integer not null default 40,
  active          boolean not null default true,
  primary key (workspace_id, id)
);

create table if not exists public.companies (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id           text not null,
  name         text not null,
  industry     text not null default '',
  website      text not null default '',
  location     text not null default '',
  size         text not null default '',
  tags         text[] not null default '{}',
  notes        text not null default '',
  art_seed     text not null default '',
  since        date,
  primary key (workspace_id, id)
);

create table if not exists public.contacts (
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  id              text not null,
  name            text not null,
  role            text not null default '',
  company_id      text,
  email           text not null default '',
  phone           text not null default '',
  avatar          text,
  tags            text[] not null default '{}',
  location        text,
  creative_prefs  text not null default '',
  notes           text not null default '',
  last_touched_at date,
  favourite       boolean not null default false,
  primary key (workspace_id, id)
);

create index if not exists contacts_company_idx
  on public.contacts (workspace_id, company_id);

-- ------------------------------------------------------------------ projects

create table if not exists public.projects (
  workspace_id      uuid not null references public.workspaces (id) on delete cascade,
  id                text not null,
  name              text not null,
  code              text not null default '',
  summary           text not null default '',
  client_contact_id text,
  company_id        text,
  cover_url         text,
  art_seed          text not null default '',
  stage             text not null default 'discovery',
  health            text not null default 'on-track',
  lead_id           text,
  member_ids        text[] not null default '{}',
  start_date        date,
  due_date          date,
  budget            numeric not null default 0,
  spent             numeric not null default 0,
  deliverables      jsonb not null default '[]'::jsonb,
  tags              text[] not null default '{}',
  brief             jsonb not null default '{}'::jsonb,
  deal_id           text,
  archived          boolean not null default false,
  created_at        date,
  primary key (workspace_id, id)
);

create index if not exists projects_company_idx
  on public.projects (workspace_id, company_id);

create table if not exists public.milestones (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id           text not null,
  project_id   text not null,
  name         text not null,
  date         date,
  status       text not null default 'upcoming',
  note         text,
  primary key (workspace_id, id)
);

create index if not exists milestones_project_idx
  on public.milestones (workspace_id, project_id);

-- --------------------------------------------------------------------- tasks

create table if not exists public.tasks (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id           text not null,
  title        text not null,
  detail       text,
  status       text not null default 'todo',
  priority     text not null default 'normal',
  due_date     date,
  assignee_id  text,
  project_id   text,
  deal_id      text,
  contact_id   text,
  reminder_at  timestamptz,
  created_at   date,
  completed_at timestamptz,
  primary key (workspace_id, id)
);

create index if not exists tasks_assignee_idx
  on public.tasks (workspace_id, assignee_id, status);

-- --------------------------------------------------------------------- deals

create table if not exists public.pipeline_stages (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id           text not null,
  name         text not null,
  "order"      integer not null default 0,
  probability  integer not null default 0,
  kind         text not null default 'open' check (kind in ('open', 'won', 'lost')),
  primary key (workspace_id, id)
);

create table if not exists public.deals (
  workspace_id        uuid not null references public.workspaces (id) on delete cascade,
  id                  text not null,
  name                text not null,
  company_id          text,
  contact_id          text,
  stage_id            text,
  value               numeric not null default 0,
  probability         integer not null default 0,
  expected_close_date date,
  owner_id            text,
  project_id          text,
  source              text not null default '',
  notes               text not null default '',
  tags                text[] not null default '{}',
  created_at          date,
  closed_at           date,
  primary key (workspace_id, id)
);

create index if not exists deals_stage_idx
  on public.deals (workspace_id, stage_id);

-- ---------------------------------------------------------------- moodboards

create table if not exists public.moodboards (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id           text not null,
  project_id   text not null,
  title        text not null default '',
  updated_at   timestamptz,
  primary key (workspace_id, id)
);

create table if not exists public.mood_sections (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id           text not null,
  board_id     text not null,
  title        text not null default '',
  description  text,
  "order"      integer not null default 0,
  primary key (workspace_id, id)
);

create table if not exists public.mood_items (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id           text not null,
  board_id     text not null,
  section_id   text not null,
  "order"      integer not null default 0,
  kind         text not null,
  payload      jsonb not null default '{}'::jsonb,
  caption      text not null default '',
  tags         text[] not null default '{}',
  note         text,
  pinned       boolean not null default false,
  added_by     text,
  created_at   timestamptz,
  primary key (workspace_id, id)
);

create index if not exists mood_items_section_idx
  on public.mood_items (workspace_id, section_id, "order");

-- ------------------------------------------------------- assets & approvals

create table if not exists public.assets (
  workspace_id       uuid not null references public.workspaces (id) on delete cascade,
  id                 text not null,
  project_id         text not null,
  name               text not null,
  kind               text not null default 'design',
  current_version_id text,
  created_at         date,
  primary key (workspace_id, id)
);

create table if not exists public.asset_versions (
  workspace_id   uuid not null references public.workspaces (id) on delete cascade,
  id             text not null,
  asset_id       text not null,
  label          text not null default 'v1',
  url            text,
  -- Set when the file lives in Supabase Storage rather than at a remote URL.
  storage_path   text,
  art_seed       text not null default '',
  ratio          numeric not null default 1.3333,
  uploaded_by_id text,
  created_at     timestamptz,
  status         text not null default 'draft',
  decision       text,
  decided_by_id  text,
  decided_at     timestamptz,
  notes          text,
  primary key (workspace_id, id)
);

create index if not exists asset_versions_asset_idx
  on public.asset_versions (workspace_id, asset_id, created_at desc);

create table if not exists public.comments (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id           text not null,
  target_type  text not null,
  target_id    text not null,
  author_id    text,
  author_kind  text not null default 'team',
  body         text not null default '',
  created_at   timestamptz,
  resolved     boolean not null default false,
  pin          jsonb,
  primary key (workspace_id, id)
);

create index if not exists comments_target_idx
  on public.comments (workspace_id, target_type, target_id);

-- ------------------------------------------------------------------ activity

create table if not exists public.activity_events (
  workspace_id   uuid not null references public.workspaces (id) on delete cascade,
  id             text not null,
  type           text not null,
  subject        text not null,
  body           text,
  actor_id       text,
  actor_kind     text not null default 'team',
  at             timestamptz,
  direction      text,
  links          jsonb not null default '{}'::jsonb,
  follow_up_at   date,
  follow_up_done boolean,
  primary key (workspace_id, id)
);

create index if not exists activity_at_idx
  on public.activity_events (workspace_id, at desc);

-- --------------------------------------------------------- tags & structure

create table if not exists public.tags (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id           text not null,
  label        text not null,
  tone         text not null default 'neutral',
  primary key (workspace_id, id)
);

create table if not exists public.custom_fields (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id           text not null,
  label        text not null,
  type         text not null default 'text',
  entity       text not null,
  options      text[],
  required     boolean not null default false,
  primary key (workspace_id, id)
);

create table if not exists public.saved_views (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  id           text not null,
  scope        text not null,
  name         text not null,
  filters      jsonb not null default '{}'::jsonb,
  sort         text,
  layout       text,
  primary key (workspace_id, id)
);

-- ------------------------------------------------------------ per-user prefs

-- Theme and density belong to the person, not the studio, so two people in the
-- same workspace can each work the way they like.
create table if not exists public.user_settings (
  workspace_id    uuid not null references public.workspaces (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  theme           text not null default 'light',
  density         text not null default 'comfortable',
  notifications   jsonb not null default '{}'::jsonb,
  current_user_id text,
  onboarded       boolean not null default true,
  primary key (workspace_id, user_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY
--
-- The anon key is public — it ships in the JavaScript bundle. These policies
-- are the only thing standing between one studio's data and another's, so
-- every table is locked by default and opened only to workspace members.
-- ============================================================================

-- security definer, so checking membership does not re-trigger RLS on
-- workspace_members and recurse forever.
create or replace function public.is_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_admin(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws
      and m.user_id = auth.uid()
      and m.permission_role in ('owner', 'admin')
  );
$$;

-- --- workspaces -------------------------------------------------------------

alter table public.workspaces enable row level security;

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces
  for select using (public.is_member(id));

drop policy if exists workspaces_insert on public.workspaces;
create policy workspaces_insert on public.workspaces
  for insert with check (owner_id = auth.uid());

drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update on public.workspaces
  for update using (public.is_admin(id)) with check (public.is_admin(id));

drop policy if exists workspaces_delete on public.workspaces;
create policy workspaces_delete on public.workspaces
  for delete using (owner_id = auth.uid());

-- --- membership -------------------------------------------------------------

alter table public.workspace_members enable row level security;

drop policy if exists members_select on public.workspace_members;
create policy members_select on public.workspace_members
  for select using (public.is_member(workspace_id));

-- Either an admin adding someone, or the owner adding themselves to the
-- workspace they just created (the bootstrap case, where no membership exists
-- yet and is_admin would therefore be false).
drop policy if exists members_insert on public.workspace_members;
create policy members_insert on public.workspace_members
  for insert with check (
    public.is_admin(workspace_id)
    or (
      user_id = auth.uid()
      and exists (
        select 1 from public.workspaces w
        where w.id = workspace_id and w.owner_id = auth.uid()
      )
    )
  );

drop policy if exists members_update on public.workspace_members;
create policy members_update on public.workspace_members
  for update using (public.is_admin(workspace_id));

drop policy if exists members_delete on public.workspace_members;
create policy members_delete on public.workspace_members
  for delete using (public.is_admin(workspace_id) or user_id = auth.uid());

-- --- everything else --------------------------------------------------------

-- Every domain table gets the same rule: members of the workspace may read and
-- write its rows, and nobody else can see them at all.
do $$
declare t text;
begin
  foreach t in array array[
    'team_members', 'companies', 'contacts', 'projects', 'milestones', 'tasks',
    'pipeline_stages', 'deals', 'moodboards', 'mood_sections', 'mood_items',
    'assets', 'asset_versions', 'comments', 'activity_events', 'tags',
    'custom_fields', 'saved_views'
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

-- Personal preferences are visible only to the person they belong to.
alter table public.user_settings enable row level security;

drop policy if exists user_settings_rw on public.user_settings;
create policy user_settings_rw on public.user_settings
  for all
  using (user_id = auth.uid() and public.is_member(workspace_id))
  with check (user_id = auth.uid() and public.is_member(workspace_id));

-- ============================================================================
-- STORAGE
-- One private bucket for uploaded work. Paths are <workspace_id>/<asset>/<file>
-- so the first path segment is the tenancy check.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('crmo-assets', 'crmo-assets', false)
on conflict (id) do nothing;

drop policy if exists crmo_assets_rw on storage.objects;
create policy crmo_assets_rw on storage.objects
  for all
  using (
    bucket_id = 'crmo-assets'
    and public.is_member(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'crmo-assets'
    and public.is_member(((storage.foldername(name))[1])::uuid)
  );
