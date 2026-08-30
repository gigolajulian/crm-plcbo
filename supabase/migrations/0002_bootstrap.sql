-- ============================================================================
-- WORKSPACE BOOTSTRAP
--
-- Creating the first workspace from the client is a chicken-and-egg problem:
-- inserting the workspace needs a policy that trusts owner_id, and inserting
-- the membership needs the workspace to already exist — and if either half
-- fails you are left with an orphan.
--
-- Doing it in one security-definer function removes both problems. It is
-- atomic, and it does not depend on the insert policies at all, which is why
-- the previous approach failed with "new row violates row-level security
-- policy for table workspaces".
-- ============================================================================

-- Diagnostic: does the database actually see the caller's session? If this
-- returns null, the request reached Postgres without a user JWT, and every
-- auth.uid() check will fail no matter how the policies are written.
create or replace function public.whoami()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

grant execute on function public.whoami() to anon, authenticated;

-- ---------------------------------------------------------------------------

create or replace function public.create_workspace(
  p_name    text,
  p_tagline text default '',
  p_accent  text default 'lime'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id   uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated: the request carried no user session.'
      using errcode = '28000';
  end if;

  insert into public.workspaces (owner_id, name, tagline, accent)
  values (
    v_user,
    coalesce(nullif(trim(p_name), ''), 'My studio'),
    coalesce(p_tagline, ''),
    coalesce(nullif(p_accent, ''), 'lime')
  )
  returning id into v_id;

  insert into public.workspace_members (workspace_id, user_id, permission_role)
  values (v_id, v_user, 'owner');

  return v_id;
end;
$$;

grant execute on function public.create_workspace(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Returns the caller's workspace, creating it on first sign-in. One round trip,
-- and safe to call every time the app boots.

create or replace function public.current_workspace(
  p_name    text default 'My studio',
  p_tagline text default '',
  p_accent  text default 'lime'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id   uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated: the request carried no user session.'
      using errcode = '28000';
  end if;

  select m.workspace_id into v_id
  from public.workspace_members m
  where m.user_id = v_user
  order by m.created_at
  limit 1;

  if v_id is not null then
    return v_id;
  end if;

  return public.create_workspace(p_name, p_tagline, p_accent);
end;
$$;

grant execute on function public.current_workspace(text, text, text) to authenticated;
