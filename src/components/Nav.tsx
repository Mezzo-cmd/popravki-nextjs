"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useLang } from "@/contexts/LanguageContext";

interface Props {
  userId: string | null;
  favCount?: number;
}

export default function Nav({ userId, favCount = 0 }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const { lang, t, setLang } = useLang();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      padding: "0 1rem",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 54,
      boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,.4)" : "none",
      transition: "box-shadow .2s",
    }}>
      <Link href="/" style={{ display:"flex",alignItems:"center",gap:8,fontFamily:"var(--font-syne)",fontSize:16,fontWeight:800,color:"var(--text)",textDecoration:"none" }}>
        <div style={{ width:30,height:30,background:"var(--accent)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15 }}>🔧</div>
        Popravki<span style={{ color:"var(--accent)" }}>.bg</span>
      </Link>

      <div style={{ display:"flex",alignItems:"center",gap:6 }}>
        {/* BG / EN toggle */}
        <div style={{ display:"flex",borderRadius:8,border:"1px solid var(--border)",overflow:"hidden",fontFamily:"var(--font-inter)" }}>
          {(["bg","en"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              style={{ padding:"5px 10px",fontSize:11,fontWeight:700,border:"none",cursor:"pointer",background:lang===l?"var(--accent)":"var(--s2)",color:lang===l?"#000":"var(--muted)",textTransform:"uppercase",letterSpacing:".05em",transition:"all .15s" }}>
              {l}
            </button>
          ))}
        </div>

        {favCount > 0 && (
          <button style={{ padding:"6px 12px",fontSize:12,fontWeight:600,borderRadius:8,cursor:"pointer",border:"1px solid var(--border)",background:"var(--s2)",color:"var(--muted)",fontFamily:"var(--font-inter)" }}>
            ❤️ {t.nav.favorites} <span style={{ background:"var(--danger)",color:"#fff",borderRadius:"50%",padding:"0 5px",fontSize:10,marginLeft:4 }}>{favCount}</span>
          </button>
        )}
        <Link href="/register-majstor" style={{ padding:"6px 12px",fontSize:12,fontWeight:600,borderRadius:8,cursor:"pointer",border:"1px solid var(--accent)",background:"var(--accent)",color:"#000",textDecoration:"none",display:"inline-flex",alignItems:"center",fontFamily:"var(--font-inter)" }}>
          {t.nav.add}
        </Link>
        {userId ? (
          <>
            <Link href="/dashboard" style={{ padding:"6px 12px",fontSize:12,fontWeight:600,borderRadius:8,cursor:"pointer",border:"1px solid var(--border)",background:"var(--s2)",color:"var(--muted)",textDecoration:"none",fontFamily:"var(--font-inter)" }}>
              {t.nav.profile}
            </Link>
            <button onClick={handleLogout} style={{ padding:"6px 12px",fontSize:12,fontWeight:600,borderRadius:8,cursor:"pointer",border:"1px solid var(--border)",background:"var(--s2)",color:"var(--muted)",fontFamily:"var(--font-inter)" }}>
              {t.nav.logout}
            </button>
          </>
        ) : (
          <Link href="/login" style={{ padding:"6px 12px",fontSize:12,fontWeight:600,borderRadius:8,cursor:"pointer",border:"1px solid var(--border)",background:"var(--s2)",color:"var(--muted)",textDecoration:"none",fontFamily:"var(--font-inter)" }}>
            {t.nav.login}
          </Link>
        )}
      </div>
    </nav>
  );
}
