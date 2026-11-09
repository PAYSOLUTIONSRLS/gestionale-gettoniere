import React, { useState, useEffect, useCallback } from "react";

// ─── PASSWORD DELL'APP ────────────────────────────────────────────────────────
// La password non è scritta qui in chiaro: c'è solo la sua "impronta".
// Per cambiarla bisogna rigenerare l'impronta (chiedere a Claude).
const IMPRONTA = "a75fb14cae7b84b257a205f62adb2a3021c92195370acba6f5b904bc6b940ede";
const SALE = "pay-solution:";
const LUNGHEZZA = 6;
const CHIAVE = "paysolution-sbloccato";

const impronta = async (testo) => {
  const dati = new TextEncoder().encode(SALE + testo);
  const h = await window.crypto.subtle.digest("SHA-256", dati);
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, "0")).join("");
};

const giaSbloccato = () => {
  try { return localStorage.getItem(CHIAVE) === IMPRONTA; } catch (e) { return false; }
};

export const esci = () => {
  try { localStorage.removeItem(CHIAVE); } catch (e) {}
  window.location.reload();
};

export default function Password({ children }) {
  const [ok, setOk] = useState(giaSbloccato);
  const [pin, setPin] = useState("");
  const [errore, setErrore] = useState(false);
  const [controllo, setControllo] = useState(false);

  const verifica = useCallback(async (valore) => {
    setControllo(true);
    try {
      if ((await impronta(valore)) === IMPRONTA) {
        try { localStorage.setItem(CHIAVE, IMPRONTA); } catch (e) {}
        setOk(true);
        return;
      }
    } catch (e) {}
    setErrore(true);
    setTimeout(() => { setPin(""); setErrore(false); }, 700);
    setControllo(false);
  }, []);

  const premi = useCallback((c) => {
    if (controllo || errore) return;
    setPin(prev => {
      if (c === "canc") return prev.slice(0, -1);
      if (prev.length >= LUNGHEZZA) return prev;
      const nuovo = prev + c;
      if (nuovo.length === LUNGHEZZA) setTimeout(() => verifica(nuovo), 120);
      return nuovo;
    });
  }, [controllo, errore, verifica]);

  useEffect(() => {
    if (ok) return;
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) premi(e.key);
      else if (e.key === "Backspace") premi("canc");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ok, premi]);

  if (ok) return children;

  const tasto = {
    height: 64, borderRadius: 16, border: "1.5px solid #E2E8F0", background: "#fff",
    fontSize: 26, fontWeight: 600, color: "#1E293B", cursor: "pointer",
    fontFamily: "'IBM Plex Sans',-apple-system,sans-serif", WebkitTapHighlightColor: "transparent",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", boxSizing: "border-box", fontFamily: "'IBM Plex Sans',-apple-system,sans-serif" }}>
      <style>{`@keyframes ps-scuoti{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-10px)}40%,80%{transform:translateX(10px)}}
      .ps-tasto:active{background:#F1F5F9 !important;transform:scale(.97)}
      @media (prefers-reduced-motion: reduce){.ps-pallini{animation:none !important}}`}</style>
      <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <img src="/IMG_0737.png" alt="Pay Solution" width="96" height="96"
          style={{ borderRadius: 22, boxShadow: "0 6px 20px rgba(220,38,38,.18)" }}
          onError={e => { e.currentTarget.style.display = "none"; }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1E293B" }}>Inserisci la password</div>
          <div style={{ fontSize: 13, color: errore ? "#DC2626" : "#64748B", marginTop: 4, minHeight: 18 }}>
            {errore ? "Password errata, riprova" : "Gestionale Pay Solution"}
          </div>
        </div>
        <div className="ps-pallini" style={{ display: "flex", gap: 14, animation: errore ? "ps-scuoti .4s" : "none" }} aria-label={`${pin.length} cifre inserite su ${LUNGHEZZA}`}>
          {Array.from({ length: LUNGHEZZA }).map((_, i) => (
            <span key={i} style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${errore ? "#DC2626" : "#1E293B"}`, background: i < pin.length ? (errore ? "#DC2626" : "#1E293B") : "transparent", transition: "background .1s" }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, width: "100%" }}>
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(n => (
            <button key={n} className="ps-tasto" style={tasto} onClick={() => premi(n)}>{n}</button>
          ))}
          <span />
          <button className="ps-tasto" style={tasto} onClick={() => premi("0")}>0</button>
          <button className="ps-tasto" style={{ ...tasto, fontSize: 18, color: "#64748B" }} onClick={() => premi("canc")} aria-label="Cancella">⌫</button>
        </div>
      </div>
    </div>
  );
}
