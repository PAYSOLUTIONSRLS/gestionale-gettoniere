import React, { useState, useEffect, useCallback } from "react";

// ─── JSONBIN CONFIG ───────────────────────────────────────────────────────────
const API_KEY  = "$2a$10$CLz.y33WRzUiWLIWVHf1u.Id26OGoReO/AQOT1biZD26YU5pS8HyO";
const BIN_ORDINI   = "6a09e5d2c0954111d8390504";
const BIN_PRODOTTI = "6a09e61c250b1311c363e032";
const BIN_UTENTI   = "6a09e627adc21f119ab3cfdc";
const BASE = "https://api.jsonbin.io/v3/b";

const headers = {
  "Content-Type": "application/json",
  "X-Master-Key": API_KEY,
};

const dbGet = async (binId) => {
  const r = await fetch(`${BASE}/${binId}/latest`, { headers });
  const j = await r.json();
  return j.record?.records ?? j.record ?? [];
};

const dbSet = async (binId, data) => {
  await fetch(`${BASE}/${binId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ records: data }),
  });
};

// ─── DATI INIZIALI ────────────────────────────────────────────────────────────
const SEED_PRODUCTS = [
  { id:"p1", name:"Gettoniera 1 doccia",   code:"GET-D1",  category:"Docce", notes:"" },
  { id:"p2", name:"Gettoniera 2 docce",    code:"GET-D2",  category:"Docce", notes:"" },
  { id:"p3", name:"Gettoniera 3 docce",    code:"GET-D3",  category:"Docce", notes:"" },
  { id:"p4", name:"Gettoniera 5 docce",    code:"GET-D5",  category:"Docce", notes:"" },
  { id:"p5", name:"Gettoniera 5 porte",    code:"GET-P5",  category:"Porte", notes:"" },
  { id:"p6", name:"Lettore RFID 1 doccia", code:"RFID-D1", category:"RFID",  notes:"" },
  { id:"p7", name:"Lettore RFID 3 docce",  code:"RFID-D3", category:"RFID",  notes:"" },
];
const SEED_USERS = [
  { username:"admin",     password:"gettoniere", role:"admin",    name:"Amministratore" },
  { username:"operatore", password:"op123",      role:"operator", name:"Operatore Lab"  },
];

const CATEGORIES     = ["Docce","Porte","Lavanderia","RFID","POS","Altro"];
const ORDER_STATUSES = ["Nuovo","In preparazione","Pronto","Pronto a imballare","Spedito","Annullato"];

const PAYMENT_METHODS = ["PayPal", "Stripe", "Bonifico", "A conto"];
const PAYMENT_COLOR = {
  "pagato":     { bg:"#F0FDF4", text:"#166534", border:"#BBF7D0", dot:"#22C55E", label:"💳 Pagato" },
  "non_pagato": { bg:"#FEF2F2", text:"#991B1B", border:"#FECACA", dot:"#EF4444", label:"⏳ Non pagato" },
};

const PRIORITY = {
  Urgente: { label:"Urgente", color:"#EF4444", bg:"#FEF2F2", border:"#FECACA", order:0 },
  Normale: { label:"Normale", color:"#F59E0B", bg:"#FFFBEB", border:"#FDE68A", order:1 },
  Bassa:   { label:"Bassa",   color:"#22C55E", bg:"#F0FDF4", border:"#BBF7D0", order:2 },
};
const STATUS_COLOR = {
  Nuovo:            { bg:"#EFF6FF", text:"#1D4ED8", border:"#BFDBFE", dot:"#3B82F6" },
  "In preparazione":{ bg:"#FFFBEB", text:"#92400E", border:"#FDE68A", dot:"#F59E0B" },
  Pronto:           { bg:"#F0FDF4", text:"#166534", border:"#BBF7D0", dot:"#22C55E" },
  Spedito:          { bg:"#F5F3FF", text:"#5B21B6", border:"#DDD6FE", dot:"#8B5CF6" },
  Annullato:        { bg:"#FEF2F2", text:"#991B1B", border:"#FECACA", dot:"#EF4444" },
  "Pronto a imballare": { bg:"#F0FDF4", text:"#166534", border:"#86EFAC", dot:"#16A34A" },
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const timeAgo = (dateStr, timeStr) => {
  const diff = Math.floor((new Date() - new Date(`${dateStr}T${timeStr}`)) / 1000);
  if (diff < 60)     return "poco fa";
  if (diff < 3600)   return `${Math.floor(diff/60)} min fa`;
  if (diff < 86400)  return `${Math.floor(diff/3600)} ore fa`;
  if (diff < 172800) return "ieri";
  return `${Math.floor(diff/86400)} giorni fa`;
};
const fmtDT = (d, t) => {
  const dt = new Date(`${d}T${t}`);
  const days = ["dom","lun","mar","mer","gio","ven","sab"];
  return `${days[dt.getDay()]} ${dt.getDate()}/${dt.getMonth()+1} alle ${t}`;
};
const sortOrders = (list) =>
  [...list].sort((a,b) => {
    const pa = PRIORITY[a.priority]?.order ?? 1;
    const pb = PRIORITY[b.priority]?.order ?? 1;
    if (pa !== pb) return pa - pb;
    // Stessa priorità: i più VECCHI prima (chi aspetta da più tempo)
    return new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);
  });

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const isTV = window.location.search.includes("tv=1");
  const isImballaggio = window.location.search.includes("tv=imballaggio");

  const [page,     setPage]     = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [o, p] = await Promise.all([
        dbGet(BIN_ORDINI),
        dbGet(BIN_PRODOTTI),
      ]);
      setOrders(Array.isArray(o) ? o : []);
      if (!Array.isArray(p) || p.length === 0) {
        setProducts(SEED_PRODUCTS);
        await dbSet(BIN_PRODOTTI, SEED_PRODUCTS);
      } else {
        setProducts(p);
      }
      // Utenti SEMPRE dal codice - il login funziona anche se JSONBin è down
      setUsers(SEED_USERS);
    } catch(e) {
      console.error("Errore caricamento dati:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Aggiornamento automatico ogni 15 secondi
  useEffect(() => {
    const t = setInterval(fetchAll, 15000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const saveOrders = async (o) => {
    setOrders(o);
    await dbSet(BIN_ORDINI, o);
  };
  const saveProducts = async (p) => {
    setProducts(p);
    await dbSet(BIN_PRODOTTI, p);
  };
  const saveUsers = async (u) => {
    setUsers(u);
    await dbSet(BIN_UTENTI, u);
  };

  if (loading) return <Loading />;
  if (isImballaggio) return <TVImballaggio orders={orders} products={products} fetchAll={fetchAll} />;
  if (isTV)    return <TVDashboard orders={orders} products={products} fetchAll={fetchAll} />;


  return (
    <Shell page={page} setPage={setPage}>
      {page === "dashboard" && <Dashboard orders={orders} products={products} setPage={setPage} />}
      {page === "new-order" && <NewOrder  products={products} orders={orders} saveOrders={saveOrders} setPage={setPage} />}
      {page === "orders"    && <OrdersList orders={orders} products={products} saveOrders={saveOrders} />}
      {page === "products"  && <Products  products={products} saveProducts={saveProducts} session={{role:"admin"}} />}
      {page === "archive"   && <Archive   orders={orders} products={products} saveOrders={saveOrders} />}
      {page === "admin"     && <Admin users={users} saveUsers={saveUsers} />}
    </Shell>
  );
}

// ─── LOADING ──────────────────────────────────────────────────────────────────
function Loading() {
  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFC", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'IBM Plex Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={{ width:40, height:40, border:"4px solid #E2E8F0", borderTop:"4px solid #1E293B", borderRadius:"50%", animation:"spin 0.8s linear infinite", marginBottom:16 }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color:"#64748B", fontSize:15 }}>Connessione al database...</p>
    </div>
  );
}

// ─── TV IMBALLAGGIO ──────────────────────────────────────────────────────────
function TVImballaggio({ orders, products, fetchAll }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => { setNow(new Date()); fetchAll(); }, 15000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const pronti = sortOrders(orders.filter(o => o.status === "Pronto a imballare"));
  const timeStr = now.toLocaleTimeString("it-IT", { hour:"2-digit", minute:"2-digit" });
  const dateStr = now.toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" });

  return (
    <div style={{ minHeight:"100vh", background:"#0A1A0A", fontFamily:"'IBM Plex Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@600&display=swap" rel="stylesheet"/>
      <style>{`body{margin:0} @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.2}} @keyframes live{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(34,197,94,0.3)}50%{box-shadow:0 0 40px rgba(34,197,94,0.6)}}`}</style>

      {/* Header verde */}
      <div style={{ background:"#14532D", padding:"18px 36px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"3px solid #22C55E" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:14, height:14, background:"#22C55E", borderRadius:"50%", animation:"live 2s infinite" }}/>
          <span style={{ color:"#fff", fontWeight:700, fontSize:26, letterSpacing:"-0.5px" }}>
            📦 Zona Imballaggio — Pronti da imballare
          </span>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:"#fff", fontFamily:"'IBM Plex Mono',monospace", fontSize:32, fontWeight:600, lineHeight:1 }}>{timeStr}</div>
          <div style={{ color:"#86EFAC", fontSize:14, textTransform:"capitalize", marginTop:4 }}>{dateStr}</div>
        </div>
      </div>

      {/* Lista ordini pronti */}
      <div style={{ padding:"24px 32px" }}>
        {pronti.length === 0 && (
          <div style={{ textAlign:"center", paddingTop:100 }}>
            <div style={{ fontSize:60, marginBottom:20 }}>✅</div>
            <div style={{ color:"#166534", fontSize:28, fontWeight:600 }}>Nessun ordine in attesa di imballaggio</div>
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {pronti.map((o, idx) => {
            const orderItems = o.items && o.items.length > 0 ? o.items : [{productId:o.productId,qty:1}];
            const pri = PRIORITY[o.priority] || PRIORITY.Normale;
            const isUrgent = o.priority === "Urgente";
            return (
              <div key={o.id} style={{
                background:"#14532D",
                border: isUrgent ? "3px solid #EF4444" : "3px solid #22C55E",
                borderLeft:"8px solid #22C55E",
                borderRadius:14,
                padding:"20px 28px",
                animation:"glow 3s ease-in-out infinite",
                display:"grid",
                gridTemplateColumns:"2fr 1.2fr 1fr 1fr",
                gap:"0 20px",
                alignItems:"center",
              }}>
                {/* Prodotti */}
                <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                  {orderItems.map((it,i) => {
                    const p = products.find(x=>x.id===it.productId);
                    return (
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ color:"#fff", fontWeight:700, fontSize:20 }}>{p?.name?.toUpperCase()||"?"}</span>
                        {it.qty>1 && <span style={{ background:"#22C55E", color:"#fff", borderRadius:6, padding:"2px 9px", fontSize:14, fontWeight:700 }}>×{it.qty}</span>}
                      </div>
                    );
                  })}
                </div>
                {/* Cliente */}
                <span style={{ color:"#BBF7D0", fontWeight:700, fontSize:20 }}>{o.customer}</span>
                {/* Tempo */}
                <span style={{ color:"#22C55E", fontWeight:700, fontSize:20, fontFamily:"'IBM Plex Mono',monospace" }}>{timeAgo(o.date, o.time)}</span>
                {/* Priorità + note */}
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {isUrgent && (
                    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:6, padding:"3px 10px", fontSize:13, fontWeight:700, color:"#EF4444" }}>
                      <span style={{ width:8,height:8,borderRadius:"50%",background:"#EF4444",display:"inline-block",animation:"pulse-dot 1.2s infinite" }}/>
                      Urgente
                    </span>
                  )}
                  {o.notes && <span style={{ color:"#86EFAC", fontSize:14 }}>📝 {o.notes}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── TV DASHBOARD ─────────────────────────────────────────────────────────────
function TVDashboard({ orders, products, fetchAll }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => { setNow(new Date()); fetchAll(); }, 15000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const active  = sortOrders(orders.filter(o => !["Spedito","Annullato"].includes(o.status)));
  const timeStr = now.toLocaleTimeString("it-IT", { hour:"2-digit", minute:"2-digit" });
  const dateStr = now.toLocaleDateString("it-IT",  { weekday:"long", day:"numeric", month:"long" });

  return (
    <div style={{ minHeight:"100vh", background:"#0F172A", fontFamily:"'IBM Plex Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@600&display=swap" rel="stylesheet"/>
      <style>{`body{margin:0} @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.2}} @keyframes live{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* Header */}
      <div style={{ background:"#1E293B", padding:"18px 36px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"2px solid #334155" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:12, height:12, background:"#22C55E", borderRadius:"50%", animation:"live 2s infinite" }}/>
          <span style={{ color:"#fff", fontWeight:700, fontSize:24, letterSpacing:"-0.5px" }}>
            Gestionale Gettoniere Shop — Ordini attivi
          </span>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:"#fff", fontFamily:"'IBM Plex Mono',monospace", fontSize:32, fontWeight:600, lineHeight:1 }}>{timeStr}</div>
          <div style={{ color:"#94A3B8", fontSize:14, textTransform:"capitalize", marginTop:4 }}>{dateStr}</div>
        </div>
      </div>

      {/* Lista ordini compatta */}
      <div style={{ padding:"16px 28px" }}>
        {active.length === 0 && (
          <div style={{ textAlign:"center", paddingTop:80 }}>
            <div style={{ color:"#475569", fontSize:28 }}>Nessun ordine attivo al momento</div>
          </div>
        )}
        {active.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1.2fr 1.2fr 0.9fr 1.4fr", gap:"0 16px", padding:"8px 16px", marginBottom:6 }}>
            {["Prodotto","Cliente","Note","Tempo","Stato / Priorità"].map(h => (
              <span key={h} style={{ color:"#475569", fontSize:12, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase" }}>{h}</span>
            ))}
          </div>
        )}
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {active.map((o, idx) => {
            const prod     = products.find(p => p.id === o.productId);
            const sc       = STATUS_COLOR[o.status] || STATUS_COLOR.Nuovo;
            const pri      = PRIORITY[o.priority]   || PRIORITY.Normale;
            const isUrgent = o.priority === "Urgente";
            return (
              <div key={o.id} style={{
                display:"grid",
                gridTemplateColumns:"2fr 1.2fr 1.2fr 0.9fr 1.4fr",
                gap:"0 16px",
                alignItems:"flex-start",
                background: isUrgent ? "#1a0f0f" : idx%2===0 ? "#1E293B" : "#172033",
                border: isUrgent ? "1.5px solid #EF4444" : "1px solid #334155",
                borderLeft:`5px solid ${sc.dot}`,
                borderRadius:8,
                padding:"11px 16px",
                boxShadow: isUrgent ? "0 0 10px rgba(239,68,68,0.2)" : "none",
              }}>
                <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                  {(() => {
                    const orderItems = o.items && o.items.length > 0 ? o.items : [{productId:o.productId,qty:1}];
                    return orderItems.map((it,i) => {
                      const p = products.find(x=>x.id===it.productId);
                      return (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ color:"#F1F5F9", fontWeight:700, fontSize:15, lineHeight:1.4 }}>
                            {p?.name?.toUpperCase()||"?"}
                          </span>
                          {it.qty > 1 && (
                            <span style={{ background:"#3B82F6", color:"#fff", borderRadius:5, padding:"1px 7px", fontSize:13, fontWeight:700 }}>×{it.qty}</span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
                <span style={{ color:"#E2E8F0", fontWeight:600, fontSize:15 }}>{o.customer}</span>
                <span style={{ color:"#94A3B8", fontSize:13, fontStyle: o.notes?"normal":"italic" }}>{o.notes || "—"}</span>
                <span style={{ color:sc.dot, fontWeight:700, fontSize:15, fontFamily:"'IBM Plex Mono',monospace" }}>{timeAgo(o.date, o.time)}</span>
                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                  <span style={{ background:sc.bg, color:sc.text, border:`1px solid ${sc.border}`, borderRadius:5, padding:"2px 9px", fontSize:12, fontWeight:700, whiteSpace:"nowrap" }}>{o.status}</span>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:pri.bg, border:`1px solid ${pri.border}`, borderRadius:5, padding:"2px 8px", fontSize:12, fontWeight:700, color:pri.color, whiteSpace:"nowrap" }}>
                    <span style={{ width:7, height:7, borderRadius:"50%", background:pri.color, display:"inline-block", animation: isUrgent ? "pulse-dot 1.2s infinite" : "none" }}/>
                    {pri.label}
                  </span>
                  </div>
                  {o.paymentMethod && (() => {
                    const pc = PAYMENT_COLOR[o.paymentStatus]||PAYMENT_COLOR["non_pagato"];
                    return <span style={{ background:pc.bg, color:pc.text, border:`1px solid ${pc.border}`, borderRadius:5, padding:"2px 9px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{pc.label} · {o.paymentMethod}{o.paymentMethod==="A conto"&&o.accontoPerc!=null?` (${o.accontoPerc}% pagato)`:""}</span>;
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TVRow({ label, val, big, mono, color }) {
  return (
    <div style={{ display:"flex", gap:10, alignItems:"baseline" }}>
      <span style={{ color:"#64748B", fontSize:14, minWidth:95 }}>{label}</span>
      <span style={{ color: color || "#E2E8F0", fontSize: big ? 20 : 15, fontWeight: big ? 700 : 400, fontFamily: mono ? "'IBM Plex Mono',monospace" : "inherit" }}>{val}</span>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login({ users, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(false);
  const handle = () => {
    const u = users.find(u => u.username === username && u.password === password);
    if (u) onLogin(u); else setErr(true);
  };
  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFC", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'IBM Plex Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <div style={{ background:"#fff", border:"1.5px solid #E2E8F0", borderRadius:16, padding:"48px 40px", width:"100%", maxWidth:380, boxShadow:"0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
          <div style={{ width:36, height:36, background:"#1E293B", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"#fff", fontSize:18 }}>⚙</span>
          </div>
          <span style={{ fontWeight:700, fontSize:17, color:"#1E293B" }}>Gestionale Gettoniere Shop</span>
        </div>
        <p style={{ color:"#64748B", fontSize:14, margin:"0 0 24px" }}>Accedi per continuare</p>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <input placeholder="Username" value={username} onChange={e=>{setUsername(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&handle()} style={IS(err)}/>
          <input type="password" placeholder="Password" value={password} onChange={e=>{setPassword(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&handle()} style={IS(err)}/>
          {err && <p style={{ color:"#EF4444", fontSize:13, margin:0 }}>⚠ Credenziali non valide</p>}
          <button onClick={handle} style={BP}>Accedi</button>
        </div>
      </div>
    </div>
  );
}

// ─── SHELL ────────────────────────────────────────────────────────────────────
function Shell({ page, setPage, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    { key:"dashboard", label:"Dashboard",    icon:"◈" },
    { key:"new-order", label:"Nuovo ordine", icon:"＋" },
    { key:"orders",    label:"Ordini attivi",icon:"≡" },
    { key:"products",  label:"Prodotti",     icon:"▦" },
    { key:"archive",   label:"Archivio",     icon:"○" },
    { key:"admin", label:"Admin", icon:"⚙" },
  ];
  const tvLink = window.location.origin + window.location.pathname + "?tv=1";
  return (
    <div style={{ minHeight:"100vh", background:"#F8FAFC", fontFamily:"'IBM Plex Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet"/>
      <style>{`body{margin:0}`}</style>
      <div style={{ background:"#1E293B", color:"#fff", padding:"0 20px", height:56, display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={()=>setMenuOpen(!menuOpen)} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", fontSize:20, padding:"4px 6px" }}>☰</button>
          <span style={{ fontWeight:700, fontSize:15, letterSpacing:"-0.5px" }}>Gestionale Gettoniere Shop</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <a href={tvLink} target="_blank" rel="noreferrer" style={{ background:"#334155", color:"#CBD5E1", borderRadius:8, padding:"6px 14px", fontSize:13, textDecoration:"none" }}>🔬 TV Laboratorio</a>
          <a href={tvLink.replace("tv=1","tv=imballaggio")} target="_blank" rel="noreferrer" style={{ background:"#166534", color:"#BBF7D0", borderRadius:8, padding:"6px 14px", fontSize:13, textDecoration:"none" }}>📦 TV Imballaggio</a>

        </div>
      </div>
      {menuOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:200, display:"flex" }}>
          <div style={{ width:240, background:"#1E293B", height:"100%", padding:"20px 0", display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"0 20px 20px", borderBottom:"1px solid #334155", marginBottom:8 }}>
              <span style={{ color:"#fff", fontWeight:700, fontSize:15 }}>Menu</span>
            </div>
            {nav.map(n => (
              <button key={n.key} onClick={()=>{setPage(n.key);setMenuOpen(false);}} style={{ background:page===n.key?"#334155":"none", border:"none", color:page===n.key?"#fff":"#94A3B8", padding:"12px 20px", textAlign:"left", cursor:"pointer", fontSize:14, fontFamily:"inherit", display:"flex", alignItems:"center", gap:10, fontWeight:page===n.key?600:400 }}>
                <span style={{ fontSize:16 }}>{n.icon}</span>{n.label}
              </button>
            ))}
          </div>
          <div style={{ flex:1, background:"rgba(0,0,0,0.4)" }} onClick={()=>setMenuOpen(false)}/>
        </div>
      )}
      <div style={{ padding:"24px 20px", maxWidth:1100, margin:"0 auto" }}>{children}</div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ orders, products, setPage }) {
  const active  = orders.filter(o => !["Spedito","Annullato"].includes(o.status));
  const today   = new Date().toISOString().slice(0,10);
  const urgent  = active.filter(o => o.priority==="Urgente").length;
  const byStatus = ORDER_STATUSES.reduce((a,s)=>({...a,[s]:active.filter(o=>o.status===s).length}),{});
  return (
    <div>
      <h1 style={H1}>Dashboard</h1>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:14, marginBottom:28 }}>
        {[
          { label:"Ordini attivi",   val:active.length,                             color:"#1D4ED8" },
          { label:"🔴 Urgenti",       val:urgent,                                    color:"#EF4444" },
          { label:"Oggi",            val:orders.filter(o=>o.date===today).length,   color:"#059669" },
          { label:"In preparazione", val:byStatus["In preparazione"],               color:"#F59E0B" },
          { label:"Pronti",          val:byStatus["Pronto"],                        color:"#22C55E" },
        ].map(c => (
          <div key={c.label} style={{ background:"#fff", border:"1.5px solid #E2E8F0", borderRadius:12, padding:"18px 20px" }}>
            <div style={{ fontSize:28, fontWeight:700, color:c.color, fontFamily:"'IBM Plex Mono',monospace" }}>{c.val}</div>
            <div style={{ fontSize:13, color:"#64748B", marginTop:2 }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:12, marginBottom:28 }}>
        <button onClick={()=>setPage("new-order")} style={{...BP,flex:1,maxWidth:220}}>＋ Nuovo ordine</button>
        <button onClick={()=>setPage("orders")}    style={{...BS,flex:1,maxWidth:220}}>Vedi ordini attivi</button>
      </div>
      <h2 style={H2}>Ordini recenti</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {sortOrders(active).slice(0,8).map(o => <OCard key={o.id} order={o} products={products} compact/>)}
        {!active.length && <Empty text="Nessun ordine attivo"/>}
      </div>
    </div>
  );
}

// ─── NUOVO ORDINE ─────────────────────────────────────────────────────────────
function NewOrder({ products, orders, saveOrders, setPage }) {
  const today = new Date().toISOString().slice(0,10);
  const nowT  = new Date().toTimeString().slice(0,5);

  // Ogni riga prodotto: { productId, qty }
  const [items,  setItems]  = useState([{ productId:"", qty:1 }]);
  const [form,   setForm]   = useState({ customer:"", date:today, time:nowT, notes:"", status:"Nuovo", priority:"Normale", paymentMethod:"Bonifico", paymentStatus:"non_pagato" });
  const [saved,  setSaved]  = useState(false);
  const [saving, setSaving] = useState(false);

  const addItem    = () => setItems([...items, { productId:"", qty:1 }]);
  const removeItem = (i) => setItems(items.filter((_,idx)=>idx!==i));
  const updateItem = (i, field, val) => setItems(items.map((it,idx)=>idx===i?{...it,[field]:val}:it));

  const ok = form.customer.trim() && items.some(it=>it.productId);

  const handle = async () => {
    if (!ok) return;
    const validItems = items.filter(it=>it.productId);
    setSaving(true);
    await saveOrders([{
      id: uid(),
      ...form,
      items: validItems,           // array di {productId, qty}
      productId: validItems[0].productId, // compatibilità TV/lista
      createdAt: new Date().toISOString(),
      paymentMethod: form.paymentMethod,
      paymentStatus: form.paymentStatus,
    }, ...orders]);
    setSaving(false); setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setItems([{ productId:"", qty:1 }]);
      setForm({ customer:"", date:today, time:nowT, notes:"", status:"Nuovo", priority:"Normale", paymentMethod:"Bonifico", paymentStatus:"non_pagato" });
    }, 2000);
  };

  return (
    <div style={{ maxWidth:620 }}>
      <h1 style={H1}>Nuovo ordine</h1>
      {saved  && <div style={{ background:"#F0FDF4", border:"1.5px solid #BBF7D0", borderRadius:10, padding:"12px 16px", marginBottom:20, color:"#166534", fontWeight:600 }}>✓ Ordine salvato!</div>}
      {saving && <div style={{ background:"#EFF6FF", border:"1.5px solid #BFDBFE", borderRadius:10, padding:"12px 16px", marginBottom:20, color:"#1D4ED8" }}>Salvataggio in corso...</div>}
      <div style={CARD}>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* ── PRODOTTI ── */}
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <label style={LB}>Prodotti *</label>
              <button onClick={addItem} style={{ ...BSM, color:"#1D4ED8", borderColor:"#BFDBFE", background:"#EFF6FF" }}>＋ Aggiungi prodotto</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {items.map((it, i) => (
                <div key={i} style={{ display:"flex", gap:8, alignItems:"center" }}>
                  {/* Select prodotto */}
                  <div style={{ flex:1 }}>
                    <select value={it.productId} onChange={e=>updateItem(i,"productId",e.target.value)} style={IS()}>
                      <option value="">— Seleziona —</option>
                      {CATEGORIES.map(cat => {
                        const cp = products.filter(p=>p.category===cat);
                        if (!cp.length) return null;
                        return <optgroup key={cat} label={cat}>{cp.map(p=><option key={p.id} value={p.id}>{p.name}{p.code?` (${p.code})`:""}</option>)}</optgroup>;
                      })}
                    </select>
                  </div>
                  {/* Quantità */}
                  <div style={{ width:80 }}>
                    <input
                      type="number" min={1} max={99}
                      value={it.qty}
                      onChange={e=>updateItem(i,"qty",Math.max(1,parseInt(e.target.value)||1))}
                      style={{...IS(), textAlign:"center", fontWeight:700}}
                    />
                  </div>
                  {/* Rimuovi */}
                  {items.length > 1 && (
                    <button onClick={()=>removeItem(i)} style={{ background:"none", border:"none", color:"#EF4444", cursor:"pointer", fontSize:20, lineHeight:1, padding:"0 4px" }}>×</button>
                  )}
                </div>
              ))}
            </div>
            <p style={{ color:"#94A3B8", fontSize:12, margin:"6px 0 0" }}>Il numero a destra è la quantità</p>
          </div>

          {/* ── CLIENTE ── */}
          <div>
            <label style={LB}>Nome cliente *</label>
            <input value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})} style={IS()} placeholder="es. Mario Rossi"/>
          </div>

          {/* ── PRIORITÀ ── */}
          <div>
            <label style={LB}>Priorità ordine</label>
            <div style={{ display:"flex", gap:10, marginTop:4 }}>
              {Object.entries(PRIORITY).map(([key,pri]) => {
                const sel = form.priority===key;
                return (
                  <button key={key} onClick={()=>setForm({...form,priority:key})} style={{ flex:1, padding:"10px 6px", border:`2px solid ${sel?pri.color:"#E2E8F0"}`, borderRadius:10, background:sel?pri.bg:"#fff", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:5, fontFamily:"inherit" }}>
                    <span style={{ width:12, height:12, borderRadius:"50%", background:pri.color, display:"inline-block" }}/>
                    <span style={{ fontSize:13, fontWeight:sel?700:500, color:sel?pri.color:"#64748B" }}>{pri.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── DATA / ORA ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div><label style={LB}>Data</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={IS()}/></div>
            <div><label style={LB}>Orario</label><input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} style={IS()}/></div>
          </div>

          {/* ── STATO ── */}
          <div>
            <label style={LB}>Stato ordine</label>
            <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={IS()}>
              {ORDER_STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>

          {/* ── NOTE ── */}
          <div>
            <label style={LB}>Note</label>
            <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{...IS(),height:80,resize:"vertical"}} placeholder="Note opzionali..."/>
          </div>

          {/* ── PAGAMENTO ── */}
          <div>
            <label style={LB}>Metodo di pagamento</label>
            <div style={{ display:"flex", gap:8, marginTop:4 }}>
              {PAYMENT_METHODS.map(m => {
                const sel = form.paymentMethod === m;
                const autoOk = m === "PayPal" || m === "Stripe";
                const icon = m==="PayPal"?"🅿":m==="Stripe"?"⚡":m==="Bonifico"?"🏦":"📋";
                return (
                  <button key={m} onClick={() => setForm({...form, paymentMethod:m, paymentStatus: autoOk?"pagato":"non_pagato", accontoPerc: m==="A conto"?(form.accontoPerc||0):undefined})}
                    style={{ flex:1, padding:"10px 4px", border:`2px solid ${sel?"#1E293B":"#E2E8F0"}`, borderRadius:10, background:sel?"#1E293B":"#fff", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:4, fontFamily:"inherit" }}>
                    <span style={{ fontSize:16 }}>{icon}</span>
                    <span style={{ fontSize:12, fontWeight:sel?700:500, color:sel?"#fff":"#64748B" }}>{m}</span>
                    {autoOk && <span style={{ fontSize:10, color:sel?"#86EFAC":"#22C55E", fontWeight:600 }}>✓ pagato</span>}
                  </button>
                );
              })}
            </div>
            {/* Bonifico: pagato/non pagato */}
            {form.paymentMethod === "Bonifico" && (
              <div style={{ display:"flex", gap:8, marginTop:10 }}>
                {["pagato","non_pagato"].map(s => {
                  const pc = PAYMENT_COLOR[s]; const sel = form.paymentStatus===s;
                  return <button key={s} onClick={() => setForm({...form, paymentStatus:s})}
                    style={{ flex:1, padding:"8px", border:`2px solid ${sel?pc.dot:"#E2E8F0"}`, borderRadius:8, background:sel?pc.bg:"#fff", cursor:"pointer", fontFamily:"inherit", fontWeight:sel?700:500, fontSize:13, color:sel?pc.text:"#64748B" }}>
                    {pc.label}
                  </button>;
                })}
              </div>
            )}
            {/* A conto: percentuale già pagata */}
            {form.paymentMethod === "A conto" && (
              <div style={{ marginTop:10 }}>
                <label style={LB}>Percentuale già pagata dal cliente</label>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <input type="number" min={0} max={100}
                    value={form.accontoPerc ?? 0}
                    onChange={e => setForm({...form, accontoPerc: Math.min(100, Math.max(0, parseInt(e.target.value)||0))})}
                    style={{...IS(), width:100, textAlign:"center", fontWeight:700, fontSize:18}}
                  />
                  <span style={{ fontSize:22, fontWeight:700, color:"#1E293B" }}>%</span>
                  <span style={{ fontSize:13, color:"#64748B" }}>
                    {form.accontoPerc >= 100 ? "✅ Saldato" : form.accontoPerc > 0 ? `Mancante: ${100-(form.accontoPerc||0)}%` : "⏳ Nessun acconto"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button onClick={handle} disabled={!ok||saving} style={{...BP,opacity:ok&&!saving?1:0.5}}>
            {saving ? "Salvataggio..." : "Inserisci ordine"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LISTA ORDINI ─────────────────────────────────────────────────────────────
function OrdersList({ orders, products, saveOrders }) {
  const [editing, setEditing] = useState(null);
  const active = sortOrders(orders.filter(o => !["Spedito","Annullato"].includes(o.status)));
  const update = async (id, changes) => {
    await saveOrders(orders.map(o=>o.id===id?{...o,...changes}:o));
    setEditing(null);
  };
  const updatePayment = async (id, paymentStatus) => {
    await saveOrders(orders.map(o=>o.id===id?{...o,paymentStatus}:o));
  };
  return (
    <div>
      <h1 style={H1}>Ordini attivi <span style={{ fontSize:16, color:"#94A3B8", fontWeight:400 }}>({active.length})</span></h1>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {active.map(o => editing===o.id
          ? <EditCard key={o.id} order={o} products={products} onSave={c=>update(o.id,c)} onCancel={()=>setEditing(null)}/>
          : <OCard    key={o.id} order={o} products={products} onEdit={()=>setEditing(o.id)} onStatusChange={s=>update(o.id,{status:s})}/>
        )}
        {!active.length && <Empty text="Nessun ordine attivo."/>}
      </div>
    </div>
  );
}

// ─── ARCHIVIO ─────────────────────────────────────────────────────────────────
function Archive({ orders, products, saveOrders }) {
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom,   setFilterFrom]   = useState("");
  const [filterTo,     setFilterTo]     = useState("");
  const archived = orders.filter(o => {
    if (!["Spedito","Annullato"].includes(o.status)) return false;
    const prod = products.find(p=>p.id===o.productId);
    if (search && !o.customer.toLowerCase().includes(search.toLowerCase()) && !(prod?.name||"").toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && o.status!==filterStatus) return false;
    if (filterFrom   && o.date<filterFrom)        return false;
    if (filterTo     && o.date>filterTo)          return false;
    return true;
  });
  return (
    <div>
      <h1 style={H1}>Archivio</h1>
      <div style={{...CARD,marginBottom:20}}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <input placeholder="Cerca cliente o prodotto..." value={search} onChange={e=>setSearch(e.target.value)} style={IS()}/>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={IS()}><option value="">Tutti gli stati</option><option>Spedito</option><option>Annullato</option></select>
          <div><label style={LB}>Dal</label><input type="date" value={filterFrom} onChange={e=>setFilterFrom(e.target.value)} style={IS()}/></div>
          <div><label style={LB}>Al</label><input  type="date" value={filterTo}   onChange={e=>setFilterTo(e.target.value)}   style={IS()}/></div>
        </div>
      </div>
      <p style={{ color:"#94A3B8", fontSize:13, marginBottom:12 }}>{archived.length} ordini trovati</p>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {archived.map(o=>(
          <div key={o.id} style={{...CARD,opacity:0.85}}>
            <OCard order={o} products={products} compact/>
            <button onClick={()=>saveOrders(orders.map(x=>x.id===o.id?{...x,status:"Nuovo"}:x))} style={{...BSM,marginTop:8}}>↩ Riporta attivo</button>
          </div>
        ))}
        {!archived.length && <Empty text="Nessun ordine in archivio"/>}
      </div>
    </div>
  );
}

// ─── PRODOTTI ─────────────────────────────────────────────────────────────────
function Products({ products, saveProducts, session }) {
  const [form,     setForm]     = useState({ name:"", code:"", category:"Docce", notes:"" });
  const [editing,  setEditing]  = useState(null);
  const [showForm, setShowForm] = useState(false);
  const saveProd = async () => {
    if (!form.name.trim()) return;
    const next = editing ? products.map(p=>p.id===editing?{...p,...form}:p) : [...products,{id:uid(),...form}];
    await saveProducts(next);
    setForm({name:"",code:"",category:"Docce",notes:""}); setEditing(null); setShowForm(false);
  };
  const grouped = CATEGORIES.reduce((a,c)=>({...a,[c]:products.filter(p=>p.category===c)}),{});
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={H1}>Prodotti</h1>
        {session.role==="admin" && <button onClick={()=>{setShowForm(!showForm);setEditing(null);setForm({name:"",code:"",category:"Docce",notes:""});}} style={BP}>{showForm?"Annulla":"＋ Aggiungi"}</button>}
      </div>
      {showForm && (
        <div style={{...CARD,marginBottom:20}}>
          <h3 style={{ margin:"0 0 16px", fontSize:15, fontWeight:600, color:"#1E293B" }}>{editing?"Modifica":"Nuovo prodotto"}</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div><label style={LB}>Nome *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={IS()} placeholder="es. Gettoniera 3 docce"/></div>
            <div><label style={LB}>Codice</label><input value={form.code} onChange={e=>setForm({...form,code:e.target.value})} style={IS()} placeholder="es. GET-D3"/></div>
          </div>
          <div style={{ marginBottom:12 }}><label style={LB}>Categoria</label><select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} style={IS()}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
          <div style={{ marginBottom:16 }}><label style={LB}>Note</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{...IS(),height:70,resize:"vertical"}}/></div>
          <div style={{ display:"flex", gap:10 }}><button onClick={saveProd} style={BP}>Salva</button><button onClick={()=>setShowForm(false)} style={BS}>Annulla</button></div>
        </div>
      )}
      {CATEGORIES.map(cat => {
        const items = grouped[cat]||[];
        if (!items.length) return null;
        return (
          <div key={cat} style={{ marginBottom:24 }}>
            <h2 style={{ fontSize:12, fontWeight:600, color:"#94A3B8", letterSpacing:"0.08em", textTransform:"uppercase", margin:"0 0 10px" }}>{cat}</h2>
            {items.map(p=>(
              <div key={p.id} style={{...CARD,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",marginBottom:8}}>
                <div>
                  <span style={{ fontWeight:600, fontSize:15, color:"#1E293B" }}>{p.name}</span>
                  {p.code && <span style={{ marginLeft:10, fontSize:12, color:"#94A3B8", fontFamily:"monospace", background:"#F1F5F9", padding:"2px 7px", borderRadius:4 }}>{p.code}</span>}
                  {p.notes && <p style={{ margin:"4px 0 0", fontSize:13, color:"#64748B" }}>{p.notes}</p>}
                </div>
                {session.role==="admin" && (
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>{setForm({name:p.name,code:p.code,category:p.category,notes:p.notes});setEditing(p.id);setShowForm(true);}} style={BSM}>Modifica</button>
                    <button onClick={()=>{if(window.confirm("Eliminare?"))saveProducts(products.filter(x=>x.id!==p.id));}} style={{...BSM,color:"#EF4444",borderColor:"#FECACA"}}>Elimina</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
      {!products.length && <Empty text="Nessun prodotto."/>}
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function Admin({ users, saveUsers }) {
  const [form, setForm]       = useState({ username:"", password:"", name:"", role:"operator" });
  const [showForm, setShowForm] = useState(false);
  return (
    <div>
      <h1 style={H1}>Pannello Admin</h1>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <h2 style={H2}>Utenti</h2>
        <button onClick={()=>setShowForm(!showForm)} style={BP}>＋ Utente</button>
      </div>
      {showForm && (
        <div style={{...CARD,marginBottom:20}}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div><label style={LB}>Username</label><input value={form.username} onChange={e=>setForm({...form,username:e.target.value})} style={IS()}/></div>
            <div><label style={LB}>Password</label><input value={form.password} onChange={e=>setForm({...form,password:e.target.value})} style={IS()}/></div>
            <div><label style={LB}>Nome</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={IS()}/></div>
            <div><label style={LB}>Ruolo</label><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={IS()}><option value="operator">Operatore</option><option value="admin">Admin</option></select></div>
          </div>
          <button onClick={async()=>{ if(!form.username||!form.password||!form.name)return; await saveUsers([...users,form]); setForm({username:"",password:"",name:"",role:"operator"}); setShowForm(false); }} style={BP}>Salva utente</button>
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {users.map(u=>(
          <div key={u.username} style={{...CARD,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 18px"}}>
            <div>
              <span style={{ fontWeight:600, color:"#1E293B" }}>{u.name}</span>
              <span style={{ marginLeft:8, fontSize:12, color:"#94A3B8" }}>@{u.username}</span>
              <span style={{ marginLeft:8, fontSize:11, background:u.role==="admin"?"#EFF6FF":"#F1F5F9", color:u.role==="admin"?"#1D4ED8":"#64748B", padding:"2px 7px", borderRadius:4 }}>{u.role}</span>
            </div>
            {u.username!=="admin" && <button onClick={async()=>{ if(window.confirm(`Eliminare ${u.username}?`)) await saveUsers(users.filter(x=>x.username!==u.username)); }} style={{...BSM,color:"#EF4444",borderColor:"#FECACA"}}>Elimina</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ORDER CARD ───────────────────────────────────────────────────────────────
function OCard({ order, products, onEdit, onStatusChange, compact }) {
  const sc  = STATUS_COLOR[order.status] || STATUS_COLOR.Nuovo;
  const pri = PRIORITY[order.priority]   || PRIORITY.Normale;

  // Supporta sia ordini multi-prodotto (items[]) sia vecchi ordini (productId)
  const orderItems = order.items && order.items.length > 0
    ? order.items
    : [{ productId: order.productId, qty: 1 }];

  return (
    <div style={{...CARD, borderLeft:`4px solid ${sc.dot}`, padding:"16px 18px"}}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
        <div style={{ flex:1 }}>
          {/* Prodotti */}
          <div style={{ marginBottom:6 }}>
            {orderItems.map((it, i) => {
              const prod = products.find(p=>p.id===it.productId);
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <span style={{ fontWeight:700, fontSize:15, color:"#1E293B" }}>{prod?.name||<span style={{color:"#EF4444"}}>Prodotto rimosso</span>}</span>
                  {it.qty > 1 && <span style={{ background:"#1E293B", color:"#fff", borderRadius:5, padding:"1px 8px", fontSize:12, fontWeight:700 }}>×{it.qty}</span>}
                  {i===0 && (
                    <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:pri.bg, border:`1px solid ${pri.border}`, borderRadius:6, padding:"2px 9px", fontSize:12, fontWeight:600, color:pri.color }}>
                      <span style={{ width:7, height:7, borderRadius:"50%", background:pri.color, display:"inline-block" }}/>{pri.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 16px", fontSize:14, color:"#64748B" }}>
            <span>👤 {order.customer}</span>
            <span>📅 {fmtDT(order.date, order.time)}</span>
            <span style={{ color:sc.dot, fontWeight:600 }}>⏱ {timeAgo(order.date, order.time)}</span>
          </div>
          {order.notes && <div style={{ marginTop:6, fontSize:13, color:"#94A3B8" }}>📝 {order.notes}</div>}
          {/* Badge pagamento */}
          {order.paymentMethod && (() => {
            const pc = PAYMENT_COLOR[order.paymentStatus] || PAYMENT_COLOR["non_pagato"];
            return (
              <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:6, flexWrap:"wrap" }}>
                <span style={{ background:pc.bg, color:pc.text, border:`1px solid ${pc.border}`, borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:600 }}>
                  {pc.label} · {order.paymentMethod}{order.paymentMethod==="A conto" && order.accontoPerc!=null ? ` (${order.accontoPerc}% pagato)` : ""}
                </span>
                {order.paymentMethod === "Bonifico" && !compact && onStatusChange && (
                  <button onClick={() => onStatusChange(null, order.paymentStatus==="pagato"?"non_pagato":"pagato")}
                    style={{ ...BSM, color: order.paymentStatus==="pagato"?"#991B1B":"#166534", borderColor: order.paymentStatus==="pagato"?"#FECACA":"#BBF7D0", background: order.paymentStatus==="pagato"?"#FEF2F2":"#F0FDF4" }}>
                    {order.paymentStatus==="pagato" ? "Segna non pagato" : "Segna pagato ✓"}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
          <span style={{ background:sc.bg, color:sc.text, border:`1px solid ${sc.border}`, borderRadius:6, padding:"4px 10px", fontSize:12, fontWeight:600, whiteSpace:"nowrap" }}>
            <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:sc.dot, marginRight:5 }}/>{order.status}
          </span>
          {!compact && onEdit && (
            <div style={{ display:"flex", gap:6 }}>
              <button onClick={onEdit} style={BSM}>Modifica</button>
              {onStatusChange && order.status!=="Pronto a imballare" && order.status!=="Spedito" && (
                <button onClick={()=>onStatusChange("Pronto a imballare")} style={{...BSM,background:"#F0FDF4",color:"#166534",borderColor:"#86EFAC"}}>📦 Imballare</button>
              )}
              {onStatusChange && order.status!=="Spedito" && <button onClick={()=>onStatusChange("Spedito")} style={{...BSM,background:"#F5F3FF",color:"#5B21B6",borderColor:"#DDD6FE"}}>Spedito ✓</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EDIT CARD ────────────────────────────────────────────────────────────────
function EditCard({ order, products, onSave, onCancel }) {
  const initItems = order.items && order.items.length > 0
    ? order.items
    : [{ productId: order.productId, qty: 1 }];

  const [items, setItems] = useState(initItems);
  const [form,  setForm]  = useState({ customer:order.customer, date:order.date, time:order.time, notes:order.notes||"", status:order.status, priority:order.priority||"Normale", paymentMethod:order.paymentMethod||"Bonifico", paymentStatus:order.paymentStatus||"non_pagato" });

  const addItem    = () => setItems([...items, { productId:"", qty:1 }]);
  const removeItem = (i) => setItems(items.filter((_,idx)=>idx!==i));
  const updateItem = (i, field, val) => setItems(items.map((it,idx)=>idx===i?{...it,[field]:val}:it));

  const handleSave = () => {
    const validItems = items.filter(it=>it.productId);
    onSave({ ...form, items: validItems, productId: validItems[0]?.productId||order.productId });
  };

  return (
    <div style={{...CARD, borderLeft:"4px solid #3B82F6"}}>
      <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:600, color:"#1E293B" }}>Modifica ordine</h3>
      <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:12 }}>

        {/* Prodotti */}
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <label style={LB}>Prodotti</label>
            <button onClick={addItem} style={{...BSM,color:"#1D4ED8",borderColor:"#BFDBFE",background:"#EFF6FF"}}>＋ Aggiungi</button>
          </div>
          {items.map((it,i)=>(
            <div key={i} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
              <div style={{ flex:1 }}>
                <select value={it.productId} onChange={e=>updateItem(i,"productId",e.target.value)} style={IS()}>
                  <option value="">— Seleziona —</option>
                  {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ width:80 }}>
                <input type="number" min={1} max={99} value={it.qty} onChange={e=>updateItem(i,"qty",Math.max(1,parseInt(e.target.value)||1))} style={{...IS(),textAlign:"center",fontWeight:700}}/>
              </div>
              {items.length>1 && <button onClick={()=>removeItem(i)} style={{ background:"none",border:"none",color:"#EF4444",cursor:"pointer",fontSize:20,padding:"0 4px" }}>×</button>}
            </div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div><label style={LB}>Cliente</label><input value={form.customer} onChange={e=>setForm({...form,customer:e.target.value})} style={IS()}/></div>
          <div><label style={LB}>Stato</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={IS()}>{ORDER_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
          <div><label style={LB}>Data</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={IS()}/></div>
          <div><label style={LB}>Orario</label><input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} style={IS()}/></div>
        </div>

        {/* Priorità */}
        <div>
          <label style={LB}>Priorità</label>
          <div style={{ display:"flex", gap:8, marginTop:4 }}>
            {Object.entries(PRIORITY).map(([key,pri])=>{
              const sel=form.priority===key;
              return <button key={key} onClick={()=>setForm({...form,priority:key})} style={{ flex:1,padding:"8px 4px",border:`2px solid ${sel?pri.color:"#E2E8F0"}`,borderRadius:8,background:sel?pri.bg:"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,fontFamily:"inherit" }}>
                <span style={{ width:10,height:10,borderRadius:"50%",background:pri.color,display:"inline-block" }}/>
                <span style={{ fontSize:12,fontWeight:sel?700:500,color:sel?pri.color:"#64748B" }}>{pri.label}</span>
              </button>;
            })}
          </div>
        </div>

        <div><label style={LB}>Note</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{...IS(),height:60,resize:"vertical"}}/></div>
        {/* Pagamento */}
        <div>
          <label style={LB}>Metodo di pagamento</label>
          <div style={{ display:"flex", gap:6, marginTop:4 }}>
            {PAYMENT_METHODS.map(m => {
              const sel = form.paymentMethod===m;
              const autoOk = m==="PayPal"||m==="Stripe";
              const icon = m==="PayPal"?"🅿":m==="Stripe"?"⚡":m==="Bonifico"?"🏦":"📋";
              return <button key={m} onClick={()=>setForm({...form,paymentMethod:m,paymentStatus:autoOk?"pagato":"non_pagato",accontoPerc:m==="A conto"?(form.accontoPerc||0):undefined})}
                style={{ flex:1,padding:"7px 4px",border:`2px solid ${sel?"#1E293B":"#E2E8F0"}`,borderRadius:8,background:sel?"#1E293B":"#fff",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,fontFamily:"inherit" }}>
                <span style={{ fontSize:14 }}>{icon}</span>
                <span style={{ fontSize:11,fontWeight:sel?700:500,color:sel?"#fff":"#64748B" }}>{m}</span>
              </button>;
            })}
          </div>
          {form.paymentMethod==="Bonifico" && (
            <div style={{ display:"flex", gap:6, marginTop:8 }}>
              {["pagato","non_pagato"].map(s=>{
                const pc=PAYMENT_COLOR[s]; const sel=form.paymentStatus===s;
                return <button key={s} onClick={()=>setForm({...form,paymentStatus:s})}
                  style={{ flex:1,padding:"7px",border:`2px solid ${sel?pc.dot:"#E2E8F0"}`,borderRadius:8,background:sel?pc.bg:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:sel?700:500,fontSize:12,color:sel?pc.text:"#64748B" }}>
                  {pc.label}
                </button>;
              })}
            </div>
          )}
          {form.paymentMethod==="A conto" && (
            <div style={{ marginTop:8 }}>
              <label style={LB}>Percentuale già pagata</label>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <input type="number" min={0} max={100} value={form.accontoPerc??0}
                  onChange={e=>setForm({...form,accontoPerc:Math.min(100,Math.max(0,parseInt(e.target.value)||0))})}
                  style={{...IS(),width:90,textAlign:"center",fontWeight:700,fontSize:16}}/>
                <span style={{ fontSize:18,fontWeight:700 }}>%</span>
                <span style={{ fontSize:12,color:"#64748B" }}>{(form.accontoPerc||0)>=100?"✅ Saldato":(form.accontoPerc||0)>0?`Mancante: ${100-(form.accontoPerc||0)}%`:"⏳ Nessun acconto"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div style={{ display:"flex", gap:8 }}><button onClick={handleSave} style={BP}>Salva</button><button onClick={onCancel} style={BS}>Annulla</button></div>
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ textAlign:"center", padding:"40px 20px", color:"#94A3B8", fontSize:15 }}><div style={{ fontSize:32, marginBottom:10 }}>○</div>{text}</div>;
}

// ─── STILI ────────────────────────────────────────────────────────────────────
const IS   = (err) => ({ width:"100%", boxSizing:"border-box", padding:"10px 12px", fontSize:14, border:`1.5px solid ${err?"#FCA5A5":"#E2E8F0"}`, borderRadius:8, fontFamily:"'IBM Plex Sans',sans-serif", color:"#1E293B", background:"#fff", outline:"none" });
const CARD = { background:"#fff", border:"1.5px solid #E2E8F0", borderRadius:12, padding:"18px 20px", boxShadow:"0 1px 6px rgba(0,0,0,0.04)" };
const BP   = { background:"#1E293B", color:"#fff", border:"none", borderRadius:8, padding:"10px 20px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'IBM Plex Sans',sans-serif" };
const BS   = { background:"#fff", color:"#64748B", border:"1.5px solid #E2E8F0", borderRadius:8, padding:"10px 20px", fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"'IBM Plex Sans',sans-serif" };
const BSM  = { background:"#F8FAFC", color:"#475569", border:"1.5px solid #E2E8F0", borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"'IBM Plex Sans',sans-serif" };
const LB   = { display:"block", fontSize:12, fontWeight:600, color:"#64748B", marginBottom:5, letterSpacing:"0.03em" };
const H1   = { fontSize:24, fontWeight:700, color:"#1E293B", margin:"0 0 20px", letterSpacing:"-0.5px" };
const H2   = { fontSize:17, fontWeight:600, color:"#1E293B", margin:"0 0 14px" };
