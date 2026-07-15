"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { TRADES, CITIES } from "@/lib/types";
import { useRouter } from "next/navigation";

const DAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Нд"];
const EMOJI_MAP = Object.fromEntries(TRADES.map((t) => [t.id, t.emoji]));

export default function RegisterMajstorPage() {
  const supabase = createClient();
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [done, setDone] = useState(false);

  // Page 1 - Account
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd]     = useState("");
  const [pwd2, setPwd2]   = useState("");
  const [pwdScore, setPwdScore] = useState(0);

  // Page 2 - Profile
  const [city, setCity]   = useState("");
  const [exp, setExp]     = useState("");
  const [desc, setDesc]   = useState("");
  const [days, setDays]   = useState(["Пн","Вт","Ср","Чт","Пт"]);
  const [fromH, setFromH] = useState("09:00");
  const [toH, setToH]     = useState("18:00");
  const [emergency, setEmergency] = useState(false);

  // Page 3 - Trades
  const [trades, setTrades] = useState<string[]>(["ВиК"]);

  // Page 4 - Terms
  const [terms, setTerms] = useState(false);
  const [real, setReal]   = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Honeypot — ботовете попълват скритото поле, хората не го виждат
  const [honeypot, setHoneypot] = useState("");

  function checkPwd(val: string) {
    let s = 0;
    if (val.length >= 8) s++;
    if (/[A-Z]/.test(val)) s++;
    if (/[0-9]/.test(val)) s++;
    if (/[^A-Za-z0-9]/.test(val)) s++;
    setPwdScore(s);
  }

  function validatePage1() {
    if (!name.trim()) { setError("Въведи пълното си Иmе"); return false; }
    if (!phone.trim()) { setError("Въведи телефон"); return false; }
    if (!email.includes("@")) { setError("Въведи валиден имейл"); return false; }
    if (pwd.length < 8) { setError("Паролата трябва да е поне 8 символа"); return false; }
    if (pwd !== pwd2) { setError("Паролите не съвпадат"); return false; }
    return true;
  }

  function validatePage2() {
    if (!city) { setError("Избери град"); return false; }
    if (!exp) { setError("Избери години опит"); return false; }
    return true;
  }

  function validatePage3() {
    if (trades.length === 0) { setError("Избери поне един занаят"); return false; }
    return true;
  }

  function goTo(n: number) {
    setError("");
    if (n > page) {
      if (page === 1 && !validatePage1()) return;
      if (page === 2 && !validatePage2()) return;
      if (page === 3 && !validatePage3()) return;
    }
    setPage(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const toggleTrade = (t: string) => {
    setTrades((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const toggleDay = (d: string) => {
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const submit = async () => {
    // Honeypot проверка — ако е попълнено, това е бот
    if (honeypot) {
      setLoading(false);
      return; // Тихо блокираме
    }
    if (!terms || !real) { setError("Трябва да се съгласиш с условията"); return; }
    setLoading(true); setError("");

    const hours = days.length > 0 ? `${days.join("/")}: ${fromH}-${toH}` : `${fromH}-${toH}`;

    // Регистрация в Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email, password: pwd,
      options: { data: { name, role: "master" } },
    });

    if (authErr) { setError(authErr.message); setLoading(false); return; }

    const userId = authData.user?.id ?? null;

    // Ръчно създай профил (backup ако тригерът не е тръгнал)
    if (userId) {
      await supabase.from("profiles").insert({
        id: userId,
        name,
        role: "master",
        phone,
      }).then(() => {}).catch(() => {});
    }

    // Запис в masters таблица
    const { error: masterErr } = await supabase.from("masters").insert({
      profile_id: userId,
      name, phone, email, city,
      trade: trades[0],
      trades,
      exp: parseInt(exp) || 1,
      description: desc,
      hours, emergency,
      status: "pending",
      verified: false,
    });

    if (masterErr) { setError(masterErr.message); setLoading(false); return; }

    setLoading(false);
    setDone(true);
  };

  const pwdColors = ["", "#FF5757", "#FFB800", "#00b8ff", "#00E5A0"];
  const pwdLabels = ["", "Слаба", "Средна", "Добра", "Силна"];

  if (done) {
    return (
      <div style={{ minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem" }}>
        <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,padding:"2.5rem",maxWidth:460,width:"100%",textAlign:"center" }}>
          <div style={{ fontSize:56,marginBottom:12 }}>🎉</div>
          <h2 style={{ fontFamily:"var(--font-syne)",fontSize:22,fontWeight:800,marginBottom:8 }}>Добре дошъл в Popravki.net!</h2>
          <p style={{ fontSize:14,color:"var(--muted)",lineHeight:1.6,marginBottom:"1.2rem" }}>Профилът ти е изпратен за проверка. Ще се свържем с теб до 24 часа.</p>
          <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:"1.2rem",textAlign:"left" }}>
            {["Ще получиш имейл за потвърждение","Екипът ни верифицира профила ти","Профилът ти се появява в търсачката","Клиентите започват да се обаждат 📞"].map((s,i) => (
              <div key={i} style={{ display:"flex",alignItems:"center",gap:10,background:"var(--s2)",borderRadius:10,padding:"10px 12px",fontSize:13,color:"var(--muted)" }}>
                <div style={{ width:24,height:24,borderRadius:"50%",background:"var(--accent)",color:"#000",fontWeight:800,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{i+1}</div>
                {s}
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/")}
            style={{ display:"block",width:"100%",padding:13,background:"var(--accent)",color:"#000",border:"none",borderRadius:11,fontFamily:"var(--font-syne)",fontSize:14,fontWeight:700,cursor:"pointer" }}>
            ← Обратно към Popravki.net
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg)",color:"var(--text)" }}>
      {/* Nav */}
      <nav style={{ background:"var(--surface)",borderBottom:"1px solid var(--border)",padding:"0 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",height:54 }}>
        <Link href="/" style={{ display:"flex",alignItems:"center",gap:8,fontFamily:"var(--font-syne)",fontSize:16,fontWeight:800,color:"var(--text)",textDecoration:"none" }}>
          <div style={{ width:30,height:30,background:"var(--accent)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center" }}>🔧</div>
          Popravki<span style={{ color:"var(--accent)" }}>.bg</span>
        </Link>
        <Link href="/" style={{ fontSize:13,color:"var(--muted)",textDecoration:"none" }}>← Обратно към сайта</Link>
      </nav>

      <div style={{ maxWidth:960,margin:"0 auto",padding:"2rem 1.5rem",display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:"2.5rem",alignItems:"start" }}>

        {/* LEFT: Benefits */}
        <div style={{ position:"sticky",top:80 }}>
          <div style={{ display:"inline-block",background:"rgba(0,229,160,.12)",border:"1px solid rgba(0,229,160,.25)",color:"var(--accent)",borderRadius:20,padding:"5px 14px",fontSize:12,fontWeight:600,marginBottom:"1.2rem" }}>🔧 За майстори</div>
          <h1 style={{ fontFamily:"var(--font-syne)",fontSize:"clamp(1.6rem,3.5vw,2.2rem)",fontWeight:800,letterSpacing:"-.03em",lineHeight:1.15,marginBottom:".8rem" }}>
            Намирай клиенти<br/><span style={{ color:"var(--accent)" }}>без усилие</span>
          </h1>
          <p style={{ fontSize:14,color:"var(--muted)",lineHeight:1.7,marginBottom:"1.5rem" }}>Регистрирай се безплатно и започни да получаваш запитвания от хора в твоя район още днес.</p>

          {[
            { ico:"👥", color:"rgba(0,229,160,.1)",  title:"Безплатен профил",    desc:"Създай профил без такси. Клиентите намират теб." },
            { ico:"⭐", color:"rgba(255,184,0,.1)",  title:"Реални отзиви",       desc:"Отзивите от доволни клиенти изграждат репутацията ти." },
            { ico:"📞", color:"rgba(74,158,255,.1)", title:"Директен контакт",    desc:"Клиентите се свързват директно с теб — без посредници." },
            { ico:"🚨", color:"rgba(255,87,87,.1)",  title:"Аварийни поръчки",    desc:"Маркирай се като аварийен майстор и получавай спешни обаждания." },
          ].map((b) => (
            <div key={b.title} style={{ display:"flex",alignItems:"flex-start",gap:12,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 14px",marginBottom:10 }}>
              <div style={{ width:36,height:36,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,background:b.color }}>{b.ico}</div>
              <div>
                <div style={{ fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:2 }}>{b.title}</div>
                <div style={{ fontSize:12,color:"var(--muted)",lineHeight:1.5 }}>{b.desc}</div>
              </div>
            </div>
          ))}

          <div style={{ display:"flex",gap:"1rem",marginTop:"1.2rem" }}>
            {[{ n:"200+",l:"Майстори" },{ n:"23",l:"Града" },{ n:"4.7★",l:"Ср. оценка" },{ n:"0 лв",l:"Такса" }].map((s) => (
              <div key={s.l} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"var(--font-syne)",fontSize:22,fontWeight:800,color:"var(--accent)" }}>{s.n}</div>
                <div style={{ fontSize:11,color:"var(--muted)" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Form */}
        <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,overflow:"hidden" }}>
          {/* Steps */}
          <div style={{ display:"flex",padding:"1.2rem 1.5rem",borderBottom:"1px solid var(--border)",gap:0,position:"relative" }}>
            <div style={{ position:"absolute",top:"50%",left:"1.5rem",right:"1.5rem",height:2,background:"var(--border)",zIndex:0,transform:"translateY(-50%)" }}/>
            {[1,2,3,4].map((n) => (
              <div key={n} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,position:"relative",zIndex:1 }}>
                <div style={{ width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,transition:"all .3s",
                  background:page===n?"var(--accent)":page>n?"var(--s3)":"var(--s2)",
                  border:page===n?"2px solid var(--accent)":page>n?"2px solid var(--accent)":"2px solid var(--border)",
                  color:page===n?"#000":page>n?"var(--accent)":"var(--muted)" }}>
                  {page > n ? "✓" : n}
                </div>
                <div style={{ fontSize:10,color:page>=n?"var(--accent)":"var(--muted)",fontWeight:page===n?600:400,whiteSpace:"nowrap" }}>
                  {n===1?"Акаунт":n===2?"Профил":n===3?"Услуги":"Условия"}
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding:"1.5rem" }}>
            {error && <div style={{ color:"var(--danger)",fontSize:12,marginBottom:12,background:"rgba(255,87,87,.1)",padding:"8px 12px",borderRadius:8 }}>{error}</div>}

            {/* PAGE 1 */}
            {page === 1 && (
              <div>
                <div style={{ fontFamily:"var(--font-syne)",fontSize:18,fontWeight:800,marginBottom:4 }}>Създай акаунт</div>
                <div style={{ fontSize:13,color:"var(--muted)",marginBottom:"1.2rem" }}>Безплатно и за 2 минути. Без скрити такси.</div>

                {[
                  { label:"Пълно Иmе *",  type:"text",     val:name,  set:setName,  ph:"Иван Петров" },
                  { label:"Телефон *",     type:"tel",      val:phone, set:setPhone, ph:"0888 123 456" },
                  { label:"Имейл *",       type:"email",    val:email, set:setEmail, ph:"ivan@mail.bg" },
                ].map((f) => (
                  <div key={f.label} style={{ marginBottom:12 }}>
                    <label style={{ fontSize:11,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:4 }}>{f.label}</label>
                    <input type={f.type} value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
                      style={{ width:"100%",background:"var(--s2)",border:"1.5px solid var(--border)",borderRadius:10,padding:"11px 13px",fontSize:14,fontFamily:"var(--font-inter)",color:"var(--text)",outline:"none" }}
                      onFocus={(e)=>e.target.style.borderColor="var(--accent)"}
                      onBlur={(e)=>e.target.style.borderColor="var(--border)"}/>
                  </div>
                ))}

                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:11,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:4 }}>Парола *</label>
                  <input type="password" value={pwd} onChange={(e) => { setPwd(e.target.value); checkPwd(e.target.value); }} placeholder="Минимум 8 символа"
                    style={{ width:"100%",background:"var(--s2)",border:"1.5px solid var(--border)",borderRadius:10,padding:"11px 13px",fontSize:14,fontFamily:"var(--font-inter)",color:"var(--text)",outline:"none" }}
                    onFocus={(e)=>e.target.style.borderColor="var(--accent)"}
                    onBlur={(e)=>e.target.style.borderColor="var(--border)"}/>
                  <div style={{ height:3,background:"var(--s3)",borderRadius:2,marginTop:6,overflow:"hidden" }}>
                    <div style={{ height:"100%",width:`${pwdScore*25}%`,background:pwdColors[pwdScore],borderRadius:2,transition:"all .3s" }}/>
                  </div>
                  <div style={{ fontSize:11,color:pwdColors[pwdScore]||"var(--muted)",marginTop:3 }}>{pwdLabels[pwdScore]||"Въведи парола"}</div>
                </div>

                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:11,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:4 }}>Повтори парола *</label>
                  <input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} placeholder="Повтори паролата"
                    style={{ width:"100%",background:"var(--s2)",border:`1.5px solid ${pwd2&&pwd2!==pwd?"var(--danger)":"var(--border)"}`,borderRadius:10,padding:"11px 13px",fontSize:14,fontFamily:"var(--font-inter)",color:"var(--text)",outline:"none" }}
                    onFocus={(e)=>e.target.style.borderColor="var(--accent)"}
                    onBlur={(e)=>e.target.style.borderColor=pwd2&&pwd2!==pwd?"var(--danger)":"var(--border)"}/>
                </div>

                <button onClick={() => goTo(2)} style={{ width:"100%",padding:13,background:"var(--accent)",color:"#000",border:"none",borderRadius:11,fontFamily:"var(--font-syne)",fontSize:14,fontWeight:700,cursor:"pointer" }}>
                  Напред — Профил →
                </button>
              </div>
            )}

            {/* PAGE 2 */}
            {page === 2 && (
              <div>
                <div style={{ fontFamily:"var(--font-syne)",fontSize:18,fontWeight:800,marginBottom:4 }}>Твоят профил</div>
                <div style={{ fontSize:13,color:"var(--muted)",marginBottom:"1.2rem" }}>Тази информация се показва на клиентите.</div>

                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12 }}>
                  <div>
                    <label style={{ fontSize:11,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:4 }}>Град *</label>
                    <select value={city} onChange={(e) => setCity(e.target.value)}
                      style={{ width:"100%",background:"var(--s2)",border:"1.5px solid var(--border)",borderRadius:10,padding:"11px 13px",fontSize:14,fontFamily:"var(--font-inter)",color:"var(--text)",outline:"none" }}>
                      <option value="">Избери…</option>
                      {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:11,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:4 }}>Години опит *</label>
                    <select value={exp} onChange={(e) => setExp(e.target.value)}
                      style={{ width:"100%",background:"var(--s2)",border:"1.5px solid var(--border)",borderRadius:10,padding:"11px 13px",fontSize:14,fontFamily:"var(--font-inter)",color:"var(--text)",outline:"none" }}>
                      <option value="">Избери…</option>
                      <option value="1">Под 1 година</option>
                      <option value="2">1–2 години</option>
                      <option value="5">3–5 години</option>
                      <option value="10">6–10 години</option>
                      <option value="15">11–15 години</option>
                      <option value="20">Над 15 години</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:11,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:4 }}>Описание</label>
                  <textarea value={desc} onChange={(e) => setDesc(e.target.value.slice(0,300))} rows={3}
                    placeholder="Разкажи за себе си — какво правиш, как работиш…"
                    style={{ width:"100%",background:"var(--s2)",border:"1.5px solid var(--border)",borderRadius:10,padding:"11px 13px",fontSize:14,fontFamily:"var(--font-inter)",color:"var(--text)",outline:"none",resize:"none" }}/>
                  <div style={{ fontSize:11,color:"var(--muted)",marginTop:3 }}>{desc.length}/300 символа</div>
                </div>

                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:11,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:6 }}>Работно време</label>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:5,marginBottom:10 }}>
                    {DAYS.map((d) => (
                      <button key={d} type="button" onClick={() => toggleDay(d)}
                        style={{ padding:"6px 4px",borderRadius:8,border:`1.5px solid ${days.includes(d)?"var(--accent)":"var(--border)"}`,background:days.includes(d)?"rgba(0,229,160,.1)":"var(--s2)",color:days.includes(d)?"var(--accent)":"var(--muted)",fontSize:11,fontWeight:600,cursor:"pointer",textAlign:"center" }}>
                        {d}
                      </button>
                    ))}
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                    {[{ label:"От", val:fromH, set:setFromH, opts:["07:00","08:00","09:00","10:00"] },
                      { label:"До", val:toH,   set:setToH,   opts:["16:00","17:00","18:00","19:00","20:00","21:00","22:00"] }].map((s) => (
                      <div key={s.label}>
                        <label style={{ fontSize:11,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",display:"block",marginBottom:4 }}>{s.label}</label>
                        <select value={s.val} onChange={(e) => s.set(e.target.value)}
                          style={{ width:"100%",background:"var(--s2)",border:"1.5px solid var(--border)",borderRadius:10,padding:"9px 13px",fontSize:13,fontFamily:"var(--font-inter)",color:"var(--text)",outline:"none" }}>
                          {s.opts.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--s2)",borderRadius:10,padding:"10px 12px",marginBottom:16 }}>
                  <div>
                    <div style={{ fontSize:13,fontWeight:600,color:"var(--text)" }}>🚨 Аварийна услуга 24/7</div>
                    <div style={{ fontSize:11,color:"var(--muted)",marginTop:2 }}>Ще получаваш спешни обаждания по всяко време</div>
                  </div>
                  <button type="button" onClick={() => setEmergency(!emergency)}
                    style={{ width:44,height:24,background:emergency?"var(--accent)":"var(--s3)",borderRadius:12,cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0,border:"none" }}>
                    <span style={{ position:"absolute",top:3,left:emergency?23:3,width:18,height:18,background:"#fff",borderRadius:"50%",transition:"left .2s" }}/>
                  </button>
                </div>

                <div style={{ display:"flex",gap:10 }}>
                  <button onClick={() => goTo(1)} style={{ padding:"12px 18px",background:"var(--s2)",border:"1px solid var(--border)",borderRadius:11,color:"var(--muted)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"var(--font-inter)" }}>← Назад</button>
                  <button onClick={() => goTo(3)} style={{ flex:1,padding:13,background:"var(--accent)",color:"#000",border:"none",borderRadius:11,fontFamily:"var(--font-syne)",fontSize:14,fontWeight:700,cursor:"pointer" }}>Напред — Услуги →</button>
                </div>
              </div>
            )}

            {/* PAGE 3 */}
            {page === 3 && (
              <div>
                <div style={{ fontFamily:"var(--font-syne)",fontSize:18,fontWeight:800,marginBottom:4 }}>Избери занаят</div>
                <div style={{ fontSize:13,color:"var(--muted)",marginBottom:"1.2rem" }}>Можеш да избереш повече от един.</div>

                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16 }}>
                  {TRADES.map((t) => (
                    <div key={t.id} onClick={() => toggleTrade(t.id)}
                      style={{ background:trades.includes(t.id)?"rgba(0,229,160,.08)":"var(--s2)",border:`1.5px solid ${trades.includes(t.id)?"var(--accent)":"var(--border)"}`,borderRadius:10,padding:"10px 12px",cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ fontSize:20 }}>{t.emoji}</span>
                      <span style={{ fontSize:12,fontWeight:600,color:"var(--text)" }}>{t.id}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display:"flex",gap:10 }}>
                  <button onClick={() => goTo(2)} style={{ padding:"12px 18px",background:"var(--s2)",border:"1px solid var(--border)",borderRadius:11,color:"var(--muted)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"var(--font-inter)" }}>← Назад</button>
                  <button onClick={() => goTo(4)} style={{ flex:1,padding:13,background:"var(--accent)",color:"#000",border:"none",borderRadius:11,fontFamily:"var(--font-syne)",fontSize:14,fontWeight:700,cursor:"pointer" }}>Напред — Снимки →</button>
                </div>
              </div>
            )}

            {/* PAGE 4 */}
            {page === 4 && (
              <div>
                <div style={{ fontFamily:"var(--font-syne)",fontSize:18,fontWeight:800,marginBottom:4 }}>Почти готово!</div>
                <div style={{ fontSize:13,color:"var(--muted)",marginBottom:"1.2rem" }}>Снимките може да добавиш по-късно от профила си.</div>

                {/* Preview */}
                <div style={{ background:"var(--s2)",borderRadius:12,padding:14,border:"1px solid var(--border)",marginBottom:"1.2rem" }}>
                  <div style={{ fontSize:12,color:"var(--muted)",marginBottom:8 }}>Профилът ти ще изглежда така:</div>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#1a2e1a,#00E5A0)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#fff" }}>
                      {name.split(" ").map((w) => w[0]).join("").slice(0,2)||"ИП"}
                    </div>
                    <div>
                      <div style={{ fontWeight:700,fontSize:14 }}>{name||"Иван Петров"}</div>
                      <div style={{ fontSize:12,color:"var(--accent)" }}>{trades[0]?`${EMOJI_MAP[trades[0]]||"🔧"} ${trades[0]}`:"🔧 ВиК"}</div>
                      <div style={{ fontSize:11,color:"var(--muted)" }}>★ 5.0 · Нов майстор · <span style={{ color:"var(--accent)" }}>● Свободен</span></div>
                    </div>
                  </div>
                </div>

                {[
                  { check:terms, set:setTerms, text:<>Прочетох и се съгласявам с <a href="#" style={{ color:"var(--accent)" }}>Условията за ползване</a> и <a href="#" style={{ color:"var(--accent)" }}>Политиката за поверителност</a></> },
                  { check:real,  set:setReal,  text:"Декларирам, че предоставените данни са верни и съм реален майстор" },
                ].map((item, i) => (
                  <label key={i} style={{ display:"flex",alignItems:"flex-start",gap:10,background:"var(--s2)",borderRadius:10,padding:"10px 12px",marginBottom:10,cursor:"pointer" }}>
                    <input type="checkbox" checked={item.check} onChange={(e) => item.set(e.target.checked)} style={{ marginTop:2,flexShrink:0,accentColor:"var(--accent)",width:15,height:15 }}/>
                    <span style={{ fontSize:12,color:"var(--muted)",lineHeight:1.5 }}>{item.text}</span>
                  </label>
                ))}

                {/* Honeypot — скрито от хора, ботовете го попълват */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position:"absolute",left:"-9999px",opacity:0,pointerEvents:"none",width:1,height:1 }}
                />

                <div style={{ display:"flex",gap:10 }}>
                  <button onClick={() => goTo(3)} style={{ padding:"12px 18px",background:"var(--s2)",border:"1px solid var(--border)",borderRadius:11,color:"var(--muted)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"var(--font-inter)" }}>← Назад</button>
                  <button onClick={submit} disabled={loading}
                    style={{ flex:1,padding:13,background:"linear-gradient(135deg,var(--accent),#00b8ff)",color:"#000",border:"none",borderRadius:11,fontFamily:"var(--font-syne)",fontSize:14,fontWeight:700,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1 }}>
                    {loading?"…":"✅ Регистрирай се безплатно"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
