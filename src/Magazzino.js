import React, { useState, useEffect, useCallback, useRef } from "react";

// ─── MAGAZZINO ────────────────────────────────────────────────────────────────
// Pagina magazzino: scorte, carico/scarico con codice a barre, etichette.
// Usa le tabelle Supabase magazzino_articoli, magazzino_movimenti
// e la funzione muovi_magazzino.

const SUPABASE_URL = "https://qdkgkjevmynbvuqvfceg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFka2dramV2bXluYnZ1cXZmY2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNzc3NDMsImV4cCI6MjA5NTc1Mzc0M30.LW57hzZliXjg-U32tGJ4iAQR824MgZoLU4XpfkUMbj0";
const H = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };
const API = `${SUPABASE_URL}/rest/v1`;

const SCANNER_LIB = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
const BARCODE_LIB = "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js";

// ─── DATABASE ─────────────────────────────────────────────────────────────────
const dbArticoli = async () => {
  const r = await fetch(`${API}/magazzino_articoli?select=*&order=nome.asc`, { headers: H });
  if (!r.ok) throw new Error("Impossibile leggere gli articoli");
  return r.json();
};
const dbMovimenti = async () => {
  const r = await fetch(`${API}/magazzino_movimenti?select=*&order=created_at.desc&limit=40`, { headers: H });
  if (!r.ok) throw new Error("Impossibile leggere i movimenti");
  return r.json();
};
const dbSalvaArticolo = async (a) => {
  const r = await fetch(`${API}/magazzino_articoli`, {
    method: "POST",
    headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify([a]),
  });
  if (!r.ok) throw new Error("Salvataggio non riuscito");
};
const dbEliminaArticolo = async (codice) => {
  const r = await fetch(`${API}/magazzino_articoli?codice=eq.${encodeURIComponent(codice)}`, { method: "DELETE", headers: H });
  if (!r.ok) throw new Error("Eliminazione non riuscita");
};
const dbMuovi = async (codice, quantita, tipo) => {
  const r = await fetch(`${API}/rpc/muovi_magazzino`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ p_codice: codice, p_quantita: quantita, p_tipo: tipo, p_nota: "" }),
  });
  if (!r.ok) throw new Error("Movimento non registrato");
  return r.json();
};

// ─── UTILITY ──────────────────────────────────────────────────────────────────
const loadScript = (src) => new Promise((ok, ko) => {
  if (document.querySelector(`script[src="${src}"]`)) {
    const wait = setInterval(() => { if (window.Html5Qrcode || window.JsBarcode) { clearInterval(wait); ok(); } }, 100);
    setTimeout(() => { clearInterval(wait); ok(); }, 4000);
    return;
  }
  const s = document.createElement("script");
  s.src = src; s.onload = ok; s.onerror = ko;
  document.body.appendChild(s);
});

let audioCtx;
const beep = (ok = true) => {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = ok ? 1600 : 300; g.gain.value = 0.15;
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + (ok ? 0.09 : 0.25));
  } catch (e) {}
};

const stato = (a) => {
  if (a.quantita <= 0) return { label: "Finito", bg: "#FEF2F2", text: "#B91C1C" };
  if (a.quantita < a.scorta_minima) return { label: "Da riordinare", bg: "#FFFBEB", text: "#B45309" };
  return { label: "OK", bg: "#F0FDF4", text: "#15803D" };
};

const prossimoCodice = (articoli) => {
  const n = articoli
    .map(a => /^PS-(\d+)$/.exec(a.codice))
    .filter(Boolean)
    .map(m => parseInt(m[1], 10));
  const max = n.length ? Math.max(...n) : 0;
  return "PS-" + String(max + 1).padStart(4, "0");
};

