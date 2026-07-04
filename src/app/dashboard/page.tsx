"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Master, Profile } from "@/lib/types";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [master, setMaster] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login?redirect=/dashboard"); return; }

      const { data: prof } = await supabase
        .from("profiles").select("*").eq("id", user.id).single();
      setProfile(prof);

      const { data: mast } = await supabase
        .from("masters").select("*").eq("profile_id", user.id).single();
      setMaster(mast);

      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) return (
    <div style={{ minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div style={{ color:"var(--muted)",fontSize:14 }}>Зареждане...</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg)",padding:"2rem 1rem" }}>
      <div style={{ maxWidth:700,margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"2rem" }}>
          <Link href="/" style={{ color:"var(--muted)",fontSize:13,textDecoration:"none" }}>← Към сайта</Link>
          <h1 style={{ fontFamily:"var(--font-syne)",fontSize:22,fontWeight:800,color:"var(--text)" }}>Моят профил</h1>
          <div />
        </div>

        {/* Profile card */}
        <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:"1.5rem",marginBottom:"1.5rem" }}>
          <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:"1rem" }}>
            <div style={{ width:56,height:56,borderRadius:"50%",background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:"#000" }}>
              {profile?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <div style={{ fontFamily:"var(--font-syne)",fontSize:18,fontWeight:800,color:"var(--text)" }}>{profile?.name ?? "—"}</div>
              <div style={{ fontSize:12,color:"var(--muted)",marginTop:2 }}>
                {profile?.role === "admin" ? "🛡️ Администратор" : profile?.role === "master" ? "🔧 Майстор" : "👤 Клиент"}
              </div>
            </div>
          </div>
          {profile?.phone && (
            <div style={{ fontSize:13,color:"var(--muted)" }}>📞 {profile.phone}</div>
          )}
        </div>

        {/* Master stats (if master) */}
        {master && (
          <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:"1.5rem",marginBottom:"1.5rem" }}>
            <h2 style={{ fontFamily:"var(--font-syne)",fontSize:16,fontWeight:800,color:"var(--text)",marginBottom:"1rem" }}>Статистика</h2>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
              {[
                { label:"Оценка", value: master.rating ? `★ ${master.rating}` : "—" },
                { label:"Отзиви", value: master.reviews_count ?? 0 },
                { label:"Проекти", value: master.jobs_count ?? 0 },
              ].map(s => (
                <div key={s.label} style={{ background:"var(--s2)",borderRadius:12,padding:"1rem",textAlign:"center" }}>
                  <div style={{ fontSize:22,fontWeight:800,fontFamily:"var(--font-syne)",color:"var(--accent)" }}>{s.value}</div>
                  <div style={{ fontSize:11,color:"var(--muted)",marginTop:4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:"1rem",display:"flex",gap:8,flexWrap:"wrap" }}>
              <span style={{ padding:"4px 12px",borderRadius:20,fontSize:12,background:"var(--s2)",color:"var(--muted)" }}>🏙️ {master.city}</span>
              <span style={{ padding:"4px 12px",borderRadius:20,fontSize:12,background:"var(--s2)",color:"var(--muted)" }}>🔧 {master.trade}</span>
              <span style={{ padding:"4px 12px",borderRadius:20,fontSize:12,
                background: master.status === "approved" ? "#14532d" : master.status === "pending" ? "#713f12" : "#7f1d1d",
                color: master.status === "approved" ? "#86efac" : master.status === "pending" ? "#fde68a" : "#fca5a5"
              }}>
                {master.status === "approved" ? "✅ Одобрен" : master.status === "pending" ? "⏳ Чака одобрение" : "❌ Отхвърлен"}
              </span>
            </div>
          </div>
        )}

        {/* Admin link */}
        {profile?.role === "admin" && (
          <Link href="/admin" style={{ display:"block",padding:"1rem 1.5rem",background:"var(--accent)",color:"#000",borderRadius:12,fontFamily:"var(--font-syne)",fontWeight:700,fontSize:14,textDecoration:"none",textAlign:"center",marginBottom:"1rem" }}>
            🛡️ Към Админ панела
          </Link>
        )}

        {/* Not a master yet */}
        {!master && profile?.role !== "admin" && (
          <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:16,padding:"1.5rem",textAlign:"center" }}>
            <div style={{ fontSize:36,marginBottom:8 }}>🔧</div>
            <div style={{ fontFamily:"var(--font-syne)",fontSize:16,fontWeight:700,color:"var(--text)",marginBottom:8 }}>Искаш повече клиенти?</div>
            <div style={{ fontSize:13,color:"var(--muted)",marginBottom:"1rem" }}>Регистрирай се като майстор и се появи в директорията.</div>
            <Link href="/register-majstor" style={{ display:"inline-block",padding:"10px 24px",background:"var(--accent)",color:"#000",borderRadius:10,fontWeight:700,fontSize:13,textDecoration:"none" }}>
              Регистрирай се →
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
