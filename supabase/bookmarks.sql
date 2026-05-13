create extension if not exists pgcrypto;

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint tags_user_id_name_key unique (user_id, name)
);

create table if not exists public.bookmark_tags (
  bookmark_id uuid not null references public.bookmarks (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (bookmark_id, tag_id)
);

alter table public.bookmarks enable row level security;
alter table public.tags enable row level security;
alter table public.bookmark_tags enable row level security;

drop policy if exists "Users can view their own bookmarks" on public.bookmarks;
create policy "Users can view their own bookmarks"
on public.bookmarks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own bookmarks" on public.bookmarks;
create policy "Users can insert their own bookmarks"
on public.bookmarks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own bookmarks" on public.bookmarks;
create policy "Users can update their own bookmarks"
on public.bookmarks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own bookmarks" on public.bookmarks;
create policy "Users can delete their own bookmarks"
on public.bookmarks
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own tags" on public.tags;
create policy "Users can view their own tags"
on public.tags
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own tags" on public.tags;
create policy "Users can insert their own tags"
on public.tags
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own tags" on public.tags;
create policy "Users can update their own tags"
on public.tags
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own tags" on public.tags;
create policy "Users can delete their own tags"
on public.tags
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their own bookmark tags" on public.bookmark_tags;
create policy "Users can view their own bookmark tags"
on public.bookmark_tags
for select
to authenticated
using (
  exists (
    select 1
    from public.bookmarks
    where public.bookmarks.id = bookmark_tags.bookmark_id
      and public.bookmarks.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert their own bookmark tags" on public.bookmark_tags;
create policy "Users can insert their own bookmark tags"
on public.bookmark_tags
for insert
to authenticated
with check (
  exists (
    select 1
    from public.bookmarks
    where public.bookmarks.id = bookmark_tags.bookmark_id
      and public.bookmarks.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.tags
    where public.tags.id = bookmark_tags.tag_id
      and public.tags.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their own bookmark tags" on public.bookmark_tags;
create policy "Users can delete their own bookmark tags"
on public.bookmark_tags
for delete
to authenticated
using (
  exists (
    select 1
    from public.bookmarks
    where public.bookmarks.id = bookmark_tags.bookmark_id
      and public.bookmarks.user_id = auth.uid()
  )
);

create index if not exists bookmarks_user_id_created_at_idx
on public.bookmarks (user_id, created_at desc);

create index if not exists tags_user_id_name_idx
on public.tags (user_id, name);

create index if not exists bookmark_tags_bookmark_id_idx
on public.bookmark_tags (bookmark_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bookmarks'
  ) then
    alter publication supabase_realtime add table public.bookmarks;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tags'
  ) then
    alter publication supabase_realtime add table public.tags;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bookmark_tags'
  ) then
    alter publication supabase_realtime add table public.bookmark_tags;
  end if;
end
$$;
