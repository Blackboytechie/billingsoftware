-- Create profiles table
create table if not exists public.profiles (
	id uuid references auth.users(id) primary key,
	company_id bigint references public.companies(id),
	created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Drop existing policies
drop policy if exists "Users can manage own profile" on public.profiles;
drop policy if exists "Enable insert for authenticated users only" on public.profiles;
drop policy if exists "Enable read access for users" on public.profiles;
drop policy if exists "Enable update for users" on public.profiles;

-- Create unified policy for all operations
create policy "Enable all operations for own profile"
on public.profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);
