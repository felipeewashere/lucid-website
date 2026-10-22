-- Ticket replies: admins reply from the admin panel, users can read replies on their own tickets.
create table if not exists public.ticket_replies (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  message text not null check (length(message) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists ticket_replies_ticket_id_idx on public.ticket_replies (ticket_id);
create index if not exists ticket_replies_author_id_idx on public.ticket_replies (author_id);
alter table public.ticket_replies enable row level security;

drop policy if exists "Users read replies on own tickets" on public.ticket_replies;
drop policy if exists "Users reply on own tickets" on public.ticket_replies;
drop policy if exists "Admins manage replies" on public.ticket_replies;
create policy "Users read replies on own tickets" on public.ticket_replies for select to authenticated
  using (exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = (select auth.uid())));
create policy "Users reply on own tickets" on public.ticket_replies for insert to authenticated
  with check (author_id = (select auth.uid()) and is_admin = false
    and exists (select 1 from public.tickets t where t.id = ticket_id and t.user_id = (select auth.uid())));
create policy "Admins manage replies" on public.ticket_replies for all to authenticated
  using (public.has_role((select auth.uid()), 'admin')) with check (public.has_role((select auth.uid()), 'admin'));