const fmtData = (d) => {
  const dt = new Date(d);
  return `${dt.toLocaleDateString("it-IT")} ${dt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
};

const CSS = `
.mg{font-family:'IBM Plex Sans',sans-serif;color:#0F172A;max-width:760px;margin:0 auto}
.mg *{box-sizing:border-box}
.mg-mono{font-family:'IBM Plex Mono',monospace;font-variant-numeric:tabular-nums}
.mg-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;background:#E2E8F0;border-radius:10px;padding:4px;margin-bottom:16px}
.mg-tabs button{border:0;background:none;padding:10px 4px;border-radius:7px;font:inherit;font-size:13px;font-weight:600;color:#475569;cursor:pointer}
.mg-tabs button.on{background:#fff;color:#0F172A;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.mg-h{font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:#64748B;font-weight:600;margin:20px 0 8px}
.mg-card{background:#fff;border:1px solid #E2E8F0;border-radius:10px}
.mg-row{display:grid;grid-template-columns:1fr auto;gap:2px 12px;padding:12px 14px;border:0;border-top:1px solid #E2E8F0;background:none;width:100%;text-align:left;font:inherit;color:inherit;cursor:pointer}
.mg-row:first-child{border-top:0}
.mg-row:hover{background:#F8FAFC}
.mg-name{font-weight:600;min-width:0}
.mg-meta{font-size:12.5px;color:#64748B}
.mg-qty{font-size:19px;font-weight:600;text-align:right}
.mg-pill{justify-self:end;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:.04em}
.mg-alert{background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:12px 14px;margin-bottom:12px}
.mg-alert b{color:#B91C1C}
.mg-alert ul{margin:6px 0 0;padding-left:18px;font-size:14px}
.mg-input{width:100%;padding:11px 12px;border:1px solid #CBD5E1;border-radius:8px;font:inherit;font-size:15px;background:#fff;color:#0F172A}
.mg-btn{padding:12px 16px;border-radius:8px;border:1px solid #CBD5E1;background:#fff;color:#0F172A;font:inherit;font-weight:600;cursor:pointer}
.mg-btn.pri{background:#1E293B;border-color:#1E293B;color:#fff}
.mg-btn.danger{background:#fff;border-color:#FECACA;color:#B91C1C}
.mg-btn.big{width:100%;padding:16px;font-size:17px}
.mg-btn:disabled{opacity:.5;cursor:default}
.mg-mode{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#fff;border:1px solid #E2E8F0;border-radius:10px;padding:5px}
.mg-mode button{padding:13px;border:0;border-radius:7px;font:inherit;font-weight:600;background:none;color:#64748B;cursor:pointer}
.mg-mode button.in{background:#15803D;color:#fff}
.mg-mode button.out{background:#B91C1C;color:#fff}
.mg-scan{display:flex;gap:8px}
.mg-scan input{flex:1;min-width:0;padding:13px 12px;font-family:'IBM Plex Mono',monospace;font-size:17px;border:2px solid #1E293B;border-radius:8px}
.mg-step{display:grid;grid-template-columns:56px 1fr 56px;gap:8px}
.mg-step input{text-align:center;font-family:'IBM Plex Mono',monospace;font-size:28px;font-weight:600;border:1px solid #CBD5E1;border-radius:8px;min-width:0}
.mg-step button{font-size:24px}
.mg-quick{display:flex;gap:6px;flex-wrap:wrap}
.mg-quick button{padding:6px 12px;font-size:13px}
.mg-form{display:flex;flex-direction:column;gap:12px;padding:16px}
.mg-form label{display:flex;flex-direction:column;gap:4px;font-size:13px;color:#64748B;font-weight:500}
.mg-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mg-labels{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}
.mg-label{background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:10px;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer}
.mg-label.sel{border:2px solid #1E293B}
.mg-label svg{max-width:100%;height:auto}
.mg-toast{position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:#0F172A;color:#fff;padding:11px 16px;border-radius:8px;font-weight:600;z-index:300;max-width:calc(100% - 32px)}
.mg-hint{font-size:13px;color:#64748B;margin:0}
`;

// ─── COMPONENTE PRINCIPALE ────────────────────────────────────────────────────
export default function Magazzino({ standalone }) {
  const [tab, setTab] = useState("scorte");
  const [articoli, setArticoli] = useState([]);
  const [movimenti, setMovimenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState("");
  const [toast, setToast] = useState("");
  const [modifica, setModifica] = useState(null); // articolo da modificare, o {codice} nuovo
  const [scanCodice, setScanCodice] = useState(null);
  const toastT = useRef();
  const consumaCodice = useCallback(() => setScanCodice(null), []);

  const avviso = (m) => {
    setToast(m);
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(""), 2500);
  };

  const carica = useCallback(async () => {
    try {
      const [a, m] = await Promise.all([dbArticoli(), dbMovimenti()]);
      setArticoli(a); setMovimenti(m); setErrore("");
    } catch (e) {
      setErrore("Non riesco a collegarmi al magazzino. Controlla la connessione e riprova.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carica(); }, [carica]);
  useEffect(() => { const t = setInterval(carica, 15000); return () => clearInterval(t); }, [carica]);

  // Pistolina: caratteri veloci + Invio anche fuori dai campi
  useEffect(() => {
    let buf = "", last = 0;
    const onKey = (e) => {
      const tag = e.target.tagName || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const now = Date.now();
      if (now - last > 80) buf = "";
      last = now;
      if (e.key === "Enter" && buf.length >= 3) { setScanCodice(buf); setTab("scansiona"); buf = ""; return; }
      if (e.key.length === 1) buf += e.key;
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const apriNuovo = (codice) => {
    setModifica({ nuovo: true, codice: codice || prossimoCodice(articoli), nome: "", posizione: "", unita: "pz", quantita: 0, scorta_minima: 10, note: "" });
    setTab("articolo");
  };

  const daRiordinare = articoli.filter(a => a.quantita < a.scorta_minima);

  const tabs = [
    { k: "scorte", l: "Scorte" },
    { k: "scansiona", l: "Scansiona" },
    { k: "etichette", l: "Etichette" },
    { k: "articolo", l: modifica && !modifica.nuovo ? "Modifica" : "Nuovo" },
  ];

  return (
    <div className="mg" style={standalone ? { padding: "16px" } : null}>
      <style>{CSS}</style>
      {standalone && (
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet" />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>📦 Magazzino</h1>
        <span className="mg-hint">{articoli.length} articoli · {daRiordinare.length} da riordinare</span>
      </div>

      <div className="mg-tabs">
        {tabs.map(t => (
          <button key={t.k} className={tab === t.k ? "on" : ""} onClick={() => {
            if (t.k === "articolo" && (!modifica || !modifica.nuovo)) apriNuovo();
            else setTab(t.k);
          }}>{t.l}</button>
        ))}
      </div>

      {errore && <div className="mg-alert"><b>{errore}</b></div>}
      {loading ? <p className="mg-hint">Caricamento…</p> : (
        <>
          {tab === "scorte" && (
            <Scorte articoli={articoli} movimenti={movimenti} daRiordinare={daRiordinare}
              onApri={(a) => { setModifica(a); setTab("articolo"); }}
              onScansiona={(a) => { setScanCodice(a.codice); setTab("scansiona"); }}
              onNuovo={() => apriNuovo()} />
          )}
          {tab === "scansiona" && (
            <Scansiona articoli={articoli} codiceIniziale={scanCodice} consumaCodice={consumaCodice}
              onMovimento={async (a, q, tipo) => {
                const nuova = await dbMuovi(a.codice, q, tipo);
                beep(true);
                avviso(`${tipo === "carico" ? "Caricati" : "Scalati"} ${Math.abs(q)} ${a.unita} · ${a.nome}: ora ${nuova}`);
                carica();
              }}
              onSconosciuto={(c) => apriNuovo(c)} />
          )}
          {tab === "etichette" && <Etichette articoli={articoli} />}
          {tab === "articolo" && modifica && (
            <SchedaArticolo key={modifica.codice + (modifica.nuovo ? "n" : "")} articolo={modifica} articoli={articoli}
              onSalva={async (a) => {
                const { nuovo, ...dati } = a;
                await dbSalvaArticolo(dati);
                beep(true);
                avviso(nuovo ? "Articolo creato · trovi l'etichetta in Etichette" : "Modifiche salvate");
                setModifica(null);
                await carica();
                setTab(nuovo ? "etichette" : "scorte");
              }}
              onElimina={async (a) => {
                await dbEliminaArticolo(a.codice);
                avviso("Articolo eliminato");
                setModifica(null);
                await carica();
                setTab("scorte");
              }}
              onAnnulla={() => { setModifica(null); setTab("scorte"); }} />
          )}
        </>
      )}
      {toast && <div className="mg-toast">{toast}</div>}
    </div>
  );
}

// ─── SCORTE ───────────────────────────────────────────────────────────────────
function Scorte({ articoli, movimenti, daRiordinare, onApri, onScansiona, onNuovo }) {
  const [q, setQ] = useState("");
  const lista = articoli
    .filter(a => !q || `${a.nome} ${a.codice} ${a.posizione}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.quantita / (a.scorta_minima || 1)) - (b.quantita / (b.scorta_minima || 1)));
  const nomeDi = (c) => (articoli.find(a => a.codice === c) || {}).nome || c;

  if (!articoli.length) return (
    <div className="mg-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <b>Il magazzino è vuoto</b>
      <p className="mg-hint">Aggiungi il primo articolo: il gestionale gli assegna un codice (PS-0001, PS-0002…) e ti prepara l'etichetta da attaccare sulla scatola.</p>
      <button className="mg-btn pri" onClick={onNuovo}>＋ Aggiungi il primo articolo</button>
    </div>
  );

  return (
    <>
      {daRiordinare.length > 0 && (
        <div className="mg-alert">
          <b>{daRiordinare.length} {daRiordinare.length === 1 ? "articolo da riordinare" : "articoli da riordinare"}</b>
          <ul>{daRiordinare.map(a => <li key={a.codice}>{a.nome}: ne hai <span className="mg-mono">{a.quantita}</span>, minimo <span className="mg-mono">{a.scorta_minima}</span></li>)}</ul>
        </div>
      )}
      <input className="mg-input" placeholder="Cerca articolo, codice o posizione" value={q} onChange={e => setQ(e.target.value)} />
      <div className="mg-card" style={{ marginTop: 10 }}>
        {lista.map(a => {
          const s = stato(a);
          return (
            <div key={a.codice} className="mg-row" style={{ cursor: "default" }}>
              <span className="mg-name">{a.nome}</span>
              <span className="mg-qty mg-mono">{a.quantita} <small style={{ fontSize: 12, color: "#64748B" }}>{a.unita}</small></span>
              <span className="mg-meta"><span className="mg-mono">{a.codice}</span> · {a.posizione || "—"}</span>
              <span className="mg-pill" style={{ background: s.bg, color: s.text }}>{s.label}</span>
              <span style={{ gridColumn: "1 / -1", display: "flex", gap: 8, marginTop: 6 }}>
                <button className="mg-btn" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => onScansiona(a)}>± Carica / scarica</button>
                <button className="mg-btn" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => onApri(a)}>Modifica</button>
              </span>
            </div>
          );
        })}
        {!lista.length && <p className="mg-hint" style={{ padding: 14 }}>Nessun articolo trovato.</p>}
      </div>

      <div className="mg-h">Ultimi movimenti</div>
      <div className="mg-card">
        {movimenti.slice(0, 15).map(m => (
          <div key={m.id} className="mg-row" style={{ cursor: "default" }}>
            <span>{nomeDi(m.codice)}</span>
            <span className="mg-mono" style={{ fontWeight: 600, color: m.quantita > 0 ? "#15803D" : "#B91C1C" }}>{m.quantita > 0 ? "+" : ""}{m.quantita}</span>
            <span className="mg-meta">{fmtData(m.created_at)} · {m.tipo === "carico" ? "Carico" : m.tipo === "scarico" ? "Scarico" : m.tipo}</span>
          </div>
        ))}
        {!movimenti.length && <p className="mg-hint" style={{ padding: 14 }}>Ancora nessun movimento.</p>}
      </div>
    </>
  );
}

// ─── SCANSIONA ────────────────────────────────────────────────────────────────
function Scansiona({ articoli, codiceIniziale, consumaCodice, onMovimento, onSconosciuto }) {
  const [modo, setModo] = useState("carico");
  const [testo, setTesto] = useState("");
  const [trovato, setTrovato] = useState(null);
  const [sconosciuto, setSconosciuto] = useState(null);
  const [n, setN] = useState("1");
  const [camAttiva, setCamAttiva] = useState(false);
  const [camErrore, setCamErrore] = useState("");
  const [invio, setInvio] = useState(false);
  const inputRef = useRef();
  const qtyRef = useRef();
  const scanner = useRef(null);

  const cerca = useCallback((codice) => {
    const c = (codice || "").trim();
    if (!c) return;
    setTesto("");
    const a = articoli.find(x => x.codice.toUpperCase() === c.toUpperCase());
    if (!a) { beep(false); setTrovato(null); setSconosciuto(c); return; }
    beep(true); setSconosciuto(null); setTrovato(a); setN("1");
    setTimeout(() => qtyRef.current && qtyRef.current.select(), 50);
  }, [articoli]);

  const cercaRef = useRef(cerca);
  cercaRef.current = cerca;
  useEffect(() => { setTimeout(() => inputRef.current && inputRef.current.focus(), 50); }, []);
  useEffect(() => {
    if (codiceIniziale) { cercaRef.current(codiceIniziale); consumaCodice(); }
  }, [codiceIniziale, consumaCodice]);

  // tiene aggiornata la quantità mostrata dopo il ricaricamento
  useEffect(() => {
    if (trovato) {
      const agg = articoli.find(x => x.codice === trovato.codice);
      if (agg && agg.quantita !== trovato.quantita) setTrovato(agg);
    }
  }, [articoli, trovato]);

  const fermaCam = useCallback(() => {
    const s = scanner.current; scanner.current = null;
    setCamAttiva(false);
    if (s) s.stop().catch(() => {}).finally(() => { try { s.clear(); } catch (e) {} });
  }, []);
  useEffect(() => () => fermaCam(), [fermaCam]);

  const avviaCam = async () => {
    setCamErrore("");
    try {
      await loadScript(SCANNER_LIB);
      const L = window;
      setCamAttiva(true);
      await new Promise(r => setTimeout(r, 50));
      const s = new L.Html5Qrcode("mg-reader", {
        formatsToSupport: [L.Html5QrcodeSupportedFormats.CODE_128, L.Html5QrcodeSupportedFormats.EAN_13, L.Html5QrcodeSupportedFormats.EAN_8, L.Html5QrcodeSupportedFormats.CODE_39],
        verbose: false,
      });
      scanner.current = s;
      await s.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 260, height: 110 } }, (txt) => { fermaCam(); cerca(txt); });
    } catch (e) {
      fermaCam();
      setCamErrore("Non riesco ad aprire la fotocamera. Controlla di aver dato il permesso a Safari (Impostazioni › Safari › Fotocamera).");
    }
  };

  const conferma = async () => {
    const q = Math.floor(Number(n));
    if (!(q > 0)) return;
    setInvio(true);
    try {
      await onMovimento(trovato, modo === "carico" ? q : -q, modo);
      setTrovato(null);
      setTimeout(() => inputRef.current && inputRef.current.focus(), 50);
    } catch (e) {
      beep(false);
      alert("Movimento non registrato. Controlla la connessione e riprova.");
    } finally { setInvio(false); }
  };

  const out = modo === "scarico";
  const q = Math.floor(Number(n));
  const troppo = out && trovato && q > trovato.quantita;

  return (
    <>
      <div className="mg-h" style={{ marginTop: 0 }}>Cosa stai facendo?</div>
      <div className="mg-mode">
        <button className={modo === "carico" ? "in" : ""} onClick={() => setModo("carico")}>＋ Carico (comprato)</button>
        <button className={modo === "scarico" ? "out" : ""} onClick={() => setModo("scarico")}>− Scarico (usato)</button>
      </div>

      <div className="mg-card" style={{ padding: 16, marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        <form className="mg-scan" onSubmit={e => { e.preventDefault(); cerca(testo); }}>
          <input ref={inputRef} value={testo} onChange={e => setTesto(e.target.value)} placeholder="Spara o scrivi il codice" autoComplete="off" autoCapitalize="characters" />
          <button className="mg-btn pri" type="submit">OK</button>
        </form>
        <button className="mg-btn" onClick={() => camAttiva ? fermaCam() : avviaCam()}>{camAttiva ? "Chiudi fotocamera" : "📷 Usa la fotocamera"}</button>
        {camAttiva && <div id="mg-reader" style={{ width: "100%", borderRadius: 8, overflow: "hidden" }} />}
        {camErrore && <p className="mg-hint" style={{ color: "#B91C1C" }}>{camErrore}</p>}
        <p className="mg-hint">Con la pistolina basta sparare l'etichetta: il codice arriva qui da solo.</p>
      </div>

      {sconosciuto && (
        <div className="mg-card" style={{ padding: 16, marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <b style={{ fontSize: 18 }}>Codice non riconosciuto</b>
          <p className="mg-hint">Il codice <span className="mg-mono">{sconosciuto}</span> non è collegato a nessun articolo. Vuoi creare un articolo con questo codice?</p>
          <button className="mg-btn pri big" onClick={() => onSconosciuto(sconosciuto)}>Crea articolo</button>
        </div>
      )}

      {trovato && (
        <div className="mg-card" style={{ padding: 16, marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700 }}>{trovato.nome}</div>
            <div className="mg-meta"><span className="mg-mono">{trovato.codice}</span> · {trovato.posizione || "—"} · ora ne hai <b className="mg-mono">{trovato.quantita} {trovato.unita}</b></div>
          </div>
          <div style={{ fontWeight: 600, color: out ? "#B91C1C" : "#15803D" }}>{out ? "Quanti ne hai PRESI?" : "Quanti ne hai COMPRATI?"}</div>
          <div className="mg-step">
            <button className="mg-btn" onClick={() => setN(String(Math.max(1, (Number(n) || 1) - 1)))}>−</button>
            <input ref={qtyRef} type="number" inputMode="numeric" min="1" value={n} onChange={e => setN(e.target.value)} onKeyDown={e => { if (e.key === "Enter") conferma(); }} />
            <button className="mg-btn" onClick={() => setN(String((Number(n) || 0) + 1))}>+</button>
          </div>
          <div className="mg-quick">{[5, 10, 20, 36, 50, 100].map(v => <button key={v} className="mg-btn" onClick={() => setN(String(v))}>{v}</button>)}</div>
          {troppo && <p className="mg-hint" style={{ color: "#B45309" }}>Attenzione: ne risultano solo {trovato.quantita}. Se confermi, la scorta andrà sotto zero.</p>}
          <button className="mg-btn pri big" disabled={invio || !(q > 0)} onClick={conferma} style={{ background: out ? "#B91C1C" : "#15803D", borderColor: out ? "#B91C1C" : "#15803D" }}>
            {invio ? "Salvataggio…" : out ? `Scala ${q > 0 ? q : ""} dal magazzino` : `Aggiungi ${q > 0 ? q : ""} al magazzino`}
          </button>
        </div>
      )}
    </>
  );
}

// ─── ETICHETTE ────────────────────────────────────────────────────────────────
function Etichette({ articoli }) {
  const [pronto, setPronto] = useState(!!window.JsBarcode);
  const [sel, setSel] = useState(() => new Set());
  const box = useRef();

  useEffect(() => { if (!window.JsBarcode) loadScript(BARCODE_LIB).then(() => setPronto(true)).catch(() => {}); }, []);
  useEffect(() => {
    if (!pronto || !box.current) return;
    box.current.querySelectorAll("svg[data-code]").forEach(el => {
      try { window.JsBarcode(el, el.dataset.code, { format: "CODE128", height: 50, width: 2, fontSize: 14, margin: 2, font: "monospace" }); } catch (e) {}
    });
  }, [pronto, articoli]);

  const toggle = (c) => setSel(prev => { const s = new Set(prev); s.has(c) ? s.delete(c) : s.add(c); return s; });
  const daStampare = articoli.filter(a => sel.size === 0 || sel.has(a.codice));

  const stampa = () => {
    if (!box.current) return;
    const html = daStampare.map(a => {
      const svg = box.current.querySelector(`svg[data-code="${window.CSS && window.CSS.escape ? window.CSS.escape(a.codice) : a.codice}"]`);
      return `<div class="l"><div class="n">${a.nome.replace(/</g, "&lt;")}</div>${svg ? svg.outerHTML : ""}<div class="p">${(a.posizione || "").replace(/</g, "&lt;")}</div></div>`;
    }).join("");
    const win = window.open("", "_blank");
    if (!win) { alert("Abilita i pop-up per stampare le etichette"); return; }
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Etichette magazzino</title>
<style>
@page{size:A4;margin:0}
body{margin:0;font-family:Arial,sans-serif}
.g{display:grid;grid-template-columns:repeat(3,70mm);grid-auto-rows:37mm}
.l{width:70mm;height:37mm;padding:2mm 3mm;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;box-sizing:border-box}
.n{font-weight:bold;font-size:10pt;text-align:center;line-height:1.1;max-height:2.3em;overflow:hidden}
.l svg{width:60mm;height:auto;max-height:22mm}
.p{font-size:8pt;color:#333}
</style></head><body><div class="g">${html}</div>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script></body></html>`);
    win.document.close();
  };

  if (!articoli.length) return <p className="mg-hint">Nessun articolo ancora. Aggiungine uno da "Nuovo".</p>;

  return (
    <>
      <p className="mg-hint" style={{ marginBottom: 12 }}>
        Tocca le etichette che vuoi stampare (se non ne scegli nessuna le stampa tutte). Formato: fogli A4 adesivi da 24 etichette 70×37 mm.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button className="mg-btn pri" onClick={stampa} disabled={!pronto}>🖨️ Stampa {sel.size ? sel.size : "tutte le"} etichette</button>
        {sel.size > 0 && <button className="mg-btn" onClick={() => setSel(new Set())}>Deseleziona</button>}
      </div>
      <div className="mg-labels" ref={box}>
        {articoli.map(a => (
          <div key={a.codice} className={"mg-label" + (sel.has(a.codice) ? " sel" : "")} onClick={() => toggle(a.codice)}>
            <b style={{ fontSize: 13, textAlign: "center" }}>{a.nome}</b>
            <svg data-code={a.codice} />
            <span className="mg-meta">{a.posizione}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── NUOVO / MODIFICA ARTICOLO ────────────────────────────────────────────────
function SchedaArticolo({ articolo, articoli, onSalva, onElimina, onAnnulla }) {
  const [f, setF] = useState(articolo);
  const [salvo, setSalvo] = useState(false);
  const [confermaElimina, setConfermaElimina] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const salva = async (e) => {
    e.preventDefault();
    if (!f.nome.trim()) return;
    if (f.nuovo && articoli.some(a => a.codice.toUpperCase() === f.codice.toUpperCase())) {
      alert("Esiste già un articolo con questo codice."); return;
    }
    setSalvo(true);
    try {
      await onSalva({
        ...f,
        nome: f.nome.trim(),
        posizione: (f.posizione || "").trim(),
        unita: (f.unita || "pz").trim() || "pz",
        quantita: Math.max(0, Math.floor(Number(f.quantita) || 0)),
        scorta_minima: Math.max(0, Math.floor(Number(f.scorta_minima) || 0)),
      });
    } catch (err) { alert("Salvataggio non riuscito. Riprova."); setSalvo(false); }
  };

  return (
    <form className="mg-card mg-form" onSubmit={salva}>
      <b style={{ fontSize: 17 }}>{f.nuovo ? "Nuovo articolo" : "Modifica articolo"}</b>
      <label>Nome articolo<input className="mg-input" value={f.nome} onChange={set("nome")} required placeholder="es. Pressacavo PG9" autoFocus={f.nuovo} /></label>
      <div className="mg-2">
        <label>Posizione<input className="mg-input" value={f.posizione || ""} onChange={set("posizione")} placeholder="es. Scaffale B-2" /></label>
        <label>Unità<input className="mg-input" value={f.unita || ""} onChange={set("unita")} placeholder="pz, m, kg…" /></label>
      </div>
      <div className="mg-2">
        <label>{f.nuovo ? "Quantità che hai ora" : "Quantità (correzione inventario)"}<input className="mg-input" type="number" inputMode="numeric" min="0" value={f.quantita} onChange={set("quantita")} /></label>
        <label>Scorta minima<input className="mg-input" type="number" inputMode="numeric" min="0" value={f.scorta_minima} onChange={set("scorta_minima")} /></label>
      </div>
      <label>Codice etichetta<input className="mg-input mg-mono" value={f.codice} readOnly style={{ background: "#F1F5F9" }} /></label>
      <button className="mg-btn pri big" type="submit" disabled={salvo}>{salvo ? "Salvataggio…" : "Salva articolo"}</button>
      <div style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
        <button className="mg-btn" type="button" onClick={onAnnulla}>Annulla</button>
        {!f.nuovo && (confermaElimina ? (
          <span style={{ display: "flex", gap: 8 }}>
            <button className="mg-btn" type="button" onClick={() => setConfermaElimina(false)}>No</button>
            <button className="mg-btn danger" type="button" onClick={() => onElimina(f)}>Sì, elimina</button>
          </span>
        ) : (
          <button className="mg-btn danger" type="button" onClick={() => setConfermaElimina(true)}>Elimina articolo</button>
        ))}
      </div>
    </form>
  );
}
