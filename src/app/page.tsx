import { createClient, createAdminClient } from "@/lib/supabase/server";
import HomeClient from "@/components/HomeClient";
import type { Master } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let masters: Master[] = [];
  let userId: string | null = null;
  let favorites: string[] = [];

  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data } = await adminSupabase
      .from("masters")
      .select("*")
      .eq("status", "approved")
      .order("is_featured", { ascending: false })
      .order("rating", { ascending: false });

    masters = (data as Master[]) ?? [];

    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;

    if (user) {
      const { data: favData } = await supabase
        .from("favorites")
        .select("master_id")
        .eq("user_id", user.id);
      favorites = (favData ?? []).map((f: { master_id: string }) => f.master_id);
    }
  } catch (err) {
    console.error("HomePage Supabase error:", err);
  }

  return (
    <HomeClient
      initialMasters={masters}
      userId={userId}
      initialFavorites={favorites}
    />
  );
}
