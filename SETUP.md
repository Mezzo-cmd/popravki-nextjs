# 🚀 Popravki.bg — Инструкции за deployment

## Стъпка 1: Supabase проект

### 1.1 Създай акаунт и проект
1. Отиди на **https://supabase.com** → Sign Up (безплатно)
2. Кликни **New Project**
3. Попълни:
   - **Name:** `popravki-bg`
   - **Database Password:** (запомни го!)
   - **Region:** `EU Central 1 (Frankfurt)` — най-близо до България
4. Изчакай ~2 минути докато проектът се стартира

### 1.2 Изпълни SQL Schema
1. В Supabase → **SQL Editor** → **New query**
2. Копирай съдържанието на `supabase/schema.sql`
3. Кликни **Run** (▶)
4. Трябва да видиш "Success. No rows returned"

### 1.3 Вземи credentials
Отиди в **Settings → API** и копирай:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 1.4 Настрой Authentication
В **Authentication → Settings**:
- **Site URL:** `https://твоят-домейн.vercel.app`
- **Redirect URLs:** Добави `https://твоят-домейн.vercel.app/auth/callback`
- По желание: активирай **Google OAuth** (Authentication → Providers → Google)

### 1.5 Направи се Admin
След като стартираш сайта и се регистрираш:
```sql
-- Изпълни в SQL Editor
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'ТВОЯТ_USER_ID';
```
Намери ID-то в **Authentication → Users**.

---

## Стъпка 2: Vercel deployment

### 2.1 Инсталирай зависимости локално (за тест)
```bash
cd popravki-nextjs
npm install
```

### 2.2 Създай .env.local
```bash
cp .env.local.example .env.local
# После попълни с истинските стойности от Supabase
```

### 2.3 Тествай локално
```bash
npm run dev
# Отвори http://localhost:3000
```

### 2.4 Deploy на Vercel
**Опция А — GitHub (препоръчано):**
1. Качи проекта в GitHub repo
2. Отиди на **https://vercel.com** → New Project
3. Import-ни GitHub repo-то
4. Добави Environment Variables (от .env.local)
5. Кликни **Deploy**

**Опция Б — Vercel CLI:**
```bash
npm install -g vercel
vercel login
vercel --prod
# При въпрос за env variables → добави ги
```

### 2.5 Добави env variables в Vercel
В Vercel → Project → Settings → Environment Variables добави:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_EMAILS=твоят@email.bg
```

---

## Структура на проекта

```
popravki-nextjs/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Главна страница
│   │   ├── login/page.tsx        ← Вход / регистрация
│   │   ├── register-majstor/     ← Регистрация на майстор (4 стъпки)
│   │   ├── admin/page.tsx        ← Админ панел (защитен)
│   │   ├── auth/callback/        ← OAuth callback
│   │   └── api/
│   │       ├── masters/          ← REST API за майстори
│   │       └── reviews/          ← REST API за отзиви
│   ├── components/
│   │   ├── HomeClient.tsx        ← Главна страница (клиентски)
│   │   ├── MasterCard.tsx        ← Карта на майстор
│   │   ├── MasterModal.tsx       ← Модал с детайли
│   │   ├── AdminClient.tsx       ← Админ панел (клиентски)
│   │   ├── Nav.tsx               ← Навигация
│   │   └── Toast.tsx             ← Toast нотификации
│   ├── lib/
│   │   ├── types.ts              ← TypeScript типове
│   │   └── supabase/
│   │       ├── client.ts         ← Browser Supabase клиент
│   │       └── server.ts         ← Server Supabase клиент
│   └── middleware.ts             ← Защита на маршрути
├── supabase/
│   └── schema.sql               ← База данни + RLS политики
├── .env.local.example
├── package.json
└── SETUP.md
```

---

## Роли в системата

| Роля     | Достъп                                    |
|----------|-------------------------------------------|
| `client` | Разглежда майстори, пише отзиви, любими   |
| `master` | + Редактира своя профил, вижда Dashboard  |
| `admin`  | + Одобрява/отхвърля регистрации, пълен достъп |

---

## Бази данни — Таблици

| Таблица    | Описание                        |
|------------|---------------------------------|
| `profiles` | Разширява auth.users с роля     |
| `masters`  | Всички майстори (pending/approved/rejected) |
| `reviews`  | Отзиви с автоматичен рейтинг    |
| `favorites`| Любими майстори по потребител   |
| `reports`  | Доклади за нередности           |

---

## Полезни команди

```bash
# Локален dev сървър
npm run dev

# Build за production
npm run build

# Стартиране на production build
npm start

# Lint проверка
npm run lint
```

---

## 🆘 Честа грешка

**"Cannot find module '@/lib/supabase/client'"**
→ Увери се, че `tsconfig.json` съдържа `"paths": { "@/*": ["./src/*"] }`

**"Row Level Security policy violation"**
→ Провери RLS политиките в Supabase → Authentication → Policies

**Admin панелът казва "unauthorized"**
→ Изпълни SQL-а от Стъпка 1.5 за да промениш ролята си

---

*Popravki.bg — Next.js 14 + Supabase + Vercel*
