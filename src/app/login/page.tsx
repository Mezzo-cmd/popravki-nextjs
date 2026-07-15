"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"client" | "master">("client");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push(redirect);
    router.refresh();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, role } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess("Провери имейла си за потвърждение!");
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}` },
    });
  };

  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",background:"var(--bg)" }}>
      <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,padding:"2rem",maxWidth:380,width:"100%" }}>
        <Link href="/" style={{ display:"flex",alignItems:"center",gap:8,fontFamily:"var(--font-syne)",fontSize:16,fontWeight:800,color:"var(--text)",textDecoration:"none",marginBottom:"1.5rem",justifyContent:"center" }}>
          <div style={{ width:30,height:30,background:"var(--accent)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center" }}>🔧</div>
          Popravki<span style={{ color:"var(--accent)" }}>.net</span>
        </Link>

        {/* Tabs */}
        <div style={{ display:"flex",gap:2,background:"var(--s2)",borderRadius:9,padding:3,marginBottom:"1.2rem" }}>
          {(["login","signup"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex:1,padding:"8px",fontSize:12,fontWeight:600,border:"none",borderRadius:7,background:tab===t?"var(--s3)":"transparent",color:tab===t?"var(--text)":"var(--muted)",cursor:"pointer",fontFamily:"var(--font-inter)" }}>
              {t==="login"?"Вход":"Регистрация"}
            </button>
          ))}
        </div>

        {success ? (
          <div style={{ textAlign:"center",padding:"1rem" }}>
            <div style={{ fontSize:40,marginBottom:12 }}>📧</div>
            <h3 style={{ fontFamily:"var(--font-syne)",fontSize:18,fontWeight:800,marginBottom:8 }}>Провери имейла си</h3>
            <p style={{ fontSize:14,color:"var(--muted)" }}>{success}</p>
          </div>
        ) : (
          <form onSubmit={tab === "login" ? handleLogin : handleSignup}>
            {tab === "signup" && (
              <>
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:11,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:4 }}>Пълно Иmе *</label>
                  <input type="text" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Иван Петров" required
                    style={{ width:"100%",background:"var(--s2)",border:"1.5px solid var(--border)",borderRadius:10,padding:"11px 13px",fontSize:14,fontFamily:"var(--font-inter)",color:"var(--text)",outline:"none" }}
                    onFocus={(e)=>e.target.style.borderColor="var(--accent)"}
                    onBlur={(e)=>e.target.style.borderColor="var(--border)"}/>
                </div>
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:11,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:4 }}>Регистрирам се като</label>
                  <div style={{ display:"flex",gap:8 }}>
                    {(["client","master"] as const).map((r) => (
                      <button type="button" key={r} onClick={() => setRole(r)}
                        style={{ flex:1,padding:"9px",borderRadius:9,border:`1.5px solid ${role===r?"var(--accent)":"var(--border)"}`,background:role===r?"rgba(0,229,160,.08)":"var(--s2)",color:role===r?"var(--accent)":"var(--muted)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"var(--font-inter)" }}>
                        {r==="client"?"👤 Клиент":"🔧 Майстор"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:4 }}>Имейл *</label>
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="ivan@mail.bg" required
                style={{ width:"100%",background:"var(--s2)",border:"1.5px solid var(--border)",borderRadius:10,padding:"11px 13px",fontSize:14,fontFamily:"var(--font-inter)",color:"var(--text)",outline:"none" }}
                onFocus={(e)=>e.target.style.borderColor="var(--accent)"}
                onBlur={(e)=>e.target.style.borderColor="var(--border)"}/>
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:4 }}>Парола *</label>
              <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Минимум 8 символа" required minLength={8}
                style={{ width:"100%",background:"var(--s2)",border:"1.5px solid var(--border)",borderRadius:10,padding:"11px 13px",fontSize:14,fontFamily:"var(--font-inter)",color:"var(--text)",outline:"none" }}
                onFocus={(e)=>e.target.style.borderColor="var(--accent)"}
                onBlur={(e)=>e.target.style.borderColor="var(--border)"}/>
            </div>

            {error && <div style={{ color:"var(--danger)",fontSize:12,marginBottom:12,background:"rgba(255,87,87,.1)",padding:"8px 12px",borderRadius:8 }}>{error}</div>}

            <button type="submit" disabled={loading}
              style={{ width:"100%",padding:"13px",background:"var(--accent)",color:"#000",border:"none",borderRadius:11,fontFamily:"var(--font-syne)",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1,transition:"all .15s" }}>
              {loading ? "…" : tab==="login" ? "Влез →" : "Регистрирай се →"}
            </button>

            <div style={{ textAlign:"center",margin:"12px 0",fontSize:12,color:"var(--muted)" }}>или</div>

            <button type="button" onClick={handleGoogle}
              style={{ width:"100%",padding:"11px",background:"var(--s2)",color:"var(--text)",border:"1px solid var(--border)",borderRadius:11,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"var(--font-inter)",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="#FBBC05" d="M10.53 28.59c-.5-1.45-.79-3-.79-4.59s.29-3.14.79-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/></svg>
              Продължи с Google
            </button>
          </form>
        )}

        <div style={{ textAlign:"center",marginTop:"1rem",fontSize:12,color:"var(--muted)" }}>
          {tab==="login" ? (
            <>Нямаш акаунт? <button onClick={()=>setTab("signup")} style={{ background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontSize:12,fontFamily:"var(--font-inter)" }}>Регистрирай се</button></>
          ) : (
            <>Вече имаш акаунт? <button onClick={()=>setTab("login")} style={{ background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontSize:12,fontFamily:"var(--font-inter)" }}>Влез</button></>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{minHeight:"100vh",background:"var(--bg)"}}/>}>
      <LoginForm />
    </Suspense>
  );
}
