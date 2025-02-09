-- Drop all existing policies
drop policy if exists "Users can view own company" on public.companies;
drop policy if exists "Users can manage own company" on public.companies;
drop policy if exists "Users can create company" on public.companies;
drop policy if exists "Users can update own company" on public.companies;
drop policy if exists "Users can delete own company" on public.companies;
drop policy if exists "Enable read by email during auth" on public.companies;
drop policy if exists "Enable public read access" on public.companies;
drop policy if exists "Enable read access for all" on public.companies;
drop policy if exists "Allow all reads" on public.companies;
drop policy if exists "Allow own company updates" on public.companies;
drop policy if exists "public_read_access" on public.companies;
drop policy if exists "authenticated_update_access" on public.companies;

-- Disable RLS temporarily
alter table public.companies disable row level security;

-- Re-enable RLS
alter table public.companies enable row level security;

-- Create read policy for authenticated users
create policy "allow_company_reads"
on public.companies
for select
using (
	id in (
		select company_id 
		from public.profiles 
		where id = auth.uid()
	)
);

-- Create restricted update policy for company owners
create policy "allow_company_updates"
on public.companies
for update
using (
	id in (
		select company_id 
		from public.profiles 
		where id = auth.uid()
	)
);


