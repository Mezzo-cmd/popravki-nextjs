export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AdminClient from "@/components/AdminClient";
import type { Master } from "@/lib/types";

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/admin");

  // Проверка за admin роля — с service role за да заобиколим RLS
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/?error=unauthorized");

  // Зареди всички регистрации (включително чакащи) — с service role
  const { data: masters = [] } = await supabaseAdmin
    .from("masters")
    .select("*")
    .order("registered_at", { ascending: false });

  return <AdminClient masters={(masters as Master[]) ?? []} />;
}
