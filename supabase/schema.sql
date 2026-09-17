create extension if not exists pgcrypto;

drop type if exists user_role cascade; create type user_role as enum ('ADMIN','TRADER','DRIVER');
drop type if exists shipment_status cascade; create type shipment_status as enum ('REQUESTED','PICKED_UP','IN_TRANSIT','CHECKPOINT','DELAYED','CUSTOMS','DELIVERED');
drop type if exists route_status cascade; create type route_status as enum ('OPEN','CLOSED');
drop type if exists alert_severity cascade; create type alert_severity as enum ('NORMAL','WARNING','HIGH');

create table if not exists profiles(id uuid primary key references auth.users(id) on delete cascade,name text not null,email text,role user_role not null default 'TRADER',created_at timestamptz default now());
create table if not exists routes(id uuid primary key default gen_random_uuid(),name text not null,origin text not null,destination text not null,status route_status not null default 'OPEN',description text,updated_at timestamptz default now());
create table if not exists shipments(id uuid primary key default gen_random_uuid(),tracking_number text unique not null,trader_id uuid references profiles(id),driver_id uuid references profiles(id),route_id uuid references routes(id),cargo_description text not null,origin text not null,destination text not null,status shipment_status not null default 'REQUESTED',latitude double precision default 16.8409,longitude double precision default 96.1735,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists shipment_events(id uuid primary key default gen_random_uuid(),shipment_id uuid references shipments(id) on delete cascade,status shipment_status not null,description text,latitude double precision,longitude double precision,created_by uuid references profiles(id),created_at timestamptz default now());
create table if not exists alerts(id uuid primary key default gen_random_uuid(),route_id uuid references routes(id),shipment_id uuid references shipments(id) on delete cascade,recipient_id uuid references profiles(id),message text not null,severity alert_severity not null default 'NORMAL',is_read boolean default false,created_at timestamptz default now());
create table if not exists documents(id uuid primary key default gen_random_uuid(),shipment_id uuid references shipments(id) on delete cascade,driver_id uuid references profiles(id),file_name text not null,file_url text not null,document_type text not null,created_at timestamptz default now());

create or replace function public.current_role() returns user_role language sql stable security definer set search_path=public as $$ select role from profiles where id=auth.uid() $$;

alter table profiles enable row level security; alter table routes enable row level security; alter table shipments enable row level security; alter table shipment_events enable row level security; alter table alerts enable row level security; alter table documents enable row level security;

drop policy if exists profiles_read on profiles; create policy profiles_read on profiles for select to authenticated using (id=auth.uid() or public.current_role()='ADMIN');
drop policy if exists routes_read on routes; create policy routes_read on routes for select to authenticated using (true);
drop policy if exists routes_admin on routes; create policy routes_admin on routes for all to authenticated using (public.current_role()='ADMIN') with check (public.current_role()='ADMIN');
drop policy if exists shipments_read on shipments; create policy shipments_read on shipments for select to authenticated using (public.current_role()='ADMIN' or trader_id=auth.uid() or driver_id=auth.uid());
drop policy if exists shipments_insert on shipments; create policy shipments_insert on shipments for insert to authenticated with check (public.current_role()='ADMIN' or (public.current_role()='TRADER' and trader_id=auth.uid()));
drop policy if exists shipments_update on shipments; create policy shipments_update on shipments for update to authenticated using (public.current_role()='ADMIN' or (public.current_role()='DRIVER' and driver_id=auth.uid())) with check (public.current_role()='ADMIN' or (public.current_role()='DRIVER' and driver_id=auth.uid()));
drop policy if exists events_read on shipment_events; create policy events_read on shipment_events for select to authenticated using (exists(select 1 from shipments s where s.id=shipment_id and (public.current_role()='ADMIN' or s.trader_id=auth.uid() or s.driver_id=auth.uid())));
drop policy if exists events_insert on shipment_events; create policy events_insert on shipment_events for insert to authenticated with check (created_by=auth.uid() and exists(select 1 from shipments s where s.id=shipment_id and (public.current_role()='ADMIN' or s.driver_id=auth.uid())));
drop policy if exists alerts_read on alerts; create policy alerts_read on alerts for select to authenticated using (public.current_role()='ADMIN' or recipient_id=auth.uid());
drop policy if exists docs_read on documents; create policy docs_read on documents for select to authenticated using (public.current_role()='ADMIN' or driver_id=auth.uid() or exists(select 1 from shipments s where s.id=shipment_id and s.trader_id=auth.uid()));
drop policy if exists docs_insert on documents; create policy docs_insert on documents for insert to authenticated with check (driver_id=auth.uid() and public.current_role()='DRIVER');

create or replace function public.set_route_status(p_route_id uuid,p_status route_status) returns void language plpgsql security definer set search_path=public as $$
declare r record; begin if public.current_role() <> 'ADMIN' then raise exception 'Admin only'; end if; update routes set status=p_status,updated_at=now() where id=p_route_id returning * into r; if p_status='CLOSED' then insert into alerts(route_id,shipment_id,recipient_id,message,severity) select r.id,s.id,s.trader_id,r.name||' is closed. Your shipment may be delayed.','WARNING' from shipments s where s.route_id=r.id and s.status<>'DELIVERED'; insert into alerts(route_id,shipment_id,recipient_id,message,severity) select r.id,s.id,s.driver_id,r.name||' is closed. Your shipment may be delayed.','WARNING' from shipments s where s.route_id=r.id and s.status<>'DELIVERED' and s.driver_id is not null; end if; end $$;

insert into routes(name,origin,destination,status,description) values ('Yangon → Mandalay → Lashio → Muse','Yangon','Muse','OPEN','Demonstration route'),('Yangon → Bago → Naypyidaw → Myawaddy','Yangon','Myawaddy','OPEN','Demonstration route') on conflict do nothing;

alter publication supabase_realtime add table shipments; alter publication supabase_realtime add table shipment_events; alter publication supabase_realtime add table alerts; alter publication supabase_realtime add table routes;
