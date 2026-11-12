-- Run this whole file once in Supabase: Dashboard > SQL Editor > New query > Run.

-- ---------- Tables ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 150),
  slug text not null unique check (char_length(slug) between 3 and 200),
  excerpt text not null default '' check (char_length(excerpt) <= 300),
  body text not null check (char_length(body) between 20 and 20000),
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  created_at timestamptz not null default now(),
  published_at timestamptz
);
create index posts_status_published_idx on public.posts (status, published_at desc);
create index posts_author_idx on public.posts (author_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

-- ---------- Helpers ----------
-- Create a profile automatically whenever someone signs up.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1)), 60)
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- ---------- Row-level security ----------
alter table public.profiles enable row level security;
alter table public.posts    enable row level security;
alter table public.comments enable row level security;

-- profiles: names are public; users may change only their own display_name
create policy "profiles are readable" on public.profiles for select using (true);
create policy "update own profile" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

-- posts
create policy "read published, own or admin" on public.posts for select
  using (status = 'published' or author_id = auth.uid() or public.is_admin());
create policy "authors create pending posts" on public.posts for insert to authenticated
  with check (author_id = auth.uid() and status = 'pending');
create policy "authors edit own posts (back to pending)" on public.posts for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid() and status = 'pending');
create policy "authors delete own posts" on public.posts for delete to authenticated
  using (author_id = auth.uid());
create policy "admin manages posts" on public.posts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- comments: anyone can read/post on published posts; only admin can delete
create policy "read comments on published posts" on public.comments for select
  using (
    exists (select 1 from public.posts p where p.id = post_id and p.status = 'published')
    or public.is_admin()
  );
create policy "anyone can comment on published posts" on public.comments for insert
  to anon, authenticated
  with check (exists (select 1 from public.posts p where p.id = post_id and p.status = 'published'));
create policy "admin deletes comments" on public.comments for delete to authenticated
  using (public.is_admin());
revoke update on public.comments from anon, authenticated;

-- ---------- Make yourself the admin ----------
-- 1) Sign up on the site with your email.  2) Then run (with your email):
--
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'you@example.com');
