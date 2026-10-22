-- Script UI (JSON pasted in the admin panel) and key checking for the /key page.
alter table public.scripts add column if not exists ui_schema jsonb;

create table if not exists public.script_keys (
  id uuid primary key default gen_random_uuid(),
  key_value text not null unique check (length(key_value) between 4 and 200),
  note text,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.script_keys enable row level security;
drop policy if exists "Admins manage keys" on public.script_keys;
create policy "Admins manage keys" on public.script_keys for all to authenticated
  using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));

-- Lets the key page ask "is this key valid?" without being able to read the table.
create or replace function public.check_script_key(_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.script_keys
    where key_value = _key and is_active and (expires_at is null or expires_at > now())
  )
$$;
revoke all on function public.check_script_key(text) from public;
grant execute on function public.check_script_key(text) to anon, authenticated;
