-- =====================================================================
-- หนองบัว INSIDER : โครงสร้างฐานข้อมูล Supabase
-- วิธีใช้: Supabase Dashboard → SQL Editor → วางไฟล์นี้ทั้งหมด → Run
-- (รันซ้ำได้ ไม่ลบข้อมูลเดิม)
-- =====================================================================

-- ---------- ตารางรายชื่อแอดมิน (เฉพาะอีเมลในตารางนี้ที่แก้ไขข้อมูลได้) ----------
create table if not exists public.admin_users (
  email text primary key
);
alter table public.admin_users enable row level security;
-- ไม่มี policy = ไม่มีใครอ่าน/เขียนผ่าน API ได้ (เพิ่มอีเมลผ่าน SQL Editor เท่านั้น)

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------- collections ----------
create table if not exists public.insider_tips (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  district text not null check (district in ('เมืองหนองบัวลำภู','นากลาง','โนนสัง','ศรีบุญเรือง','สุวรรณคูหา','นาวัง')),
  image_url text default '',
  content text default '',
  source text default 'หนองบัว INSIDER',
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.agency_sites (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  url text not null,
  category text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.fb_posts (
  id text primary key default gen_random_uuid()::text,
  page_name text not null,
  embed_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ad_banners (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  image_url text default '',
  link text default '',
  position text not null default 'top' check (position in ('top','side','feed')),
  price integer not null default 300 check (price in (300,500,800)),
  active boolean not null default true,
  views integer not null default 0,
  owner text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.app_config (
  id text primary key default 'config',
  promptpay_number text default '',
  repo_url text default 'https://github.com/suriyaolif10-coder/nongbuainsider',
  hero_image_url text default '',
  created_at timestamptz not null default now()
);
alter table public.app_config add column if not exists hero_image_url text default '';

-- ---------- Row Level Security: ทุกคนอ่านได้ / แอดมินเท่านั้นที่เขียนได้ ----------
do $$
declare t text;
begin
  foreach t in array array['insider_tips','agency_sites','fb_posts','ad_banners','app_config'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ---------- นับยอดวิวโฆษณา (views++) : ผู้เข้าชมทั่วไปเรียกได้ แต่แก้ได้แค่ views ----------
create or replace function public.increment_ad_view(ad_id text)
returns void language sql security definer set search_path = public as $$
  update public.ad_banners set views = views + 1 where id = ad_id and active;
$$;
revoke all on function public.increment_ad_view(text) from public;
grant execute on function public.increment_ad_view(text) to anon, authenticated;

-- ---------- ข้อมูลเริ่มต้น ----------
insert into public.app_config (id) values ('config') on conflict (id) do nothing;

insert into public.agency_sites (id, name, url, category) values
  ('a1', 'ศาลากลางจังหวัดหนองบัวลำภู', 'http://www.nongbualamphu.go.th', 'หน่วยงานจังหวัด'),
  ('a2', 'สำนักงานประชาสัมพันธ์จังหวัดหนองบัวลำภู', 'https://nongbualamphu.prd.go.th', 'หน่วยงานจังหวัด'),
  ('a4', 'สำนักงานคลังจังหวัดหนองบัวลำภู', 'https://nongbualamphu.treasury.go.th/th/', 'หน่วยงานจังหวัด'),
  ('a5', 'สำนักงานพาณิชย์จังหวัดหนองบัวลำภู', 'https://nongbualamphu.moc.go.th', 'หน่วยงานจังหวัด'),
  ('a6', 'สำนักงานสถิติจังหวัดหนองบัวลำภู', 'https://nongbualamphu.nso.go.th', 'หน่วยงานจังหวัด'),
  ('a7', 'สำนักงานทรัพยากรธรรมชาติและสิ่งแวดล้อมจังหวัดหนองบัวลำภู', 'https://nongbualamphu.mnre.go.th/th/index', 'หน่วยงานจังหวัด'),
  ('a8', 'ตรวจคนเข้าเมืองจังหวัดหนองบัวลำภู', 'https://nongbualamphu.immigration.go.th', 'หน่วยงานจังหวัด'),
  ('a9', 'องค์การบริหารส่วนจังหวัดหนองบัวลำภู (อบจ.)', 'https://nppao.go.th/public/', 'ท้องถิ่น'),
  ('a10', 'โรงพยาบาลหนองบัวลำภู', 'https://nbhospital.moph.go.th/public/', 'สาธารณสุข'),
  ('a11', 'สำนักงานสาธารณสุขจังหวัดหนองบัวลำภู (เพจ Facebook)', 'https://www.facebook.com/nblp.pho/', 'สาธารณสุข'),
  ('a12', 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษาหนองบัวลำภู เขต 1', 'https://nb1.go.th', 'การศึกษา')
on conflict (id) do nothing;

-- =====================================================================
-- ขั้นสุดท้าย: เพิ่มอีเมลแอดมิน (แก้เป็นอีเมลของคุณ แล้วรันบรรทัดนี้)
-- insert into public.admin_users (email) values ('your-email@example.com');
-- =====================================================================
