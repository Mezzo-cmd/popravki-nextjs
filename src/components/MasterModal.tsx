"use client";

import { useState, useEffect } from "react";
import type { Master, Review } from "@/lib/types";
import { TRADE_MAP, TRADES } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useLang } from "@/contexts/LanguageContext";

interface Props {
  master: Master;
  isFav: boolean;
  userId: string | null;
  onClose: () => void;
  onFav: () => void;
  onToast: (msg: string) => void;
}

type Tab = "info" | "reviews" | "chat" | "map";

export default function MasterModal({ master: m, isFav, userId, onClose, onFav, onToast }: Props) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("info");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [starRating, setStarRating] = useState(0);
  const [reviewText, setRevText] = useState("");
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState<{text:string;from:"user"|"master"}[]>([]);

  const { t, lang } = useLang();
  const emoji = TRADE_MAP[m.trade] || "🔧";
  const tradeLabel = lang === "en" ? (TRADES.find((tr) => tr.id === m.trade)?.en ?? m.trade) : m.trade;
  const initials = m.name.split(" ").map((w) => w[0]).join("").slice(0,2);

  useEffect(() => {
    supabase.from("reviews").select("*").eq("master_id", m.id).order("created_at", { ascending: false })
      .then(({ data }) => setReviews(data ?? []));
  }, [m.id]);

  const submitReview = async () => {
    if (!userId) { onToast(t.modal.loginToReview); return; }
    if (!starRating) { onToast(t.modal.selectRating); return; }
    const { error } = await supabase.from("reviews").insert({
      master_id: m.id,
      reviewer_id: userId,
      reviewer_name: null,
      rating: starRating,
      text: reviewText || null,
    });
    if (error) { onToast("Грешка: " + error.message); return; }
    onToast("Отзивът е изпратен ✓");
    setStarRating(0);
    setRevText("");
    const { data } = await supabase.from("reviews").select("*").eq("master_id", m.id).order("created_at", { ascending: false });
    setReviews(data ?? []);
  };

  const sendChat = () => {
    if (!chatMsg.trim()) return;
    setChatHistory((h) => [...h, { text: chatMsg, from: "user" }]);
    setChatMsg("");
    setTimeout(() => {
      setChatHistory((h) => [...h, { text: `Здравейте! Ще се свържа с вас скоро на ${m.phone}`, from: "master" }]);
    }, 800);
  };

  return (
    <div style={{ display:"flex",position:"fixed",inset:0,background:"rgba(0,0,0,.8)",backdropFilter:"blur(8px)",zIndex:500,alignItems:"center",justifyContent:"center",padding:"1rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,maxWidth:460,width:"100%",maxHeight:"90vh",overflowY:"auto",animation:"slideUp .25s cubic-bezier(.34,1.56,.64,1)" }}>
        <style>{`@keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        {/* Photo header */}
        <div style={{ width:"100%",height:140,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",overflow:"hidden",background:"linear-gradient(135deg,#1a2e1a,#0d1a11)",fontSize:56 }}>
          {m.avatar_url ? <img src={m.avatar_url} alt={m.name} style={{ width:"100%",height:"100%",objectFit:"cover" }}/> : emoji}
          <div style={{ position:"absolute",inset:0,background:"linear-gradient(to bottom,transparent 30%,var(--surface) 100%)" }}/>
          <button onClick={onClose} style={{ position:"absolute",top:12,right:12,zIndex:10,width:32,height:32,borderRadius:"50%",background:"rgba(0,0,0,.6)",border:"1px solid rgba(255,255,255,.1)",color:"#fff",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding:"0 1.2rem 1.2rem" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:".4rem",marginTop:".5rem" }}>
            <span style={{ display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:16,fontSize:11,fontWeight:600,background:m.available?"rgba(0,229,160,.1)":"rgba(255,87,87,.1)",color:m.available?"var(--accent)":"var(--danger)",border:`1px solid ${m.available?"rgba(0,229,160,.2)":"rgba(255,87,87,.2)"}` }}>
              <span style={{ width:6,height:6,borderRadius:"50%",background:"currentColor" }}></span>
              {m.available ? t.masters.available : t.masters.busy}
            </span>
            {m.emergency && <span style={{ display:"inline-flex",alignItems:"center",gap:3,background:"rgba(255,87,87,.15)",border:"1px solid rgba(255,87,87,.3)",color:"var(--danger)",borderRadius:5,padding:"3px 8px",fontSize:10,fontWeight:700 }}>🚨 24/7</span>}
          </div>

          <h2 style={{ fontFamily:"var(--font-syne)",fontSize:20,fontWeight:800,letterSpacing:"-.02em",marginBottom:2 }}>{m.name}</h2>
          <div style={{ fontSize:13,color:"var(--accent)",fontWeight:600,marginBottom:".8rem" }}>{emoji} {tradeLabel}</div>

          {/* FAV btn */}
          <button onClick={onFav} style={{ width:"100%",padding:9,border:`1px solid ${isFav?"var(--danger)":"var(--border)"}`,borderRadius:10,background:isFav?"rgba(255,87,87,.08)":"var(--s2)",color:isFav?"var(--danger)":"var(--muted)",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .15s",fontFamily:"var(--font-inter)",marginBottom:".8rem" }}>
            {isFav ? t.modal.saved : `♡ ${t.modal.save}`}
          </button>

          {/* Quick contact */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:".8rem" }}>
            {[
              { ico:"📞",label:t.modal.call,color:"accent",action:()=>window.open(`tel:${m.phone}`) },
              { ico:"💬",label:t.modal.whatsapp,color:"#25D366",action:()=>window.open(`https://wa.me/${m.phone.replace(/\s/g,"")}`) },
              { ico:"✉️",label:t.modal.email,color:"blue",action:()=>m.email&&window.open(`mailto:${m.email}`) },
              { ico:"🔗",label:t.modal.share,color:"muted",action:()=>navigator.share?.({title:m.name,url:window.location.href}) },
            ].map((btn) => (
              <button key={btn.label} onClick={btn.action}
                style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 4px",border:`1px solid var(--${btn.color})`,borderRadius:10,cursor:"pointer",background:"var(--s2)",transition:"all .15s",fontSize:11,fontWeight:600,fontFamily:"var(--font-inter)",color:`var(--${btn.color})` }}
                onMouseOver={(e) => { e.currentTarget.style.background=`var(--${btn.color})`; e.currentTarget.style.color="#000"; }}
                onMouseOut={(e) => { e.currentTarget.style.background="var(--s2)"; e.currentTarget.style.color=`var(--${btn.color})`; }}>
                <span style={{ fontSize:18 }}>{btn.ico}</span>{btn.label}
              </button>
            ))}
          </div>

          {/* Rating box */}
          <div style={{ background:"var(--s2)",borderRadius:10,padding:10,marginBottom:".8rem",display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ fontFamily:"var(--font-syne)",fontSize:32,fontWeight:800,color:"var(--a2)",lineHeight:1 }}>{m.rating.toFixed(1)}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16,color:"var(--a2)",letterSpacing:2 }}>{"★".repeat(Math.round(m.rating))}{"☆".repeat(5-Math.round(m.rating))}</div>
              <div style={{ fontSize:11,color:"var(--muted)" }}>{m.reviews_count} {t.masters.reviews} · {m.jobs_count} {t.masters.projects}</div>
            </div>
          </div>

          {/* Info grid */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:".8rem" }}>
            {[
              { label:t.modal.city, val:m.city },
              { label:t.modal.exp, val:`${m.exp} ${t.masters.experience}` },
              { label:t.modal.jobs, val:`${m.jobs_count}` },
              { label:t.modal.hours, val:m.hours||"—" },
            ].map((item) => (
              <div key={item.label} style={{ background:"var(--s2)",borderRadius:8,padding:"8px 10px" }}>
                <div style={{ fontSize:9,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:3 }}>{item.label}</div>
                <div style={{ fontSize:13,fontWeight:600,color:"var(--text)" }}>{item.val}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:"flex",gap:2,background:"var(--s2)",borderRadius:9,padding:3,marginBottom:".8rem" }}>
            {(["info","reviews","chat","map"] as Tab[]).map((tb) => (
              <button key={tb} onClick={() => setTab(tb)}
                style={{ flex:1,padding:6,fontSize:11,fontWeight:600,fontFamily:"var(--font-inter)",border:"none",borderRadius:7,background:tab===tb?"var(--s3)":"transparent",color:tab===tb?"var(--text)":"var(--muted)",cursor:"pointer",transition:"all .15s" }}>
                {tb==="info"?t.modal.tabs.info:tb==="reviews"?t.modal.tabs.reviews:tb==="chat"?t.modal.tabs.chat:t.modal.tabs.map}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "info" && (
            <div>
              {m.description && <div style={{ fontSize:12,color:"var(--muted)",lineHeight:1.6,marginBottom:".8rem",background:"var(--s2)",padding:10,borderRadius:9 }}>{m.description}</div>}
              <div style={{ fontSize:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:6 }}>{t.modal.services}</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:5 }}>
                {m.trades.map((t) => (
                  <span key={t} style={{ padding:"4px 9px",borderRadius:6,fontSize:11,background:"var(--s3)",color:"var(--muted)",border:"1px solid var(--border)" }}>{TRADE_MAP[t]||"🔧"} {t}</span>
                ))}
              </div>
            </div>
          )}

          {tab === "reviews" && (
            <div>
              {reviews.length === 0 && <p style={{ fontSize:13,color:"var(--muted)",textAlign:"center",padding:"1rem 0" }}>{t.modal.noReviews}</p>}
              {reviews.map((r) => (
                <div key={r.id} style={{ background:"var(--s2)",borderRadius:9,padding:"9px 11px",marginBottom:7 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                    <span style={{ fontSize:12,fontWeight:600,color:"var(--text)" }}>{r.reviewer_name||"Потребител"}</span>
                    <span style={{ fontSize:11,color:"var(--a2)" }}>{"★".repeat(r.rating)}</span>
                  </div>
                  {r.text && <div style={{ fontSize:12,color:"var(--muted)",lineHeight:1.5 }}>{r.text}</div>}
                  <div style={{ fontSize:10,color:"var(--border)",marginTop:3 }}>{new Date(r.created_at).toLocaleDateString("bg-BG")}</div>
                </div>
              ))}
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:11,color:"var(--muted)",fontWeight:600,marginBottom:6 }}>{t.modal.writeReview}</div>
                <div style={{ display:"flex",gap:4,marginBottom:8 }}>
                  {[1,2,3,4,5].map((v) => (
                    <span key={v} onClick={() => setStarRating(v)}
                      style={{ fontSize:20,cursor:"pointer",color:v<=starRating?"var(--a2)":"var(--s3)",transition:"color .1s" }}>★</span>
                  ))}
                </div>
                <textarea value={reviewText} onChange={(e) => setRevText(e.target.value)} rows={3} placeholder={t.modal.reviewPlaceholder}
                  style={{ width:"100%",background:"var(--s2)",border:"1px solid var(--border)",borderRadius:9,padding:"9px 11px",fontSize:12,fontFamily:"var(--font-inter)",color:"var(--text)",resize:"none",outline:"none" }}/>
                <button onClick={submitReview} style={{ width:"100%",padding:8,background:"var(--s3)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .15s",marginTop:5,fontFamily:"var(--font-inter)" }}
                  onMouseOver={(e) => { e.currentTarget.style.background="var(--accent)"; e.currentTarget.style.color="#000"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background="var(--s3)"; e.currentTarget.style.color="var(--text)"; }}>
                  {t.modal.submitReview}
                </button>
              </div>
            </div>
          )}

          {tab === "chat" && (
            <div>
              <div style={{ background:"var(--s2)",borderRadius:9,padding:"9px 11px",height:150,overflowY:"auto",display:"flex",flexDirection:"column",gap:5,marginBottom:7 }}>
                {chatHistory.length === 0 && <p style={{ fontSize:12,color:"var(--muted)",textAlign:"center",margin:"auto 0" }}>Изпрати съобщение на майстора</p>}
                {chatHistory.map((msg,i) => (
                  <div key={i} style={{ maxWidth:"80%",padding:"6px 10px",borderRadius:9,fontSize:12,lineHeight:1.4,background:msg.from==="user"?"var(--accent)":"var(--s3)",color:msg.from==="user"?"#000":"var(--text)",alignSelf:msg.from==="user"?"flex-end":"flex-start" }}>
                    {msg.text}
                  </div>
                ))}
              </div>
              <div style={{ display:"flex",gap:6 }}>
                <input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} onKeyDown={(e) => e.key==="Enter"&&sendChat()} placeholder={t.modal.chatPlaceholder}
                  style={{ flex:1,background:"var(--s2)",border:"1px solid var(--border)",borderRadius:9,padding:"8px 11px",fontSize:12,fontFamily:"var(--font-inter)",color:"var(--text)",outline:"none" }}/>
                <button onClick={sendChat} style={{ padding:"8px 13px",background:"var(--accent)",color:"#000",border:"none",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer" }}>➤</button>
              </div>
            </div>
          )}

          {tab === "map" && (
            <div>
              <div style={{ background:"var(--s3)",borderRadius:9,height:130,display:"flex",alignItems:"center",justifyContent:"center",border:"1px dashed var(--border)",marginBottom:8,flexDirection:"column",gap:4 }}>
                <span style={{ fontSize:24 }}>📍</span>
                <span style={{ fontSize:12,color:"var(--muted)" }}>{m.city}</span>
              </div>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(m.city+" България")}`} target="_blank" rel="noopener noreferrer"
                style={{ display:"block",width:"100%",padding:8,background:"var(--s2)",border:"1px solid var(--border)",borderRadius:8,color:"var(--muted)",fontSize:12,fontWeight:600,cursor:"pointer",textAlign:"center",textDecoration:"none",fontFamily:"var(--font-inter)" }}>
                {t.modal.openMaps}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
