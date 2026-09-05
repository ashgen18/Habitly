-- Server-validated Premium. Clients may read their own row. Only the webhook writes.

create table if not exists public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'free' check (status in ('free', 'premium')),
  product_id text,
  expires_at timestamptz,
  rc_app_user_id text,
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

drop policy if exists "entitlements_own_read" on public.entitlements;
create policy "entitlements_own_read"
  on public.entitlements
  for select
  using (auth.uid() = user_id);
