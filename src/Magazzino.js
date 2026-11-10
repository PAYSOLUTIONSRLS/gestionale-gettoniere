import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SceltaConRicerca, prodottiVisibili } from "./Catalogo";

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
const dbMuovi = async (codice, quantita, tipo, nota = "") => {
  const r = await fetch(`${API}/rpc/muovi_magazzino`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ p_codice: codice, p_quantita: quantita, p_tipo: tipo, p_nota: nota }),
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
  const libero = a.disponibile !== undefined ? a.disponibile : a.quantita;
  if (a.quantita <= 0) return { label: "Finito", bg: "#FEF2F2", text: "#B91C1C" };
  if (libero < 0) return { label: "Non basta", bg: "#FEF2F2", text: "#B91C1C" };
  if (libero < a.scorta_minima) return { label: "Da riordinare", bg: "#FFFBEB", text: "#B45309" };
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

const sistemaLink = (l) => {
  const t = (l || "").trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : "https://" + t;
};
const dominio = (l) => { try { return new URL(l).hostname.replace(/^www\./, ""); } catch (e) { return "link"; } };
const BottoneCompra = ({ link, piccolo }) => link ? (
  <a href={link} target="_blank" rel="noreferrer" className="mg-btn" onClick={e => e.stopPropagation()}
    style={{ padding: piccolo ? "2px 8px" : "6px 12px", fontSize: piccolo ? 12 : 13, textDecoration: "none", color: "#1D4ED8", borderColor: "#BFDBFE", background: "#EFF6FF", display: "inline-block" }}>
    🛒 Compra{piccolo ? "" : ` su ${dominio(link)}`}
  </a>
) : null;

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
export default function Magazzino({ standalone, orders = [], products = [] }) {
  const [tab, setTab] = useState("scorte");
  const [articoliDb, setArticoli] = useState([]);
  const [movimenti, setMovimenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState("");
  const [toast, setToast] = useState("");
  const [modifica, setModifica] = useState(null); // articolo da modificare, o {codice} nuovo
  const [scanCodice, setScanCodice] = useState(null);
  const toastT = useRef();
  const consumaCodice = useCallback(() => setScanCodice(null), []);
  const impegni = useMemo(() => calcolaImpegni(orders, products), [orders, products]);
  const articoli = useMemo(() => articoliDb.map(a => {
    const imp = impegni[a.codice] || 0;
    return { ...a, impegnato: imp, disponibile: a.quantita - imp };
  }), [articoliDb, impegni]);

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
    setModifica({ nuovo: true, codice: codice || prossimoCodice(articoli), nome: "", posizione: "", unita: "pz", quantita: 0, scorta_minima: 10, note: "", link_acquisto: "" });
    setTab("articolo");
  };

  const daRiordinare = articoli.filter(a => a.disponibile < a.scorta_minima);

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
                const { nuovo } = a;
                const dati = { codice: a.codice, nome: a.nome, posizione: a.posizione || "", unita: a.unita || "pz", quantita: a.quantita, scorta_minima: a.scorta_minima, note: a.note || "", link_acquisto: a.link_acquisto || "" };
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

const ETICHETTA_TIPO = { carico: "Carico", scarico: "Scarico", spedizione: "Spedito", reso: "Spedizione annullata" };

// ─── SCORTE ───────────────────────────────────────────────────────────────────
function Scorte({ articoli, movimenti, daRiordinare, onApri, onScansiona, onNuovo }) {
  const [q, setQ] = useState("");
  const lista = articoli
    .filter(a => !q || `${a.nome} ${a.codice} ${a.posizione}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.disponibile / (a.scorta_minima || 1)) - (b.disponibile / (b.scorta_minima || 1)));
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
          <ul>{daRiordinare.map(a => <li key={a.codice}>{a.nome}: {a.impegnato > 0 ? <>liberi <span className="mg-mono">{a.disponibile}</span> (ne hai {a.quantita}, {a.impegnato} impegnati)</> : <>ne hai <span className="mg-mono">{a.quantita}</span></>}, minimo <span className="mg-mono">{a.scorta_minima}</span> <BottoneCompra link={a.link_acquisto} piccolo /></li>)}</ul>
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
              <span className="mg-meta"><span className="mg-mono">{a.codice}</span> · {a.posizione || "—"}{a.impegnato > 0 && <> · <b style={{ color: "#1D4ED8" }}>{a.impegnato} impegnati</b> · liberi <b className="mg-mono" style={{ color: a.disponibile < 0 ? "#B91C1C" : "#0F172A" }}>{a.disponibile}</b></>}</span>
              <span className="mg-pill" style={{ background: s.bg, color: s.text }}>{s.label}</span>
              <span style={{ gridColumn: "1 / -1", display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <button className="mg-btn" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => onScansiona(a)}>± Carica / scarica</button>
                <BottoneCompra link={a.link_acquisto} />
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
            <span className="mg-meta">{fmtData(m.created_at)} · {ETICHETTA_TIPO[m.tipo] || m.tipo}{m.nota ? ` · ${m.nota}` : ""}</span>
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
            {trovato.link_acquisto && <div style={{ marginTop: 8 }}><BottoneCompra link={trovato.link_acquisto} /></div>}
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
// Formati: larghezza × altezza in mm, con il testo che corre sul lato lungo.
const FORMATI = [
  { id: "dk22205", nome: "Brother rotolo continuo 62 mm (DK-22205 / DK-22251 rosso-nero) · 62 × 30 mm", w: 62, h: 30 },
  { id: "dk11209", nome: "Brother DK-11209 · 62 × 29 mm", w: 62, h: 29 },
  { id: "dk11201", nome: "Brother DK-11201 · 90 × 29 mm", w: 90, h: 29 },
  { id: "dk11208", nome: "Brother DK-11208 · 90 × 38 mm", w: 90, h: 38 },
  { id: "dk11202", nome: "Brother DK-11202 · 100 × 62 mm", w: 100, h: 62 },
  { id: "dk11204", nome: "Brother DK-11204 · 54 × 17 mm", w: 54, h: 17 },
  { id: "a4", nome: "Fogli A4 adesivi · 24 etichette 70 × 37 mm", w: 70, h: 37, a4: true },
];
const CHIAVE_FORMATO = "mg-formato-etichette";
const PX_MM = 300 / 25.4; // 300 dpi, come la stampante

// Disegna un'etichetta come immagine nitida a 300 dpi
const disegnaEtichetta = (a, f) => {
  const W = Math.round(f.w * PX_MM), H = Math.round(f.h * PX_MM);
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#fff"; g.fillRect(0, 0, W, H); g.fillStyle = "#000";
  const m = Math.round(1.5 * PX_MM);
  const font = "Arial, Helvetica, sans-serif";
  const piccola = f.h < 20;

  // nome (max 2 righe), rimpicciolito finché ci sta
  const larghezza = W - 2 * m;
  const righe = (testo, px) => {
    g.font = `bold ${px}px ${font}`;
    const parole = testo.split(/\s+/); const out = []; let r = "";
    parole.forEach(p => { const t = r ? r + " " + p : p; if (g.measureText(t).width <= larghezza || !r) r = t; else { out.push(r); r = p; } });
    if (r) out.push(r);
    return out;
  };
  let px = Math.round((piccola ? 2.8 : 3.6) * PX_MM), linee;
  const maxRighe = piccola ? 1 : 2;
  for (;;) { linee = righe(a.nome, px); if ((linee.length <= maxRighe && linee.every(l => g.measureText(l).width <= larghezza)) || px < 18) break; px -= 2; }
  linee = linee.slice(0, maxRighe);
  g.textAlign = "center"; g.textBaseline = "top";
  let y = m;
  linee.forEach(l => { g.fillText(l, W / 2, y); y += Math.round(px * 1.12); });

  // posizione in basso (se c'è spazio)
  const pos = !piccola && (a.posizione || "").trim();
  const pxPos = Math.round(2.4 * PX_MM);
  const fondo = H - m - (pos ? pxPos + Math.round(0.6 * PX_MM) : 0);
  if (pos) { g.font = `${pxPos}px ${font}`; g.textBaseline = "bottom"; g.fillText(pos, W / 2, H - m); }

  // codice a barre nello spazio che resta, con barre a pixel interi (lettura sicura)
  const spazio = fondo - y - Math.round(0.8 * PX_MM);
  if (window.JsBarcode && spazio > 20) {
    const prova = document.createElement("canvas");
    window.JsBarcode(prova, a.codice, { format: "CODE128", width: 1, height: 10, margin: 0, displayValue: false });
    const moduli = prova.width;
    const modulo = Math.max(1, Math.floor(larghezza / moduli));
    const testoPx = Math.round((piccola ? 2.2 : 2.8) * PX_MM);
    const bc = document.createElement("canvas");
    const altezza = Math.max(10, Math.min(spazio - testoPx - 6, Math.round(18 * PX_MM)));
    window.JsBarcode(bc, a.codice, { format: "CODE128", width: modulo, height: altezza, margin: 0, displayValue: true, fontSize: testoPx, textMargin: 2, font: "monospace" });
    const libero = Math.max(0, spazio - bc.height);
    g.drawImage(bc, Math.round((W - bc.width) / 2), y + Math.round(0.6 * PX_MM) + Math.round(libero / 2));
  }
  // solo bianco e nero puro: niente grigi, che sui rotoli rosso/nero escono rossi o sbiaditi
  const dati = g.getImageData(0, 0, W, H), pix = dati.data;
  for (let i = 0; i < pix.length; i += 4) {
    const v = (pix[i] * 299 + pix[i + 1] * 587 + pix[i + 2] * 114) / 1000 < 150 ? 0 : 255;
    pix[i] = pix[i + 1] = pix[i + 2] = v; pix[i + 3] = 255;
  }
  g.putImageData(dati, 0, 0);
  return c.toDataURL("image/png");
};

// PNG con la risoluzione (300 dpi) scritta dentro: aperta in Anteprima o nell'app
// Brother esce già della misura giusta in millimetri.
const TAB_CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = TAB_CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const pngConDpi = (dataUrl) => {
  const bin = atob(dataUrl.split(",")[1]);
  const png = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) png[i] = bin.charCodeAt(i);
  const ppm = Math.round(300 / 0.0254);
  const chunk = new Uint8Array(21);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9);
  chunk.set([112, 72, 89, 115], 4); // "pHYs"
  dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;
  dv.setUint32(17, crc32(chunk.subarray(4, 17)));
  const fineIHDR = 8 + 25;
  const out = new Uint8Array(png.length + 21);
  out.set(png.subarray(0, fineIHDR), 0);
  out.set(chunk, fineIHDR);
  out.set(png.subarray(fineIHDR), fineIHDR + 21);
  return new Blob([out], { type: "image/png" });
};
const nomeFile = (a) => `${a.codice} ${a.nome}`.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, " ").trim().slice(0, 80) + ".png";

function Etichette({ articoli }) {
  const [pronto, setPronto] = useState(!!window.JsBarcode);
  const [sel, setSel] = useState(() => new Set());
  const [formatoId, setFormatoId] = useState(() => { try { return localStorage.getItem(CHIAVE_FORMATO) || "dk22205"; } catch (e) { return "dk22205"; } });
  const formato = FORMATI.find(f => f.id === formatoId) || FORMATI[0];
  const [anteprime, setAnteprime] = useState({});

  useEffect(() => { if (!window.JsBarcode) loadScript(BARCODE_LIB).then(() => setPronto(true)).catch(() => {}); }, []);
  useEffect(() => { try { localStorage.setItem(CHIAVE_FORMATO, formatoId); } catch (e) {} }, [formatoId]);
  useEffect(() => {
    if (!pronto) return;
    const out = {};
    articoli.forEach(a => { try { out[a.codice] = disegnaEtichetta(a, formato); } catch (e) {} });
    setAnteprime(out);
  }, [pronto, articoli, formato]);

  const toggle = (c) => setSel(prev => { const s = new Set(prev); s.has(c) ? s.delete(c) : s.add(c); return s; });

  const scarica = (lista) => {
    lista.forEach((a, i) => setTimeout(() => {
      const url = URL.createObjectURL(pngConDpi(anteprime[a.codice] || disegnaEtichetta(a, formato)));
      const link = document.createElement("a");
      link.href = url; link.download = nomeFile(a);
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, i * 400));
  };

  const stampa = (lista) => {
    if (!lista.length) return;
    const win = window.open("", "_blank");
    if (!win) { alert("Abilita i pop-up per stampare le etichette"); return; }
    const f = formato;
    const imgs = lista.map(a => `<div class="e"><img src="${anteprime[a.codice] || disegnaEtichetta(a, f)}"></div>`).join("");
    const css = f.a4
      ? `@page{size:A4;margin:0}body{margin:0}.g{display:grid;grid-template-columns:repeat(3,70mm);grid-auto-rows:37mm}.e{width:70mm;height:37mm}.e img{width:70mm;height:37mm;display:block}`
      : `@page{size:${f.w}mm ${f.h}mm;margin:0}html,body{margin:0;padding:0}.e{width:${f.w}mm;height:${f.h}mm;overflow:hidden;page-break-after:always;break-after:page}.e:last-child{page-break-after:auto;break-after:auto}.e img{width:${f.w}mm;height:${f.h}mm;display:block}`;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Etichette ${f.w}x${f.h} mm</title><style>${css}</style></head><body>${f.a4 ? `<div class="g">${imgs}</div>` : imgs}
<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>`);
    win.document.close();
  };

  if (!articoli.length) return <p className="mg-hint">Nessun articolo ancora. Aggiungine uno da "Nuovo".</p>;

  const scelti = articoli.filter(a => sel.has(a.codice));
  return (
    <>
      <label className="mg-hint" style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12, fontWeight: 600 }}>
        Rotolo / formato etichette
        <select className="mg-input" value={formatoId} onChange={e => setFormatoId(e.target.value)}>
          {FORMATI.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
      </label>
      <p className="mg-hint" style={{ marginBottom: 12 }}>
        {formato.a4 ? "Le etichette vengono messe su fogli A4." : "Ogni etichetta esce da sola, pronta da attaccare."} Con ⬇️ Scarica salvi l'immagine dell'etichetta (già alla misura giusta) e la stampi dall'app Brother; con 🖨️ la stampi da qui. Toccane più di una per scaricarle o stamparle insieme.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button className="mg-btn pri" disabled={!pronto || !scelti.length} onClick={() => stampa(scelti)}>🖨️ Stampa {scelti.length || ""} selezionate</button>
        <button className="mg-btn" disabled={!pronto || !scelti.length} onClick={() => scarica(scelti)}>⬇️ Scarica {scelti.length || ""} selezionate</button>
        <button className="mg-btn" disabled={!pronto} onClick={() => stampa(articoli)}>Stampa tutte ({articoli.length})</button>
        {sel.size > 0 && <button className="mg-btn" onClick={() => setSel(new Set())}>Deseleziona</button>}
      </div>
      <div className="mg-labels">
        {articoli.map(a => (
          <div key={a.codice} className={"mg-label" + (sel.has(a.codice) ? " sel" : "")} onClick={() => toggle(a.codice)}>
            {anteprime[a.codice]
              ? <img src={anteprime[a.codice]} alt={a.nome} style={{ width: "100%", aspectRatio: `${formato.w} / ${formato.h}`, border: "1px solid #E2E8F0", borderRadius: 4, background: "#fff" }} />
              : <span className="mg-hint">{a.nome}</span>}
            <span style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", justifyContent: "center" }}>
              <button className="mg-btn pri" style={{ padding: "5px 10px", fontSize: 13 }} disabled={!pronto}
                onClick={e => { e.stopPropagation(); scarica([a]); }}>⬇️ Scarica</button>
              <button className="mg-btn" style={{ padding: "5px 10px", fontSize: 13 }} disabled={!pronto}
                onClick={e => { e.stopPropagation(); stampa([a]); }}>🖨️ Stampa</button>
            </span>
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
        link_acquisto: sistemaLink(f.link_acquisto),
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
      <label>Link per comprarlo<input className="mg-input" type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" value={f.link_acquisto || ""} onChange={set("link_acquisto")} placeholder="Incolla il link di Amazon, Tecnomat, fornitore…" /></label>
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

// ─── DISTINTE E IMPEGNI ───────────────────────────────────────────────────────
// Ogni prodotto può avere una "distinta": i materiali del magazzino che servono
// per costruirne uno. Gli ordini aperti impegnano il materiale, la spedizione lo scarica.
const STATI_CHIUSI = ["Spedito", "Annullato"];
const righeOrdine = (o) => (o.items && o.items.length ? o.items : [{ productId: o.productId, qty: 1 }]);

// materiale necessario per un ordine: { codiceArticolo: quantità }
export const materialeOrdine = (o, products) => {
  const tot = {};
  righeOrdine(o).forEach(it => {
    const p = products.find(x => x && x.id === it.productId);
    if (!p || !Array.isArray(p.distinta)) return;
    const n = Number(it.qty) || 1;
    p.distinta.forEach(d => { if (d.codice) tot[d.codice] = (tot[d.codice] || 0) + (Number(d.qta) || 0) * n; });
  });
  return tot;
};

export const calcolaImpegni = (orders, products) => {
  const tot = {};
  (orders || []).forEach(o => {
    if (!o || STATI_CHIUSI.includes(o.status) || o.magazzinoScaricato) return;
    const m = materialeOrdine(o, products || []);
    Object.keys(m).forEach(c => { tot[c] = (tot[c] || 0) + m[c]; });
  });
  return tot;
};

// Da chiamare quando si salva un ordine. Restituisce l'ordine (eventualmente con il flag aggiornato).
export const aggiornaMagazzinoOrdine = async (prima, dopo, products) => {
  const eraSpedito = prima && prima.status === "Spedito";
  const oraSpedito = dopo.status === "Spedito";
  const nota = [dopo.customer, dopo.refNumber].filter(Boolean).join(" · ").slice(0, 120);
  if (oraSpedito && !eraSpedito && !dopo.magazzinoScaricato) {
    const m = materialeOrdine(dopo, products);
    for (const c of Object.keys(m)) { try { if (m[c]) await dbMuovi(c, -m[c], "spedizione", nota); } catch (e) {} }
    return { ...dopo, magazzinoScaricato: true };
  }
  if (!oraSpedito && eraSpedito && dopo.magazzinoScaricato) {
    const m = materialeOrdine(dopo, products);
    for (const c of Object.keys(m)) { try { if (m[c]) await dbMuovi(c, m[c], "reso", nota); } catch (e) {} }
    return { ...dopo, magazzinoScaricato: false };
  }
  return dopo;
};

// ─── EDITOR DISTINTA (componenti di un prodotto) ──────────────────────────────
export function Distinta({ prodotto, products, onSalva, onChiudi }) {
  const [articoli, setArticoli] = useState(null);
  const [righe, setRighe] = useState(() => (prodotto.distinta || []).map(r => ({ ...r })));
  const [salvo, setSalvo] = useState(false);
  const [aggiungi, setAggiungi] = useState("");
  const [copia, setCopia] = useState("");

  useEffect(() => { dbArticoli().then(setArticoli).catch(() => setArticoli([])); }, []);

  const items = useMemo(() => (articoli || []).map(a => ({ id: a.codice, label: a.nome, code: a.codice, group: a.posizione || "" })), [articoli]);
  const nome = (c) => ((articoli || []).find(a => a.codice === c) || {}).nome || c;
  const unita = (c) => ((articoli || []).find(a => a.codice === c) || {}).unita || "pz";
  const conDistinta = useMemo(() => prodottiVisibili(products).filter(p => p.id !== prodotto.id && Array.isArray(p.distinta) && p.distinta.length)
    .map(p => ({ id: p.id, label: p.name, code: p.code, group: p.category })), [products, prodotto.id]);

  const aggiungiArticolo = (c) => {
    setAggiungi("");
    setRighe(prev => prev.some(r => r.codice === c) ? prev.map(r => r.codice === c ? { ...r, qta: (Number(r.qta) || 0) + 1 } : r) : [...prev, { codice: c, qta: 1 }]);
  };
  const copiaDa = (id) => {
    setCopia("");
    const p = products.find(x => x && x.id === id);
    if (p && Array.isArray(p.distinta)) setRighe(p.distinta.map(r => ({ ...r })));
  };
  const salva = async () => {
    setSalvo(true);
    const pulite = righe.map(r => ({ codice: r.codice, qta: Math.max(0, Number(String(r.qta).replace(",", ".")) || 0) })).filter(r => r.qta > 0);
    try { await onSalva(pulite); } finally { setSalvo(false); }
  };

  const box = { background: "#fff", border: "1.5px solid #BFDBFE", borderRadius: 12, padding: "16px 18px", marginTop: 8 };
  const btn = { background: "#fff", color: "#475569", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "9px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };
  const btnP = { ...btn, background: "#1E293B", color: "#fff", borderColor: "#1E293B", fontWeight: 600 };

  return (
    <div style={box}>
      <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: 4 }}>🔧 Componenti per 1 pezzo</div>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748B" }}>I materiali del magazzino che servono per costruire una "{prodotto.name}". Puoi anche sparare l'etichetta con la pistolina nel campo di ricerca.</p>
      {articoli === null ? <p style={{ fontSize: 13, color: "#64748B" }}>Carico il magazzino…</p> : (
        <>
          {!articoli.length && <p style={{ fontSize: 13, color: "#B45309" }}>Il magazzino è vuoto: prima aggiungi gli articoli nella pagina Magazzino.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            {righe.map((r, i) => (
              <div key={r.codice} style={{ display: "flex", gap: 8, alignItems: "center", background: "#F8FAFC", borderRadius: 8, padding: "6px 10px" }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: "#1E293B" }}>{nome(r.codice)} <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#94A3B8" }}>{r.codice}</span></span>
                <input type="number" inputMode="decimal" min="0" step="any" value={r.qta} onChange={e => { const v = e.target.value; setRighe(prev => prev.map((x, j) => j === i ? { ...x, qta: v } : x)); }}
                  style={{ width: 70, padding: "7px 8px", border: "1.5px solid #E2E8F0", borderRadius: 6, textAlign: "center", fontWeight: 700, fontFamily: "inherit" }} />
                <span style={{ fontSize: 12, color: "#64748B", width: 22 }}>{unita(r.codice)}</span>
                <button onClick={() => setRighe(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 20 }} aria-label="Togli">×</button>
              </div>
            ))}
            {!righe.length && <p style={{ margin: 0, fontSize: 13, color: "#94A3B8" }}>Nessun componente ancora.</p>}
          </div>
          {articoli.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <SceltaConRicerca items={items} value={aggiungi} onChange={aggiungiArticolo} placeholder="＋ Aggiungi componente: cerca o spara l'etichetta" />
            </div>
          )}
          {conDistinta.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <SceltaConRicerca items={conDistinta} value={copia} onChange={copiaDa} placeholder="📋 Copia i componenti da un altro prodotto…" />
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={btnP} disabled={salvo} onClick={salva}>{salvo ? "Salvataggio…" : "Salva componenti"}</button>
            <button style={btn} onClick={onChiudi}>Chiudi</button>
          </div>
        </>
      )}
    </div>
  );
}
