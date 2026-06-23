"use client";

import type { Master } from "@/lib/types";
import { TRADE_MAP, TRADES } from "@/lib/types";
import { useLang } from "@/contexts/LanguageContext";

interface Props {
  master: Master;
  isFav: boolean;
  isListView: boolean;
  onOpen: () => void;
  onFav: () => void;
}

const STARS = (r: number) => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));

export default function MasterCard({ master: m, isFav, isListView, onOpen, onFav }: Props) {
  const { t, lang } = useLang();
  const emoji = TRADE_MAP[m.trade] || "🔧";
  const tradeLabel = lang === "en" ? (TRADES.find((tr) => tr.id === m.trade)?.en ?? m.trade) : m.trade;
  const initials = m.name.split(" ").map((w) => w[0]).join("").slice(0, 2);

  const card = (
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid ${m.is_featured ? "var(--a2)" : "var(--border)"}`,
        borderRadius: isListView ? 12 : 16,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform .18s,border-color .18s,box-shadow .18s",
        position: "relative",
        display: isListView ? "flex" : "block",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = "rgba(0,229,160,.35)";
        e.currentTarget.style.boxShadow = "0 10px 36px rgba(0,0,0,.4)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.borderColor = m.is_featured ? "var(--a2)" : "var(--border)";
        e.currentTarget.style.boxShadow = "";
      }}
      onClick={onOpen}
    >
      {/* Photo area */}
      <div style={{
        width: isListView ? 72 : "100%",
        height: isListView ? "auto" : 100,
        minHeight: isListView ? 72 : undefined,
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg,#1a2e1a,#0d1a11)",
        fontSize: isListView ? 24 : 32,
      }}>
        {m.avatar_url ? (
          <img src={m.avatar_url} alt={m.name} style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
        ) : (
          <span style={{ position:"relative",zIndex:1 }}>{emoji}</span>
        )}
        <div style={{ position:"absolute",inset:0,background:isListView?"linear-gradient(to right,transparent 40%,var(--surface) 100%)":"linear-gradient(to bottom,transparent 40%,var(--surface) 100%)" }}/>
        <div style={{ position:"absolute",top:8,right:8,zIndex:2,width:9,height:9,borderRadius:"50%",border:"2px solid var(--surface)",background:m.available?"var(--accent)":"var(--danger)",boxShadow:m.available?"0 0 6px rgba(0,229,160,.7)":undefined }}/>
        {m.is_featured && <span style={{ position:"absolute",top:8,left:8,zIndex:2,background:"var(--a2)",color:"#000",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:800,fontFamily:"var(--font-syne)" }}>TOP</span>}
        {m.is_new && !m.is_featured && <span style={{ position:"absolute",top:8,left:8,zIndex:2,background:"rgba(74,158,255,.9)",color:"#fff",borderRadius:5,padding:"2px 7px",fontSize:9,fontWeight:800 }}>NEW</span>}
      </div>

      {/* Body */}
      <div style={{ padding: isListView ? ".7rem .9rem" : "0 .9rem .5rem", flex: isListView ? 1 : undefined }}>
        <div style={{ fontFamily:"var(--font-syne)",fontSize:13,fontWeight:700,color:"var(--text)",marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{m.name}</div>
        <div style={{ fontSize:11,color:"var(--accent)",fontWeight:600,marginBottom:6 }}>{emoji} {tradeLabel}</div>
        <div style={{ display:"flex",flexDirection:isListView?"row":"column",gap:isListView?6:3,fontSize:11,color:"var(--muted)",flexWrap:"wrap" }}>
          <span>★ <span style={{ color:"var(--a2)" }}>{m.rating.toFixed(1)}</span> ({m.reviews_count})</span>
          <span>📍 {m.city}</span>
          <span>🛠 {m.exp} {t.masters.experience}</span>
          {m.emergency && <span style={{ display:"inline-flex",alignItems:"center",gap:3,background:"rgba(255,87,87,.15)",border:"1px solid rgba(255,87,87,.3)",color:"var(--danger)",borderRadius:5,padding:"2px 6px",fontSize:9,fontWeight:700 }}>🚨 24/7</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isListView ? "1fr" : "1fr 1fr",
        gap: 6,
        padding: isListView ? ".6rem" : ".6rem .9rem .7rem",
        borderTop: isListView ? "none" : "1px solid var(--border)",
        borderLeft: isListView ? "1px solid var(--border)" : "none",
        width: isListView ? 110 : undefined,
        flexShrink: 0,
        justifyContent: "center",
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); window.open(`tel:${m.phone}`); }}
          style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"7px 0",borderRadius:9,fontSize:12,fontWeight:600,fontFamily:"var(--font-inter)",cursor:"pointer",border:"1px solid var(--accent)",color:"var(--accent)",background:"rgba(0,229,160,.08)",transition:"all .15s" }}
          onMouseOver={(e) => { e.currentTarget.style.background="var(--accent)"; e.currentTarget.style.color="#000"; }}
          onMouseOut={(e) => { e.currentTarget.style.background="rgba(0,229,160,.08)"; e.currentTarget.style.color="var(--accent)"; }}>
          📞 {t.modal.call}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"7px 0",borderRadius:9,fontSize:12,fontWeight:600,fontFamily:"var(--font-inter)",cursor:"pointer",border:`1px solid ${isFav?"var(--danger)":"var(--border)"}`,color:isFav?"var(--danger)":"var(--muted)",background:isFav?"rgba(255,87,87,.08)":"var(--s2)",transition:"all .15s" }}>
          {isFav ? "❤️" : "♡"}
        </button>
      </div>
    </div>
  );

  return card;
}
