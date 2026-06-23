"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Master, MasterStatus } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props { masters: Master[]; }

export default function AdminClient({ masters: initial }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [masters, setMasters] = useState<Master[]>(initial);
  const [filter, setFilter]   = useState<"all" | MasterStatus>("all");
  const [search, setSearch]   = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [selected, setSelected] = useState<Master | null>(null);
  const [toast, setToast]     = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const cities = useMemo(() =>
    [...new Set(masters.map((m) => m.city))].sort((a, b) => a.localeCompare(b, "bg")),
    [masters]
  );

  const filtered = useMemo(() => masters.filter((m) => {
    if (filter !== "all" && m.status !== filter) return false;
    if (cityFilter && m.city !== cityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (![m.name, m.phone, m.trade, m.city].some((s) => (s||"").toLowerCase().includes(q))) return false;
    }
    return true;
  }), [masters, filter, cityFilter, search]);

  const stats = useMemo(() => ({
    total:    masters.length,
    pending:  masters.filter((m) => m.status === "pending").length,
    approved: masters.filter((m) => m.status === "approved").length,
    rejected: masters.filter((m) => m.status === "rejected").length,
  }), [masters]);

  const updateStatus = async (id: string, status: MasterStatus, verified = false) => {
    const { error } = await supabase
      .from("masters")
      .update({ status, verified, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { showToast("Грешка: " + error.message); return; }
    setMasters((prev) => prev.map((m) => m.id === id ? { ...m, status, verified } : m));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status, verified } : null);
    showToast(status === "approved" ? "✅ Одобрен!" : "❌ Отказан");
  };

  const deleteMaster = async (id: string) => {
    if (!confirm("Изтрий тази регистрация завинаги?")) return;
    await supabase.from("masters").delete().eq("id", id);
    setMasters((prev) => prev.filter((m) => m.id !== id));
    if (selected?.id === id) setSelected(null);
    showToast("🗑 Изтрит");
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("bg-BG", { day:"2-digit", month:"2-digit", year:"numeric" }) + " " + new Date(iso).toLocaleTimeString("bg-BG", { hour:"2-digit", minute:"2-digit" });

  const statusBadge = (status: MasterStatus) => {
    const map = { pending: { label:"⏳ Чакащ", color:"var(--a2)", bg:"rgba(255,184,0,.12)", border:"rgba(255,184,0,.25)" }, approved: { label:"✅ Одобрен", color:"var(--accent)", bg:"rgba(0,229,160,.12)", border:"rgba(0,229,160,.25)" }, rejected: { label:"❌ Отказан", color:"var(--danger)", bg:"rgba(255,87,87,.12)", border:"rgba(255,87,87,.25)" } };
    const s = map[status];
    return <span style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:14,fontSize:11,fontWeight:600,background:s.bg,color:s.color,border:`1px solid ${s.border}` }}>{s.label}</span>;
  };

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg)",color:"var(--text)" }}>
      {/* Nav */}
      <nav style={{ background:"var(--surface)",borderBottom:"1px solid var(--border)",padding:"0 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",height:54 }}>
        <Link href="/" style={{ display:"flex",alignItems:"center",gap:8,fontFamily:"var(--font-syne)",fontSize:16,fontWeight:800,color:"var(--text)",textDecoration:"none" }}>
          <div style={{ width:30,height:30,background:"var(--accent)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center" }}>🔧</div>
          Popravki<span style={{ color:"var(--accent)" }}>.bg</span>
        </Link>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ background:"rgba(255,87,87,.12)",border:"1px solid rgba(255,87,87,.3)",color:"var(--danger)",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700 }}>🔐 АДМИН</span>
          <Link href="/" style={{ padding:"6px 12px",fontSize:12,fontWeight:600,borderRadius:8,border:"1px solid var(--border)",background:"var(--s2)",color:"var(--muted)",textDecoration:"none",fontFamily:"var(--font-inter)" }}>← Към сайта</Link>
        </div>
      </nav>

      <div style={{ maxWidth:1100,margin:"0 auto",padding:"1.5rem" }}>
        {/* Stats */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:"1.5rem" }}>
          {[
            { n:stats.total,    l:"Общо регистрации", color:"var(--accent)" },
            { n:stats.pending,  l:"Чакащи одобрение", color:"var(--a2)" },
            { n:stats.approved, l:"Одобрени",         color:"var(--accent)" },
            { n:stats.rejected, l:"Отказани",         color:"var(--danger)" },
          ].map((s) => (
            <div key={s.l} style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"14px 16px" }}>
              <div style={{ fontFamily:"var(--font-syne)",fontSize:26,fontWeight:800,color:s.color }}>{s.n}</div>
              <div style={{ fontSize:12,color:"var(--muted)",marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex",gap:6,marginBottom:"1rem",borderBottom:"1px solid var(--border)" }}>
          {(["all","pending","approved","rejected"] as const).map((f) => {
            const labels: Record<string,string> = { all:"Всички", pending:"⏳ Чакащи", approved:"✅ Одобрени", rejected:"❌ Отказани" };
            const cnt = f === "all" ? masters.length : masters.filter((m) => m.status === f).length;
            return (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:"10px 16px",fontSize:13,fontWeight:600,border:"none",background:"none",color:filter===f?"var(--text)":"var(--muted)",cursor:"pointer",borderBottom:`2px solid ${filter===f?"var(--accent)":"transparent"}`,fontFamily:"var(--font-inter)",transition:"all .15s",marginBottom:-1 }}>
                {labels[f]} <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",background:filter===f?"var(--accent)":"var(--s3)",color:filter===f?"#000":"var(--muted)",borderRadius:10,padding:"1px 7px",fontSize:11,marginLeft:6 }}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* Search + filter */}
        <div style={{ display:"flex",gap:10,marginBottom:"1rem",flexWrap:"wrap" }}>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 Търси по Иmе, телефон, занаят…"
            style={{ flex:1,minWidth:180,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"9px 13px",fontSize:13,color:"var(--text)",outline:"none",fontFamily:"var(--font-inter)" }}
            onFocus={(e)=>e.target.style.borderColor="var(--accent)"}
            onBlur={(e)=>e.target.style.borderColor="var(--border)"}/>
          <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
            style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"9px 13px",fontSize:13,color:"var(--text)",outline:"none",fontFamily:"var(--font-inter)" }}>
            <option value="">Всички градове</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden" }}>
            <thead>
              <tr>
                {["Майстор","Занаят","Град","Дата","Статус","Действия"].map((h) => (
                  <th key={h} style={{ textAlign:"left",padding:"10px 14px",fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".05em",background:"var(--s2)",borderBottom:"1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:"center",padding:"3rem",color:"var(--muted)" }}>
                  <div style={{ fontSize:44,marginBottom:10 }}>📭</div>
                  Няма регистрации в тази категория
                </td></tr>
              ) : filtered.map((m) => (
                <tr key={m.id}
                  style={{ cursor:"pointer",transition:"background .15s" }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background="var(--s2)"; }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background=""; }}>
                  <td style={{ padding:"12px 14px",borderBottom:"1px solid var(--border)" }}>
                    <div style={{ fontWeight:700,color:"var(--text)" }}>{m.name}</div>
                    <div style={{ fontSize:11,color:"var(--muted)",marginTop:2 }}>{m.phone} · {m.email||""}</div>
                  </td>
                  <td style={{ padding:"12px 14px",fontSize:13,borderBottom:"1px solid var(--border)" }}>{m.trades?.join(", ")||m.trade}</td>
                  <td style={{ padding:"12px 14px",fontSize:13,borderBottom:"1px solid var(--border)" }}>{m.city}</td>
                  <td style={{ padding:"12px 14px",fontSize:12,color:"var(--muted)",borderBottom:"1px solid var(--border)",whiteSpace:"nowrap" }}>{fmtDate(m.registered_at)}</td>
                  <td style={{ padding:"12px 14px",borderBottom:"1px solid var(--border)" }}>{statusBadge(m.status)}</td>
                  <td style={{ padding:"12px 14px",borderBottom:"1px solid var(--border)" }}>
                    <div style={{ display:"flex",gap:5,flexWrap:"wrap" }}>
                      <button onClick={() => setSelected(m)} style={{ padding:"6px 12px",borderRadius:8,border:"1px solid var(--blue)",color:"var(--blue)",background:"var(--s2)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--font-inter)" }}>👁 Виж</button>
                      {m.status !== "approved" && <button onClick={() => updateStatus(m.id,"approved",true)} style={{ padding:"6px 12px",borderRadius:8,border:"1px solid var(--accent)",color:"var(--accent)",background:"var(--s2)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--font-inter)" }}>✓ Одобри</button>}
                      {m.status !== "rejected" && <button onClick={() => updateStatus(m.id,"rejected")} style={{ padding:"6px 12px",borderRadius:8,border:"1px solid var(--danger)",color:"var(--danger)",background:"var(--s2)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"var(--font-inter)" }}>✕ Откажи</button>}
                      <button onClick={() => deleteMaster(m.id)} style={{ padding:"6px 12px",borderRadius:8,border:"1px solid var(--border)",color:"var(--muted)",background:"var(--s2)",fontSize:12,cursor:"pointer",fontFamily:"var(--font-inter)" }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{ display:"flex",position:"fixed",inset:0,background:"rgba(0,0,0,.8)",backdropFilter:"blur(8px)",zIndex:500,alignItems:"center",justifyContent:"center",padding:"1rem" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,maxWidth:480,width:"100%",maxHeight:"85vh",overflowY:"auto" }}>
            <div style={{ padding:"1.2rem",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <h2 style={{ fontFamily:"var(--font-syne)",fontSize:17,fontWeight:800 }}>Детайли на регистрация</h2>
              <button onClick={() => setSelected(null)} style={{ width:30,height:30,borderRadius:"50%",background:"var(--s2)",border:"1px solid var(--border)",color:"var(--muted)",fontSize:14,cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ padding:"1.2rem" }}>
              {[
                { label:"Иmе",          val: selected.name },
                { label:"Телефон",      val: selected.phone },
                { label:"Имейл",        val: selected.email||"—" },
                { label:"Град",         val: selected.city },
                { label:"Занаят(и)",    val: (selected.trades||[selected.trade]).join(", ") },
                { label:"Опит",         val: `${selected.exp} год.` },
                { label:"Работно время",val: selected.hours||"—" },
                { label:"Аварийна услуга",val: selected.emergency?"🚨 Да":"Не" },
                { label:"Регистриран на",val: fmtDate(selected.registered_at) },
                { label:"Статус",       val: selected.status },
              ].map((r) => (
                <div key={r.label} style={{ display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border)",fontSize:13 }}>
                  <span style={{ color:"var(--muted)" }}>{r.label}</span>
                  <span style={{ fontWeight:600,color:"var(--text)",textAlign:"right" }}>{r.val}</span>
                </div>
              ))}
              {selected.description && (
                <div style={{ background:"var(--s2)",borderRadius:10,padding:12,fontSize:13,color:"var(--muted)",lineHeight:1.6,marginTop:12 }}>
                  "{selected.description}"
                </div>
              )}
              <div style={{ display:"flex",gap:8,marginTop:"1.2rem" }}>
                {selected.status !== "approved" && (
                  <button onClick={() => { updateStatus(selected.id,"approved",true); setSelected(null); }}
                    style={{ flex:1,padding:11,borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"var(--font-syne)",border:"none",background:"var(--accent)",color:"#000" }}>
                    ✓ Одобри
                  </button>
                )}
                {selected.status !== "rejected" && (
                  <button onClick={() => { updateStatus(selected.id,"rejected"); setSelected(null); }}
                    style={{ flex:1,padding:11,borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"var(--font-syne)",border:"none",background:"var(--danger)",color:"#fff" }}>
                    ✕ Откажи
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <div style={{ position:"fixed",bottom:24,left:"50%",transform:`translateX(-50%) translateY(${toast?0:100}px)`,background:"var(--surface)",border:"1px solid var(--accent)",borderRadius:11,padding:"10px 18px",fontSize:13,fontWeight:600,color:"var(--accent)",zIndex:9999,transition:"transform .3s",whiteSpace:"nowrap",pointerEvents:"none" }}>
        {toast}
      </div>
    </div>
  );
}
