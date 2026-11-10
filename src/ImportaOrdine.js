import React, { useState, useRef } from "react";

// ─── IMPORTA ORDINE DAL SITO ──────────────────────────────────────────────────
// Legge un ordine di gettoniere-shop.it da testo copiato o da screenshot
// (lettura del testo fatta sul dispositivo, senza servizi esterni) e
// precompila il modulo Nuovo ordine.

const OCR_LIB = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";

const caricaScript = (src) => new Promise((ok, ko) => {
  if (window.Tesseract) return ok();
  const s = document.createElement("script");
  s.src = src; s.onload = ok; s.onerror = ko;
  document.body.appendChild(s);
});

// confronto codici tollerante agli errori di lettura (O/0, I/1, S/5, B/8)
const normCodice = (c) => (c || "").toUpperCase().replace(/[^A-Z0-9]/g, "")
  .replace(/O/g, "0").replace(/[IL]/g, "1").replace(/S/g, "5").replace(/B/g, "8").replace(/Z/g, "2");

const pulisci = (t) => (t || "")
  .replace(/\r/g, "")
  .replace(/[ \t ]+/g, " ")
  .split("\n").map(r => r.trim()).filter(Boolean);

const ETICHETTE_FINE = /(indirizzo (di )?spedizione|condizioni di vendita|contatti\s*:|pagamento\s*:|stato dell|stato del pagamento|^ip\b|clienti base|^azioni|^informazioni|dettaglio ordine|^note\b|^descrizione|€|^CF[:\s]|^P\.?\s?IVA|telefono|@)/i;

// "Valerio Luzzi Valerio Luzzi" (colonne unite dalla lettura dello screenshot) → "Valerio Luzzi"
const togliDoppio = (r) => {
  const p = r.split(" ");
  if (p.length >= 2 && p.length % 2 === 0) {
    const a = p.slice(0, p.length / 2).join(" "), b = p.slice(p.length / 2).join(" ");
    if (a.toLowerCase() === b.toLowerCase()) return a;
  }
  return r;
};

const bloccoDopo = (righe, etichetta) => {
  const i = righe.findIndex(r => etichetta.test(r));
  if (i < 0) return [];
  const out = [];
  const m = righe[i].match(etichetta);
  const resto = righe[i].slice(m.index + m[0].length)
    .replace(/^\s*\(?\s*anagrafica\s*\)?/i, "").replace(/^[:\s]+/, "")
    .replace(/€\s*[\d.,]+/g, "").trim();
  if (resto && !ETICHETTE_FINE.test(resto)) out.push(togliDoppio(resto));
  for (let j = i + 1; j < righe.length && out.length < 6; j++) {
    if (ETICHETTE_FINE.test(righe[j])) break;
    out.push(togliDoppio(righe[j]));
  }
  return out;
};

const PAGAMENTI = [
  [/contrassegno/i, "Contrassegno"],
  [/paypal/i, "PayPal"],
  [/bonifico/i, "Bonifico"],
  [/stripe|carta di credito|apple pay|google pay|carta/i, "Stripe"],
];

