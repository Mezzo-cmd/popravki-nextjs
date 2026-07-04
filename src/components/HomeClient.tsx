"use client";

import { useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Master } from "@/lib/types";
import { TRADES, TRADE_MAP, CITIES } from "@/lib/types";
import Nav from "@/components/Nav";
import MasterCard from "@/components/MasterCard";
import MasterModal from "@/components/MasterModal";
import Toast from "@/components/Toast";
import { useLang } from "@/contexts/LanguageContext";

interface Props {
  initialMasters: Master[];
  userId: string | null;
  initialFavorites: string[];
}

const HOME_TRADES  = TRADES.filter((t) => t.category === "home").map((t) => t.id);
const AUTO_TRADES  = TRADES.filter((t) => t.category === "auto").map((t) => t.id);
const TECH_TRADES  = TRADES.filter((t) => t.category === "tech").map((t) => t.id);
const OTHER_TRADES = TRADES.filter((t) => t.category === "other").map((t) => t.id);

export default function HomeClient({ initialMasters, userId, initialFavorites }: Props) {
  const supabase = createClient();
  const { t, lang } = useLang();

  const CATEGORIES = t.filters.allCategories.map((label, i) => ({
    id: (["all", "home", "auto", "tech", "other"] as const)[i],
    label,
  }));

  const [masters]        = useState<Master[]>(initialMasters);
  const [favorites, setFavorites] = useState<string[]>(initialFavorites);
  const [search,  setSearch]  = useState("");
  const [city,    setCity]    = useState("");
  const [category,setCategory]= useState("all");
  const [trade,   setTrade]   = useState("");
  const [minRating,setMinRating] = useState("");
  const [onlyAvail, setOnlyAvail] = useState(false);
  const [sort,    setSort]    = useState<"rating" | "exp" | "jobs" | "name">("rating");
  const [view,    setView]    = useState<"grid" | "list">("grid");
  const [selected,setSelected]= useState<Master | null>(null);
  const [toast,   setToast]   = useState("");
  const [cityInput, setCityInput] = useState("");
  const [showCitySugg, setShowCitySugg] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  // ── Филтриране ──
  const filtered = useMemo(() => {
    let list = [...masters];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.trade.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        m.trades.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (city) list = list.filter((m) => m.city.toLowerCase().includes(city.toLowerCase()));

    if (category !== "all") {
      const catTrades =
        category === "home"  ? HOME_TRADES  :
        category === "auto"  ? AUTO_TRADES  :
        category === "tech"  ? TECH_TRADES  : OTHER_TRADES;
      list = list.filter((m) => m.trades.some((t) => catTrades.includes(t as never)));
    }

    if (trade) list = list.filter((m) => m.trades.includes(trade));
    if (minRating) list = list.filter((m) => m.rating >= parseFloat(minRating));
    if (onlyAvail) list = list.filter((m) => m.available);

    // Сортиране
    list.sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "exp")    return b.exp - a.exp;
      if (sort === "jobs")   return b.jobs_count - a.jobs_count;
      return a.name.localeCompare(b.name, "bg");
    });

    return list;
  }, [masters, search, city, category, trade, minRating, onlyAvail, sort]);

  const topRated  = useMemo(() => [...masters].sort((a,b) => b.rating - a.rating).slice(0, 8), [masters]);
  const emergency = useMemo(() => masters.filter((m) => m.emergency).slice(0, 8), [masters]);
  const newest    = useMemo(() => masters.filter((m) => m.is_new).slice(0, 8), [masters]);

  const [featTab, setFeatTab] = useState<"top" | "emerg" | "new">("top");
  const featList = featTab === "top" ? topRated : featTab === "emerg" ? emergency : newest;

  const stats = useMemo(() => ({
    total:  masters.length,
    avail:  masters.filter((m) => m.available).length,
    cities: new Set(masters.map((m) => m.city)).size,
  }), [masters]);

  // ── Любими ──
  const toggleFavorite = useCallback(async (masterId: string) => {
    if (!userId) { showToast("Влез в профила си за да запазваш любими"); return; }
    const isFav = favorites.includes(masterId);
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", userId).eq("master_id", masterId);
      setFavorites((f) => f.filter((id) => id !== masterId));
      showToast("Премахнат от любими");
    } else {
      await supabase.from("favorites").insert({ user_id: userId, master_id: masterId });
      setFavorites((f) => [...f, masterId]);
      showToast("Добавен в любими ❤️");
    }
  }, [favorites, userId, supabase, showToast]);

  const citySuggestions = cityInput.length >= 2
    ? CITIES.filter((c) => c.toLowerCase().startsWith(cityInput.toLowerCase())).slice(0, 6)
    : [];

  return (
    <div className="min-h-screen pb-16" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <Nav userId={userId} favCount={favorites.length} />

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg,var(--bg) 0%,#0d1a11 60%,var(--bg) 100%)", borderBottom: "1px solid var(--border)", padding: "1.8rem 1rem 1.5rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h1 style={{ fontFamily: "var(--font-syne)", fontSize: "clamp(1.5rem,5vw,2.4rem)", fontWeight: 800, letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: 6 }}>
            {t.hero.title} <span style={{ color: "var(--accent)" }}>{t.hero.titleAccent}</span>
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 6 }}>{t.hero.subtitle}</p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "1rem 0" }}>
            {[
              { color: "accent", text: t.hero.badges[0] },
              { color: "blue",   text: t.hero.badges[1] },
              { color: "a2",     text: t.hero.badges[2] },
              { color: "danger", text: t.hero.badges[3] },
            ].map((b) => (
              <div key={b.text} style={{ display:"flex",alignItems:"center",gap:6,background:`rgba(var(--${b.color}-rgb),.1)`,border:`1px solid var(--${b.color})33`,borderRadius:20,padding:"5px 12px",fontSize:12,fontWeight:600,color:`var(--${b.color})` }}>
                {b.text}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 8 }}>
            {[
              { n: stats.total,  l: t.hero.stats.masters },
              { n: stats.avail,  l: t.hero.stats.available },
              { n: 21,           l: t.hero.stats.trades },
              { n: stats.cities, l: t.hero.stats.cities },
            ].map((s) => (
              <div key={s.l}>
                <div style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>{s.n}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* КАТЕГОРИЙНА РЕШЕТКА */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "1.2rem 1rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, marginBottom: 10, textAlign: "center" }}>{t.categories.title}</div>
          <div className="trade-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
            {TRADES.map((tr) => (
              <button key={tr.id} onClick={() => { setTrade(trade === tr.id ? "" : tr.id); setCategory("all"); }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "12px 8px", borderRadius: 12, cursor: "pointer", transition: "all .15s",
                  border: `1.5px solid ${trade === tr.id ? "var(--accent)" : "var(--border)"}`,
                  background: trade === tr.id ? "rgba(0,229,160,.1)" : "var(--s2)",
                  color: trade === tr.id ? "var(--accent)" : "var(--muted)",
                  fontFamily: "var(--font-inter)",
                }}
                onMouseOver={(e) => { if (trade !== tr.id) { e.currentTarget.style.borderColor = "var(--accent)33"; e.currentTarget.style.background = "var(--s3)"; } }}
                onMouseOut={(e) => { if (trade !== tr.id) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--s2)"; } }}
              >
                <span style={{ fontSize: 26 }}>{tr.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 600, textAlign: "center", lineHeight: 1.3 }}>{lang === "en" ? tr.en : tr.id}</span>
              </button>
            ))}
          </div>
          {trade && (
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <button onClick={() => setTrade("")}
                style={{ fontSize: 12, color: "var(--danger)", background: "none", border: "1px solid var(--danger)", borderRadius: 20, padding: "4px 14px", cursor: "pointer", fontFamily: "var(--font-inter)" }}>
                {t.categories.clearFilter}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* STICKY SEARCH */}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: ".8rem 1rem", position: "sticky", top: 54, zIndex: 90 }}>
        <div className="search-bar" style={{ maxWidth: 1200, margin: "0 auto", display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 14, display: "flex", alignItems: "center", gap: 8, padding: "0 12px" }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search.placeholder}
              style={{ flex:1,padding:"11px 0",fontSize:14,background:"transparent",border:"none",outline:"none",color:"var(--text)",fontFamily:"var(--font-inter)" }}/>
          </div>

          {/* City input with suggestions */}
          <div style={{ position: "relative", minWidth: 180 }}>
            <div style={{ background:"var(--s2)",border:"1px solid var(--border)",borderRadius:14,display:"flex",alignItems:"center",gap:8,padding:"0 12px" }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              <input value={cityInput}
                onChange={(e) => { setCityInput(e.target.value); setCity(e.target.value); setShowCitySugg(true); }}
                onBlur={() => setTimeout(() => setShowCitySugg(false), 150)}
                placeholder={t.search.cityPlaceholder}
                style={{ flex:1,padding:"11px 0",fontSize:13,background:"transparent",border:"none",outline:"none",color:"var(--text)",fontFamily:"var(--font-inter)" }}/>
              {cityInput && <button onClick={() => { setCityInput(""); setCity(""); }} style={{ background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:13,padding:0 }}>✕</button>}
            </div>
            {showCitySugg && citySuggestions.length > 0 && (
              <div style={{ position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"var(--s2)",border:"1px solid var(--border)",borderRadius:12,zIndex:300,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,.5)" }}>
                {citySuggestions.map((c) => (
                  <div key={c} onClick={() => { setCityInput(c); setCity(c); setShowCitySugg(false); }}
                    style={{ padding:"9px 14px",cursor:"pointer",fontSize:13,color:"var(--text)",borderBottom:"1px solid var(--border)" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "var(--s3)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "")}>
                    📍 {c}
                  </div>
                ))}
              </div>
            )}
          </div>

          <select value={onlyAvail ? "yes" : ""} onChange={(e) => setOnlyAvail(e.target.value === "yes")}
            style={{ padding:"0 14px",height:44,fontSize:13,fontWeight:600,background:"var(--s2)",border:"1px solid var(--border)",borderRadius:14,color:"var(--muted)",outline:"none",cursor:"pointer" }}>
            <option value="">{t.search.allLabel}</option>
            <option value="yes">{t.search.availableLabel}</option>
          </select>
        </div>
      </div>

      {/* CATEGORY FILTERS */}
      <div style={{ maxWidth:960,margin:"0 auto",padding:".6rem 1rem",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
        <span style={{ fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".06em" }}>{t.filters.trade}</span>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => { setCategory(c.id); setTrade(""); }}
              style={{ padding:"6px 13px",fontSize:12,fontWeight:600,border:`1px solid ${category===c.id?"var(--accent)":"var(--border)"}`,borderRadius:20,background:category===c.id?"var(--accent)":"var(--surface)",color:category===c.id?"#000":"var(--muted)",cursor:"pointer",transition:"all .15s",fontFamily:"var(--font-inter)" }}>
              {c.label}
            </button>
          ))}
        </div>
        <select value={minRating} onChange={(e) => setMinRating(e.target.value)}
          style={{ padding:"6px 12px",height:36,fontSize:12,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,color:"var(--muted)",outline:"none",cursor:"pointer",fontFamily:"var(--font-inter)" }}>
          <option value="">{t.filters.allRatings}</option>
          <option value="4.5">★ 4.5+</option>
          <option value="4">★ 4.0+</option>
          <option value="3.5">★ 3.5+</option>
        </select>
      </div>

      {/* MAIN LAYOUT — ляв сайдбар + контент */}
      <div className="main-layout" style={{ maxWidth:1200,margin:"0 auto",padding:"0 1rem",display:"flex",gap:20,alignItems:"flex-start" }}>

        {/* ── ЛЯВ САЙДБАР — Реклама ── */}
        <div className="sidebar-left" style={{ width:220,flexShrink:0,position:"sticky",top:110,display:"flex",flexDirection:"column",gap:12 }}>
          <div style={{
            background:"linear-gradient(160deg,#0d2018 0%,#091a10 100%)",
            border:"1px solid rgba(0,229,160,.25)",
            borderRadius:18,
            padding:"20px 16px",
            textAlign:"center",
          }}>
            <div style={{ fontSize:36,marginBottom:10 }}>🔧</div>
            <div style={{ fontFamily:"var(--font-syne)",fontSize:16,fontWeight:800,color:"var(--text)",lineHeight:1.25,marginBottom:8 }}>
              {lang==="en" ? "Are you a craftsman?" : "Ти си майстор?"}
            </div>
            <div style={{ fontSize:12,color:"var(--muted)",lineHeight:1.6,marginBottom:16 }}>
              {lang==="en"
                ? "Want more clients? Register here and start building your customer base today!"
                : "Искаш повече клиенти? Регистрирай се при нас и започни да трупаш клиенти още днес!"}
            </div>
            <a href="/register-majstor" style={{
              display:"block",
              background:"var(--accent)",
              color:"#000",
              borderRadius:10,
              padding:"10px 0",
              fontSize:13,
              fontWeight:800,
              textDecoration:"none",
              fontFamily:"var(--font-syne)",
              transition:"opacity .15s",
            }}
              onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity=".85"; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity="1"; }}
            >
              {lang==="en" ? "Register free →" : "Регистрирай се →"}
            </a>
            <div style={{ fontSize:10,color:"var(--muted)",marginTop:10,opacity:.7 }}>
              {lang==="en" ? "✓ Free · ✓ Verified · ✓ More clients" : "✓ Безплатно · ✓ Верифициран · ✓ Повече клиенти"}
            </div>
          </div>
        </div>

        {/* ── ДЯСНА КОЛОНА — основен контент ── */}
        <div style={{ flex:1,minWidth:0 }}>

      {/* FEATURED SECTION */}
      <div style={{ padding:".8rem 0 0" }}>
        <div style={{ display:"flex",gap:8,overflow:"auto" }} className="no-scrollbar">
          {(["top","emerg","new"] as const).map((id, i) => ({ id, label: t.featured.tabs[i] })).map((f) => (
            <button key={f.id} onClick={() => setFeatTab(f.id as "top"|"emerg"|"new")}
              style={{ padding:"6px 13px",fontSize:12,fontWeight:600,border:`1px solid ${featTab===f.id?"var(--accent)":"var(--border)"}`,borderRadius:20,background:featTab===f.id?"var(--accent)":"var(--surface)",color:featTab===f.id?"#000":"var(--muted)",cursor:"pointer",flexShrink:0,fontFamily:"var(--font-inter)" }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display:"flex",gap:8,overflow:"auto",marginTop:8,paddingBottom:4 }} className="no-scrollbar">
          {featList.map((m) => (
            <div key={m.id} onClick={() => setSelected(m)}
              style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 12px",minWidth:145,cursor:"pointer",flexShrink:0,transition:"all .15s" }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.transform="translateY(-2px)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform=""; }}>
              <div style={{ width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,marginBottom:6,background:"linear-gradient(135deg,#1a2e1a,#00E5A0)",color:"#fff" }}>
                {m.name.split(" ").map((w) => w[0]).join("").slice(0,2)}
              </div>
              <div style={{ fontSize:12,fontWeight:600,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{m.name}</div>
              <div style={{ fontSize:11,color:"var(--accent)",marginTop:1 }}>{TRADE_MAP[m.trade]||"🔧"} {m.trade}</div>
              <div style={{ fontSize:11,color:"var(--a2)",marginTop:3 }}>★ {m.rating.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK CITIES */}
      <div style={{ padding:".4rem 0",display:"flex",gap:6,flexWrap:"wrap",alignItems:"center" }}>
        <span style={{ fontSize:11,color:"var(--muted)" }}>{t.quickCities.label}</span>
        {["Варна","София","Пловдив","Бургас","Русе"].map((c) => (
          <button key={c} onClick={() => { setCityInput(c); setCity(c); }}
            style={{ padding:"6px 13px",fontSize:12,fontWeight:600,border:`1px solid ${city===c?"var(--accent)":"var(--border)"}`,borderRadius:20,background:city===c?"rgba(0,229,160,.1)":"var(--surface)",color:city===c?"var(--accent)":"var(--muted)",cursor:"pointer",fontFamily:"var(--font-inter)" }}>
            📍 {c}
          </button>
        ))}
        {city && <button onClick={() => { setCityInput(""); setCity(""); }}
          style={{ padding:"6px 13px",fontSize:12,fontWeight:600,border:"1px solid var(--danger)",borderRadius:20,background:"transparent",color:"var(--danger)",cursor:"pointer",fontFamily:"var(--font-inter)" }}>
          {t.quickCities.clear}
        </button>}
      </div>

      {/* TOOLBAR */}
      <div className="toolbar" style={{ padding:".4rem 0 .6rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8 }}>
        <span style={{ fontSize:13,color:"var(--muted)" }}>{t.filters.found} <b style={{ color:"var(--text)" }}>{filtered.length}</b></span>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          <div style={{ display:"flex",gap:5,alignItems:"center" }}>
            <span style={{ fontSize:11,color:"var(--muted)" }}>{t.filters.sort}</span>
            {(["rating","exp","jobs","name"] as const).map((s) => (
              <button key={s} onClick={() => setSort(s)}
                style={{ padding:"5px 10px",fontSize:11,border:`1px solid ${sort===s?"var(--a2)":"var(--border)"}`,borderRadius:7,background:"var(--surface)",color:sort===s?"var(--a2)":"var(--muted)",cursor:"pointer",fontFamily:"var(--font-inter)" }}>
                {t.filters.sortOptions[s]}
              </button>
            ))}
          </div>
          <div style={{ display:"flex",gap:3 }}>
            {(["grid","list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                style={{ width:30,height:30,border:`1px solid ${view===v?"var(--accent)":"var(--border)"}`,borderRadius:7,background:"var(--surface)",color:view===v?"var(--accent)":"var(--muted)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
                {v==="grid"?"⊞":"☰"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MASTER GRID */}
      <div style={{ padding:"0 0 1rem" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: view==="list" ? "1fr" : "repeat(auto-fill,minmax(160px,1fr))",
          gap: 12,
        }}>
          {filtered.length === 0 ? (
            <div style={{ gridColumn:"1/-1",textAlign:"center",padding:"3rem 1rem",color:"var(--muted)" }}>
              <div style={{ fontSize:44,marginBottom:10 }}>🔍</div>
              <h3 style={{ fontFamily:"var(--font-syne)",fontSize:17,color:"var(--text)",marginBottom:5 }}>{t.masters.noResults}</h3>
              <p>{t.masters.noResultsSub}</p>
            </div>
          ) : (
            filtered.map((m) => (
              <MasterCard
                key={m.id}
                master={m}
                isFav={favorites.includes(m.id)}
                isListView={view === "list"}
                onOpen={() => setSelected(m)}
                onFav={() => toggleFavorite(m.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Admin link */}
      <div style={{ textAlign:"center",padding:"1rem",opacity:.4 }}>
        <a href="/admin" style={{ fontSize:11,color:"var(--muted)",textDecoration:"none" }}>{t.adminLink}</a>
      </div>

        </div>{/* end дясна колона */}

        {/* ── ДЕСЕН САЙДБАР — Реклама за клиенти ── */}
        <div className="sidebar-right" style={{ width:220,flexShrink:0,position:"sticky",top:110,display:"flex",flexDirection:"column",gap:12 }}>
          <div style={{
            background:"linear-gradient(160deg,#0d1829 0%,#091018 100%)",
            border:"1px solid rgba(74,158,255,.25)",
            borderRadius:18,
            padding:"20px 16px",
            textAlign:"center",
          }}>
            <div style={{ fontSize:36,marginBottom:10 }}>🏠</div>
            <div style={{ fontFamily:"var(--font-syne)",fontSize:16,fontWeight:800,color:"var(--text)",lineHeight:1.25,marginBottom:8 }}>
              {lang==="en" ? "Need a craftsman?" : "Трябва ти майстор?"}
            </div>
            <div style={{ fontSize:12,color:"var(--muted)",lineHeight:1.6,marginBottom:16 }}>
              {lang==="en"
                ? "Find verified professionals near you — fast, safe and reliable!"
                : "Намери верифициран специалист близо до теб — бързо, безопасно и надеждно!"}
            </div>
            <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:14 }}>
              {(lang==="en"
                ? ["🔧 Plumbers","⚡ Electricians","🖌️ Painters","🧱 Masons"]
                : ["🔧 ВиК майстори","⚡ Електротехници","🖌️ Бояджии","🧱 Зидари"]
              ).map((item) => (
                <div key={item} style={{ fontSize:11,color:"var(--muted)",background:"rgba(74,158,255,.08)",border:"1px solid rgba(74,158,255,.15)",borderRadius:8,padding:"5px 8px",textAlign:"left" }}>
                  {item}
                </div>
              ))}
            </div>
            <a href="#search" onClick={(e) => { e.preventDefault(); window.scrollTo({top:0,behavior:"smooth"}); }} style={{
              display:"block",
              background:"var(--blue)",
              color:"#fff",
              borderRadius:10,
              padding:"10px 0",
              fontSize:13,
              fontWeight:800,
              textDecoration:"none",
              fontFamily:"var(--font-syne)",
              transition:"opacity .15s",
            }}
              onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity=".85"; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity="1"; }}
            >
              {lang==="en" ? "Find now →" : "Намери сега →"}
            </a>
            <div style={{ fontSize:10,color:"var(--muted)",marginTop:10,opacity:.7 }}>
              {lang==="en" ? "✓ Free · ✓ Verified · ✓ Direct contact" : "✓ Безплатно · ✓ Верифицирани · ✓ Директен контакт"}
            </div>
          </div>
        </div>

      </div>{/* end main layout */}

      {/* MODALS */}
      {selected && (
        <MasterModal
          master={selected}
          isFav={favorites.includes(selected.id)}
          userId={userId}
          onClose={() => setSelected(null)}
          onFav={() => toggleFavorite(selected.id)}
          onToast={showToast}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
