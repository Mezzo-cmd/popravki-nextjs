import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Rate Limiter (in-memory, Edge-compatible) ──────────────────────────────
// Пази IP → { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true; // OK
  }
  if (entry.count >= limit) return false; // блокиран
  entry.count++;
  return true; // OK
}

// Почиства стари записи на всеки ~500 заявки
let cleanupCounter = 0;
function maybeCleanup() {
  if (++cleanupCounter % 500 !== 0) return;
  const now = Date.now();
  Array.from(rateLimitMap.entries()).forEach(([key, val]) => {
    if (now > val.resetAt) rateLimitMap.delete(key);
  });
}

export async function middleware(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const path = request.nextUrl.pathname;

  maybeCleanup();

  // Rate limit за login/register: макс 10 опита на 60 секунди
  if (path === "/login" || path === "/register" || path === "/register-majstor") {
    if (!rateLimit(ip, 10, 60_000)) {
      return new NextResponse("Твърде много опити. Изчакай малко.", {
        status: 429,
        headers: { "Retry-After": "60", "Content-Type": "text/plain; charset=utf-8" },
      });
    }
  }

  // Rate limit за admin: макс 20 заявки на 60 секунди
  if (path.startsWith("/admin")) {
    if (!rateLimit(`admin:${ip}`, 20, 60_000)) {
      return new NextResponse("Rate limit exceeded.", { status: 429 });
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Защита на admin маршрути
  if (path.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login?redirect=/admin", request.url));
    }
    // Проверка за admin роля — с service role за да заобиколим RLS
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/?error=unauthorized", request.url));
    }
  }

  // Защита на майсторски dashboard
  if (path.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login?redirect=/dashboard", request.url));
    }
  }

  // Вече логнат потребител → пренасочи от /login
  if ((path === "/login" || path === "/register") && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/login", "/register", "/register-majstor"],
};
