-- StudentNest Supabase schema
-- Run this in the Supabase SQL editor, then add the required env vars to .env.local.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('admin', 'student');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null unique,
  phone text,
  avatar_url text,
  role public.user_role not null default 'student',
  created_at timestamptz not null default now()
);

create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default false,
  coming_soon boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  city text not null default 'Jalal-Abad',
  region text not null default 'Jalal-Abad',
  description text,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.platform_settings (
  id integer primary key default 1 check (id = 1),
  whatsapp_number text not null default '+996555011697',
  brand text not null default 'StudentNest',
  currency text not null default 'KGS',
  homepage_text text not null default 'Safe, affordable student housing near your university.',
  updated_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  monthly_rent integer not null check (monthly_rent >= 0),
  currency text not null default 'KGS',
  location text not null,
  region text not null default 'Jalal-Abad',
  nearby_university_id uuid references public.universities(id) on delete set null,
  distance_from_university text,
  room_type text not null check (room_type in ('Studio', 'Private room', 'Shared room', 'Apartment')),
  shared_room boolean not null default false,
  furnished boolean not null default true,
  utilities_included boolean not null default true,
  gender_preference text not null default 'Mixed' check (gender_preference in ('Female only', 'Male only', 'Mixed')),
  amenities text[] not null default '{}',
  roommate_count integer not null default 0 check (roommate_count >= 0),
  verified boolean not null default false,
  featured boolean not null default false,
  featured_rank integer not null default 0,
  listing_status text not null default 'active' check (listing_status in ('active', 'draft', 'unavailable')),
  available_from date,
  whatsapp_number text not null default '+996555011697',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  property_id uuid references public.properties(id) on delete cascade,
  message text not null,
  whatsapp_number text not null default '+996555011697',
  created_at timestamptz not null default now()
);

create table if not exists public.recent_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text,
  region text,
  university text,
  room_type text,
  created_at timestamptz not null default now()
);

create index if not exists properties_featured_idx on public.properties(featured);
create index if not exists properties_region_idx on public.properties(region);
create index if not exists properties_university_idx on public.properties(nearby_university_id);
create index if not exists property_images_property_idx on public.property_images(property_id, sort_order);
create index if not exists recent_views_user_viewed_idx on public.recent_views(user_id, viewed_at desc);
create index if not exists search_history_user_created_idx on public.search_history(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_properties_updated_at on public.properties;
create trigger set_properties_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    'student'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.regions enable row level security;
alter table public.universities enable row level security;
alter table public.platform_settings enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.favorites enable row level security;
alter table public.inquiries enable row level security;
alter table public.recent_views enable row level security;
alter table public.search_history enable row level security;

drop policy if exists "Profiles are readable by owner or admin" on public.profiles;
create policy "Profiles are readable by owner or admin" on public.profiles
for select using (auth.uid() = id or public.is_admin());

drop policy if exists "Profiles are editable by owner or admin" on public.profiles;
create policy "Profiles are editable by owner or admin" on public.profiles
for update using (auth.uid() = id or public.is_admin());

drop policy if exists "Public can read regions" on public.regions;
create policy "Public can read regions" on public.regions for select using (true);
drop policy if exists "Admins manage regions" on public.regions;
create policy "Admins manage regions" on public.regions for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read universities" on public.universities;
create policy "Public can read universities" on public.universities for select using (true);
drop policy if exists "Admins manage universities" on public.universities;
create policy "Admins manage universities" on public.universities for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read platform settings" on public.platform_settings;
create policy "Public can read platform settings" on public.platform_settings for select using (true);
drop policy if exists "Admins manage platform settings" on public.platform_settings;
create policy "Admins manage platform settings" on public.platform_settings for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read verified properties" on public.properties;
create policy "Public can read verified properties" on public.properties
for select using (verified = true or public.is_admin());
drop policy if exists "Admins manage properties" on public.properties;
create policy "Admins manage properties" on public.properties for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read property images" on public.property_images;
create policy "Public can read property images" on public.property_images for select using (true);
drop policy if exists "Admins manage property images" on public.property_images;
create policy "Admins manage property images" on public.property_images for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Users manage own favorites" on public.favorites;
create policy "Users manage own favorites" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Admins read favorites" on public.favorites;
create policy "Admins read favorites" on public.favorites for select using (public.is_admin());

drop policy if exists "Users create inquiries" on public.inquiries;
create policy "Users create inquiries" on public.inquiries for insert with check (auth.uid() = user_id or user_id is null);
drop policy if exists "Users read own inquiries" on public.inquiries;
create policy "Users read own inquiries" on public.inquiries for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Users manage own recent views" on public.recent_views;
create policy "Users manage own recent views" on public.recent_views for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own search history" on public.search_history;
create policy "Users manage own search history" on public.search_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.regions (name, is_active, coming_soon)
values
  ('Jalal-Abad', true, false),
  ('Manas', true, false),
  ('Bishkek', false, true),
  ('Osh', false, true),
  ('Kant', false, true),
  ('Karakol', false, true),
  ('Naryn', false, true),
  ('Talas', false, true),
  ('Batken', false, true)
on conflict (name) do update set is_active = excluded.is_active, coming_soon = excluded.coming_soon;

insert into public.universities (name, short_name, city, region, description)
values
  ('Jalal-Abad International University', 'JAIU', 'Jalal-Abad', 'Jalal-Abad', 'International university housing area in Jalal-Abad.'),
  ('Jalal-Abad State University', 'JASU', 'Jalal-Abad', 'Jalal-Abad', 'Student housing near Jalal-Abad State University.'),
  ('Central Asian International Medical University', 'CAIMU', 'Jalal-Abad', 'Jalal-Abad', 'Medical student accommodation near CAIMU.')
on conflict do nothing;

insert into public.platform_settings (id, whatsapp_number, brand, currency, homepage_text)
values (1, '+996555011697', 'StudentNest', 'KGS', 'Safe, affordable student housing near your university.')
on conflict (id) do update
set
  whatsapp_number = excluded.whatsapp_number,
  brand = excluded.brand,
  currency = excluded.currency,
  homepage_text = excluded.homepage_text;

insert into storage.buckets (id, name, public)
values
  ('properties', 'properties', true),
  ('universities', 'universities', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public can read property storage" on storage.objects;
create policy "Public can read property storage" on storage.objects
for select using (bucket_id = 'properties');

drop policy if exists "Admins manage property storage" on storage.objects;
create policy "Admins manage property storage" on storage.objects
for all using (bucket_id = 'properties' and public.is_admin())
with check (bucket_id = 'properties' and public.is_admin());

drop policy if exists "Public can read university storage" on storage.objects;
create policy "Public can read university storage" on storage.objects
for select using (bucket_id = 'universities');

drop policy if exists "Admins manage university storage" on storage.objects;
create policy "Admins manage university storage" on storage.objects
for all using (bucket_id = 'universities' and public.is_admin())
with check (bucket_id = 'universities' and public.is_admin());

drop policy if exists "Users manage own avatars" on storage.objects;
create policy "Users manage own avatars" on storage.objects
for all using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
