export type UserRole = "client" | "master" | "admin";
export type MasterStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  role: UserRole;
  name: string | null;
  phone: string | null;
  created_at: string;
}

export interface Master {
  id: string;
  profile_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  city: string;
  trade: string;
  trades: string[];
  exp: number;
  description: string | null;
  hours: string | null;
  emergency: boolean;
  available: boolean;
  verified: boolean;
  status: MasterStatus;
  rating: number;
  reviews_count: number;
  jobs_count: number;
  is_new: boolean;
  is_featured: boolean;
  avatar_url: string | null;
  registered_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  master_id: string;
  reviewer_id: string | null;
  reviewer_name: string | null;
  rating: number;
  text: string | null;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  master_id: string;
  created_at: string;
}

export const TRADES = [
  { id: "ВиК",               en: "Plumber",          emoji: "🔧", category: "home" },
  { id: "Електротехник",     en: "Electrician",      emoji: "⚡", category: "home" },
  { id: "Зидар",             en: "Mason",             emoji: "🧱", category: "home" },
  { id: "Бояджия",           en: "Painter",           emoji: "🖌️", category: "home" },
  { id: "Дърводелец",        en: "Carpenter",         emoji: "🔨", category: "home" },
  { id: "Климатик",          en: "HVAC",              emoji: "❄️", category: "home" },
  { id: "Ключар",            en: "Locksmith",         emoji: "🔑", category: "home" },
  { id: "Фаянсаджия",        en: "Tiler",             emoji: "🔳", category: "home" },
  { id: "Покривен майстор",  en: "Roofer",            emoji: "🏠", category: "home" },
  { id: "Мазач",             en: "Plasterer",         emoji: "🎨", category: "home" },
  { id: "Шлосер",            en: "Metalworker",       emoji: "⚙️", category: "home" },
  { id: "Гипсокартон",       en: "Drywall",           emoji: "📐", category: "home" },
  { id: "Алуминиева дограма",en: "Glazier",           emoji: "🖼️", category: "home" },
  { id: "Тенекеджия",        en: "Auto Body",         emoji: "🚗", category: "auto" },
  { id: "Градинар",          en: "Gardener",          emoji: "🌿", category: "other" },
  { id: "Почистване",        en: "Cleaning",          emoji: "🧹", category: "other" },
  { id: "Компютърен техник", en: "IT Technician",     emoji: "💻", category: "tech" },
  { id: "Обущар",            en: "Cobbler",           emoji: "👟", category: "other" },
  { id: "Часовникар",        en: "Watchmaker",        emoji: "⌚", category: "other" },
  { id: "Шивач",             en: "Tailor",            emoji: "🧵", category: "other" },
  { id: "Тапицер",           en: "Upholsterer",       emoji: "🛋️", category: "other" },
  { id: "Соларни панели",    en: "Solar Panels",      emoji: "☀️", category: "home" },
] as const;

export const TRADE_MAP = Object.fromEntries(TRADES.map((t) => [t.id, t.emoji]));

export const CITIES = [
  "Варна","Добрич","Шумен","Велико Търново","Плевен","Русе","Разград","Силистра",
  "Габрово","Монтана","Враца","Видин","Ловеч","Търговище","Каварна","Балчик","Провадия",
  "София","Пловдив","Бургас","Стара Загора","Сливен","Ямбол","Хасково","Кърджали",
  "Смолян","Пазарджик","Благоевград","Перник","Несебър","Созопол","Казанлък",
  "Димитровград",
];
