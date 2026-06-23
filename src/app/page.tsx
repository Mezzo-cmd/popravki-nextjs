import { createClient, createAdminClient } from "@/lib/supabase/server";
import HomeClient from "@/components/HomeClient";
import type { Master } from "@/lib/types";

export const revalidate = 0; // Без кеш в development

export default async function HomePage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Service role — заобикаля RLS, вижда всички одобрени майстори
  const { data: masters = [] } = await adminSupabase
    .from("masters")
    .select("*")
    .eq("status", "approved")
    .order("is_featured", { ascending: false })
    .order("rating", { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();

  let favorites: string[] = [];
  if (user) {
    const { data } = await supabase
      .from("favorites")
      .select("master_id")
      .eq("user_id", user.id);
    favorites = (data ?? []).map((f) => f.master_id);
  }

  return (
    <HomeClient
      initialMasters={(masters as Master[]) ?? []}
      userId={user?.id ?? null}
      initialFavorites={favorites}
    />
  );
}
