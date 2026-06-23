-- ═══════════════════════════════════════════════════
-- POPRAVKI.BG — Supabase Database Schema
-- Изпълни в: supabase.com → SQL Editor → New query
-- ═══════════════════════════════════════════════════

-- ── EXTENSIONS ──
create extension if not exists "uuid-ossp";

-- ── ENUMS ──
create type user_role as enum ('client', 'master', 'admin');
create type master_status as enum ('pending', 'approved', 'rejected');

-- ════════════════════════════════════════
-- ТАБЛИЦА: profiles (разширява auth.users)
-- ════════════════════════════════════════
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role not null default 'client',
  name        text,
  phone       text,
  created_at  timestamptz default now()
);

-- Автоматично създаване на profile при регистрация
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client'),
    coalesce(new.raw_user_meta_data->>'name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ════════════════════════════════════════
-- ТАБЛИЦА: masters
-- ════════════════════════════════════════
create table public.masters (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid references public.profiles(id) on delete set null,
  name          text not null,
  phone         text not null,
  email         text,
  city          text not null,
  trade         text not null,          -- Основен занаят
  trades        text[] not null default '{}', -- Всички занаяти
  exp           int not null default 1,
  description   text,
  hours         text,                   -- Работно време (напр. "Пн/Вт/Ср: 09:00-18:00")
  emergency     boolean default false,  -- Аварийна услуга 24/7
  available     boolean default true,
  verified      boolean default false,
  status        master_status default 'pending',
  rating        numeric(3,1) default 5.0,
  reviews_count int default 0,
  jobs_count    int default 0,
  is_new        boolean default true,
  is_featured   boolean default false,
  avatar_url    text,
  registered_at timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ════════════════════════════════════════
-- ТАБЛИЦА: reviews
-- ════════════════════════════════════════
create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  master_id   uuid not null references public.masters(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  reviewer_name text,                   -- Ако не е логнат
  rating      int not null check (rating between 1 and 5),
  text        text,
  created_at  timestamptz default now()
);

-- Автоматично обновяване на рейтинг след нов отзив
create or replace function update_master_rating()
returns trigger language plpgsql as $$
begin
  update public.masters
  set
    rating = (select round(avg(rating)::numeric, 1) from public.reviews where master_id = new.master_id),
    reviews_count = (select count(*) from public.reviews where master_id = new.master_id),
    updated_at = now()
  where id = new.master_id;
  return new;
end;
$$;

create trigger after_review_insert
  after insert on public.reviews
  for each row execute procedure update_master_rating();

-- ════════════════════════════════════════
-- ТАБЛИЦА: favorites
-- ════════════════════════════════════════
create table public.favorites (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  master_id uuid not null references public.masters(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, master_id)
);

-- ════════════════════════════════════════
-- ТАБЛИЦА: reports (доклади за майстори)
-- ════════════════════════════════════════
create table public.reports (
  id          uuid primary key default uuid_generate_v4(),
  master_id   uuid not null references public.masters(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason      text not null,
  created_at  timestamptz default now()
);

-- ════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════

-- profiles
alter table public.profiles enable row level security;

create policy "Потребителят вижда само своя профил"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Потребителят редактира своя профил"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admin вижда всички профили"
  on public.profiles for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- masters: одобрените се виждат от всички, чакащите само от admin
alter table public.masters enable row level security;

create policy "Всички виждат одобрените майстори"
  on public.masters for select
  using (status = 'approved' or auth.uid() = profile_id);

create policy "Admin вижда всички майстори"
  on public.masters for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Майстор редактира своя профил"
  on public.masters for update
  using (auth.uid() = profile_id);

create policy "Всеки може да регистрира майстор"
  on public.masters for insert
  with check (true);

-- reviews
alter table public.reviews enable row level security;

create policy "Всички виждат отзивите"
  on public.reviews for select using (true);

create policy "Логнат потребител може да пише отзив"
  on public.reviews for insert
  with check (auth.uid() is not null);

-- favorites
alter table public.favorites enable row level security;

create policy "Потребителят вижда своите любими"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Потребителят управлява своите любими"
  on public.favorites for all
  using (auth.uid() = user_id);

-- reports
alter table public.reports enable row level security;

create policy "Admin вижда всички доклади"
  on public.reports for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Логнат потребител може да докладва"
  on public.reports for insert
  with check (auth.uid() is not null);

-- ════════════════════════════════════════
-- ИНДЕКСИ за по-бързо търсене
-- ════════════════════════════════════════
create index idx_masters_status    on public.masters(status);
create index idx_masters_city      on public.masters(city);
create index idx_masters_trade     on public.masters(trade);
create index idx_masters_rating    on public.masters(rating desc);
create index idx_masters_emergency on public.masters(emergency) where emergency = true;
create index idx_reviews_master    on public.reviews(master_id);
create index idx_favorites_user    on public.favorites(user_id);

-- ════════════════════════════════════════
-- DEMO ДАННИ (по желание)
-- Изпълни само ако искаш тестови записи
-- ════════════════════════════════════════
insert into public.masters (name, phone, email, city, trade, trades, exp, description, emergency, available, verified, status, rating, reviews_count, jobs_count, is_featured) values
('Иван Петров',     '0888 111 222', 'ivan@mail.bg',   'Варна',   'ВиК',           array['ВиК'],                     15, 'Опитен ВиК майстор с 15 год. опит. Ремонтирам тръби, сифони, бойлери.',          true,  true, true, 'approved', 4.9, 47, 312, true),
('Георги Стоянов',  '0888 333 444', 'georgi@mail.bg', 'Варна',   'Електротехник', array['Електротехник'],            10, 'Електроинсталации, разпределителни табла, диагностика.',                          false, true, true, 'approved', 4.8, 31, 189, false),
('Мартин Колев',    '0888 555 666', 'martin@mail.bg', 'Варна',   'Климатик',      array['Климатик'],                  8, 'Монтаж и сервиз климатици всички марки. Идвам в деня на обаждането.',             true,  true, true, 'approved', 4.7, 28, 145, false),
('Димитър Иванов',  '0888 777 888', 'dimi@mail.bg',   'София',   'Зидар',         array['Зидар','Мазач'],            20, 'Зидарски и мазачески работи. Ремонт на апартаменти под ключ.',                   false, true, true, 'approved', 4.6, 52, 421, true),
('Стефан Николов',  '0888 999 000', 'stefan@mail.bg', 'Пловдив', 'Бояджия',       array['Бояджия'],                  12, 'Боядисване на стаи, апартаменти и офиси. Използвам само качествени материали.', false, true, true, 'approved', 4.8, 38, 267, false),
('Петър Михайлов',  '0888 121 212', 'petar@mail.bg',  'Варна',   'Ключар',        array['Ключар'],                    6, 'Аварийно отваряне на врати 24/7. Смяна на патрони и брави.',                     true,  true, true, 'approved', 4.9, 19, 94,  false),
('Тодор Василев',   '0888 313 131', 'todor@mail.bg',  'Бургас',  'Дърводелец',    array['Дърводелец','Гипсокартон'],  9, 'Изработка на мебели по поръчка, монтаж на гипсокартон.',                         false, true, true, 'approved', 4.5, 22, 118, false),
('Николай Генчев',  '0888 414 141', 'niki@mail.bg',   'София',   'Електротехник', array['Електротехник','Климатик'], 14, 'Пълен електромонтаж. Сервиз климатици.',                                         true,  true, true, 'approved', 4.7, 44, 298, true),
('Борислав Атанасов','0888 515 151','bor@mail.bg',    'Русе',    'ВиК',           array['ВиК','Фаянсаджия'],         11, 'ВиК инсталации и фаянс. Ремонт бани и тоалетни.',                                false, true, true, 'approved', 4.6, 33, 201, false),
('Красимир Тодоров','0888 616 161', 'krasi@mail.bg',  'Варна',   'Покривен майстор', array['Покривен майстор'],       18, 'Ремонт и хидроизолация на покриви. Безплатна консултация.',                      false, false,true, 'approved', 4.8, 29, 176, false);