export const leggiOrdine = (testo, prodotti) => {
  const righe = pulisci(testo);
  const tutto = righe.join("\n");
  const ris = { avvisi: [] };

  // numero e data ordine: "Ordine #CZNFCADDGS del 06/11/26 10:54"
  const mOrd = tutto.match(/ordine\s*[#nN°.:]*\s*#?\s*([A-Z0-9]{5,})/i);
  if (mOrd) ris.refNumber = mOrd[1].toUpperCase();
  const mData = tutto.match(/del\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2})[:.](\d{2}))?/i);
  if (mData) {
    const anno = mData[3].length === 2 ? "20" + mData[3] : mData[3];
    ris.date = `${anno}-${mData[2].padStart(2, "0")}-${mData[1].padStart(2, "0")}`;
    if (mData[4]) ris.time = `${mData[4].padStart(2, "0")}:${mData[5]}`;
  }

  // cliente e indirizzo
  const acquirente = bloccoDopo(righe, /acquirente/i);
  const spedizione = bloccoDopo(righe, /indirizzo (di )?spedizione/i);
  const nome = (spedizione[0] || acquirente[0] || "").replace(/\s{2,}/g, " ").trim();
  if (nome) ris.customer = nome;
  const indirizzo = (spedizione.length ? spedizione : acquirente).slice(1).filter(r => !/^italy$|^italia$/i.test(r));

  const tel = tutto.match(/tel(?:efono)?[.:\s]*([+\d][\d\s./-]{6,})/i);
  const email = tutto.match(/[\w.+-]+@[\w-]+\.[\w.]+/);

  // pagamento
  const blocPag = bloccoDopo(righe, /^pagamento\s*:?/i).join(" ") || "";
  const fontePag = blocPag || tutto;
  for (const [re, metodo] of PAGAMENTI) { if (re.test(fontePag)) { ris.paymentMethod = metodo; break; } }
  if (ris.paymentMethod) {
    const pagato = /pagamento effettuato|pagato\b/i.test(tutto) && !/non pagato|in attesa/i.test(tutto);
    ris.paymentStatus = ris.paymentMethod === "Contrassegno" ? "contrassegno" : (pagato || ["Stripe", "PayPal"].includes(ris.paymentMethod)) ? "pagato" : "non_pagato";
  }

  // corriere
  const corriere = tutto.match(/\b(SDA[ A-Za-z]*|BRT|Bartolini|GLS|DHL|UPS|TNT|Poste[ A-Za-z]*)\b(?=\s*€)/i);

  // note del cliente
  const iNote = righe.findIndex(r => /^note\b/i.test(r));
  let noteCliente = "";
  if (iNote >= 0) {
    const r0 = righe[iNote].replace(/^note[^:]*:\s*/i, "").trim();
    const succ = righe[iNote + 1] || "";
    noteCliente = r0 || (!ETICHETTE_FINE.test(succ) && !/^dati del|^descrizione/i.test(succ) ? succ : "");
  }

  // prodotti: codice tra parentesi, es. "(CARD1356A)", poi prezzo, quantità
  const perCodice = {};
  (prodotti || []).forEach(p => {
    if (!p || Array.isArray(p) || !p.id || !p.code) return;
    const k = normCodice(p.code);
    if (!perCodice[k] || (perCodice[k].hidden && !p.hidden)) perCodice[k] = p;
  });
  const items = [];
  const visti = new Set();
  righe.forEach((r, idx) => {
    // solo righe di prodotto: con un prezzo sulla stessa riga o subito dopo
    if (!/€/.test(r + " " + (righe[idx + 1] || ""))) return;
    const re = /\(([A-Z0-9][A-Z0-9 ._-]{2,})\)/g;
    let m;
    while ((m = re.exec(r))) {
      const grezzo = m[1].replace(/\s+/g, "");
      if (grezzo !== grezzo.toUpperCase() || !/[A-Z]/.test(grezzo)) continue;
      if (/^(RM|MI|TO|NA|RN|\d+\s*pz|ita?ly)$/i.test(grezzo) || /^\d+$/.test(grezzo) || /PZ$/i.test(grezzo)) continue;
      const k = normCodice(grezzo);
      if (k.length < 4 || visti.has(k)) continue;
      // quantità: numero tra due prezzi sulla stessa riga, o la riga dopo
      const dopo = (r.slice(m.index + m[0].length) + " " + (righe[idx + 1] || "")).replace(/\s+/g, " ");
      const mq = dopo.match(/€\s*[\d.]+,\d{2}\s+(\d{1,3})\b/) || dopo.match(/^\s*(\d{1,3})\s+€/);
      const qty = mq ? Math.max(1, parseInt(mq[1], 10)) : 1;
      const prodotto = perCodice[k];
      const descr = r.slice(0, m.index).replace(/^\W+/, "").trim();
      visti.add(k);
      if (prodotto) items.push({ productId: prodotto.id, qty });
      else {
        items.push({ productId: "__custom__", customName: `${descr || "Prodotto"} (${grezzo.toUpperCase()})`, qty });
        ris.avvisi.push(`Il codice ${grezzo.toUpperCase()} non è nel catalogo: l'ho messo come prodotto manuale.`);
      }
    }
  });
  if (items.length) ris.items = items;

  const note = [];
  if (indirizzo.length) note.push("Spedire a: " + [nome, ...indirizzo].filter(Boolean).join(", "));
  if (tel) note.push("Tel: " + tel[1].replace(/[\s./-]/g, ""));
  if (email) note.push("Email: " + email[0]);
  if (corriere) note.push("Corriere: " + corriere[1].trim());
  if (noteCliente) note.push("Note cliente: " + noteCliente);
  if (note.length) ris.notes = note.join("\n");

  return ris;
};

export default function ImportaOrdine({ prodotti, ordini, onDati }) {
  const [aperto, setAperto] = useState(false);
  const [testo, setTesto] = useState("");
  const [stato, setStato] = useState(null); // {tipo, msg}
  const fileRef = useRef();

  const applica = (t) => {
    const d = leggiOrdine(t, prodotti);
    const trovato = d.customer || (d.items && d.items.length) || d.refNumber;
    if (!trovato) { setStato({ tipo: "err", msg: "Non ho trovato i dati dell'ordine. Controlla che nel testo ci siano cliente e prodotti, oppure prova a copiare di nuovo la pagina." }); return; }
    const doppio = d.refNumber && (ordini || []).some(o => (o.refNumber || "").toUpperCase() === d.refNumber);
    const parti = [];
    if (d.customer) parti.push("cliente");
    if (d.items) parti.push(`${d.items.length} ${d.items.length === 1 ? "prodotto" : "prodotti"}`);
    if (d.paymentMethod) parti.push(`pagamento ${d.paymentMethod}`);
    if (d.refNumber) parti.push(`ordine #${d.refNumber}`);
    onDati(d);
    setStato({
      tipo: doppio ? "warn" : "ok",
      msg: (doppio ? `Attenzione: l'ordine #${d.refNumber} risulta già inserito. ` : "") + `Ho compilato: ${parti.join(", ")}. Controlla i dati qui sotto e premi "Inserisci ordine".` + (d.avvisi.length ? " " + d.avvisi.join(" ") : ""),
    });
    setAperto(false); setTesto("");
  };

  const daImmagine = async (file) => {
    if (!file) return;
    setStato({ tipo: "info", msg: "Leggo lo screenshot… la prima volta può volerci qualche secondo in più." });
    try {
      await caricaScript(OCR_LIB);
      const r = await window.Tesseract.recognize(file, "ita+eng");
      applica(r.data.text || "");
    } catch (e) {
      setStato({ tipo: "err", msg: "Non sono riuscito a leggere l'immagine. Prova con uno screenshot più nitido, oppure copia e incolla il testo dell'ordine." });
    } finally { if (fileRef.current) fileRef.current.value = ""; }
  };

  const colori = { ok: ["#F0FDF4", "#BBF7D0", "#166534"], warn: ["#FFFBEB", "#FDE68A", "#92400E"], err: ["#FEF2F2", "#FECACA", "#B91C1C"], info: ["#EFF6FF", "#BFDBFE", "#1D4ED8"] };
  const btn = { flex: 1, minWidth: 140, padding: "11px 12px", borderRadius: 8, border: "1.5px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" };

  return (
    <div style={{ background: "#fff", border: "1.5px dashed #93C5FD", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: 4 }}>⚡ Importa ordine dal sito</div>
      <div style={{ fontSize: 13, color: "#64748B", marginBottom: 10 }}>Copia la pagina dell'ordine e incollala, oppure carica uno screenshot: compilo io cliente, prodotti e pagamento.</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" style={btn} onClick={() => { setAperto(!aperto); setStato(null); }}>📋 Incolla testo</button>
        <button type="button" style={btn} onClick={() => fileRef.current && fileRef.current.click()}>📸 Da screenshot</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => daImmagine(e.target.files && e.target.files[0])} />
      </div>
      {aperto && (
        <div style={{ marginTop: 10 }}>
          <textarea value={testo} onChange={e => setTesto(e.target.value)} autoFocus
            placeholder="Sulla pagina dell'ordine: seleziona tutto, copia e incolla qui"
            style={{ width: "100%", boxSizing: "border-box", height: 120, padding: 10, border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "inherit", fontSize: 14, resize: "vertical" }} />
          <button type="button" disabled={!testo.trim()} onClick={() => applica(testo)}
            style={{ marginTop: 8, background: "#1E293B", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit", opacity: testo.trim() ? 1 : .5 }}>Compila ordine</button>
        </div>
      )}
      {stato && (() => { const [bg, bd, fg] = colori[stato.tipo]; return (
        <div style={{ marginTop: 10, background: bg, border: `1.5px solid ${bd}`, color: fg, borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontWeight: 500 }}>{stato.msg}</div>
      ); })()}
    </div>
  );
}
