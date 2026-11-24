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

// ─── PROFORMA (Sibill) ────────────────────────────────────────────────────────
// "Preventivo PROF 316-2026   Data documento: 13/11/2026", "Invia a:", tabella
// Prodotto | Codice | Quantità | Prezzo… Funziona con testo copiato dal PDF o letto
// dagli screenshot (anche più di uno).
const NOI = /PAYSOLUTION[^\n]*?SEMPLIFICATA|PAYSOLUTION\s+S\.?R\.?L\.?S?\.?|04206000921|MERCALLI|09129|CAGLIARI/i;
const normNome = (t) => norma2(t).replace(/\b(o|0)\b/g, "o");
const norma2 = (t) => (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const SALTA_RIGA = /^(totale|iva\b|scadenza|imponibile|prezzo|prodotto\b|unitario|metodo|documento creato|pag\.)/i;
const SPEDIZIONE = /trasporto|imballo|spedizione|spese di/i;

export const eProforma = (t) => /preventivo|proforma|pro\s*forma|\bPROF\s*\d/i.test(t || "");

export const leggiProforma = (testi, prodotti) => {
  const elenco = Array.isArray(testi) ? testi : [testi];
  const tutte = elenco.map(pulisci);
  const righe = [].concat(...tutte);
  const tutto = righe.join("\n");
  const ris = { avvisi: [], refType: "Proforma" };

  const mNum = tutto.match(/PROF\.?\s*([0-9]+\s*[-/]\s*[0-9]{2,4})/i) || tutto.match(/pro\s*forma\s*(?:n\.?|nr\.?|numero)?\s*([0-9]+\s*[-/]\s*[0-9]{2,4})/i);
  if (mNum) ris.refNumber = mNum[1].replace(/\s+/g, "");
  const mData = tutto.match(/data documento\s*:?\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/i);
  if (mData) {
    const anno = mData[3].length === 2 ? "20" + mData[3] : mData[3];
    ris.date = `${anno}-${mData[2].padStart(2, "0")}-${mData[1].padStart(2, "0")}`;
  }

  // cliente: prima riga utile dopo "Invia a", togliendo i nostri dati se le colonne sono unite
  const iInvia = righe.findIndex(r => /invia a/i.test(r));
  if (iInvia >= 0) {
    const dopoEtichetta = righe[iInvia].replace(/^.*invia a\s*:?/i, "").trim();
    const cand = [dopoEtichetta, ...righe.slice(iInvia + 1, iInvia + 9)];
    for (const c of cand) {
      let r = c.replace(/^.*SEMPLIFICATA/i, "").replace(/^.*PAYSOLUTION\s+S\.?R\.?L\.?S?\.?/i, "");
      r = r.replace(/^[^A-Za-z0-9]+/, "").trim();
      if (!r || NOI.test(r) || /^(p\.?\s?iva|piva|pva|cf\b|c\.f\.|via\b|codice|emessa)/i.test(r) || r.replace(/[^A-Za-z]/g, "").length < 3) continue;
      ris.customer = r.replace(/\s{2,}/g, " ");
      break;
    }
  }

  // indirizzo, partita iva del cliente
  let indirizzo = "";
  righe.forEach(r => {
    const pezzi = r.split(/(?<=,\s?IT)\s+/);
    pezzi.forEach(pz => { if (!indirizzo && /\b\d{5}\b/.test(pz) && /\b(via|viale|piazza|corso|loc\.?|localit|strada|vicolo|largo)\b/i.test(pz) && !NOI.test(pz)) indirizzo = pz.trim(); });
  });
  const piva = (tutto.match(/P\.?\s?IVA\s*:?\s*(\d{11})/gi) || []).map(x => x.replace(/\D/g, "")).find(x => x !== "04206000921");

  // pagamento
  const mPag = tutto.match(/metodo di\s*pagamento\s*:?\s*([A-Za-zÀ-ú ]+?)(?:\s{2,}|\s+istituto|\s+coordinate|\n|$)/i);
  const fontePag = mPag ? mPag[1] : "";
  for (const [re, metodo] of PAGAMENTI) { if (re.test(fontePag)) { ris.paymentMethod = metodo; break; } }
  if (ris.paymentMethod) ris.paymentStatus = ris.paymentMethod === "Contrassegno" ? "contrassegno" : ["Stripe", "PayPal"].includes(ris.paymentMethod) ? "pagato" : "non_pagato";
  const scad = tutto.match(/scadenza\s*\d*\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i);

  // prodotti: "Nome … Codice Quantità Prezzo€ …" (il nome può continuare sulla riga dopo)
  const perCodice = {}, perNome = {};
  (prodotti || []).forEach(p => {
    if (!p || Array.isArray(p) || !p.id) return;
    if (p.code) { const k = normCodice(p.code); if (!perCodice[k] || (perCodice[k].hidden && !p.hidden)) perCodice[k] = p; }
    if (p.name) { const k = normNome(p.name); if (!perNome[k] || (perNome[k].hidden && !p.hidden)) perNome[k] = p; }
  });
  const RIGA = /^(.+?)\s+(\S+)\s+(\d{1,4})\s+[\d.]+,\d{2}\s?€/;
  const righeProdotto = [];
  const viste = new Set();
  tutte.forEach(rr => {
    let corrente = null;
    const daQuesta = [];
    rr.forEach(r => {
      const m = r.match(RIGA);
      if (m && !SALTA_RIGA.test(r)) {
        let nome = m[1].trim(), codice = m[2].trim();
        const eCodice = /^[-–—~_.]+$/.test(codice) ? "" : (codice === codice.toUpperCase() && /[A-Z]/.test(codice) && codice.length >= 4 ? codice : null);
        if (eCodice === null) { nome = nome + " " + codice; codice = ""; } else codice = eCodice;
        corrente = { nome, codice, qty: parseInt(m[3], 10) || 1, firma: norma2(r) };
        daQuesta.push(corrente);
      } else if (corrente && !/€/.test(r) && !SALTA_RIGA.test(r) && r.length < 80) {
        corrente.nome += " " + r;
      } else corrente = null;
    });
    // tra uno screenshot e l'altro salto le righe ripetute (parte di pagina presa due volte)
    daQuesta.forEach(x => { if (!viste.has(x.firma)) righeProdotto.push(x); });
    daQuesta.forEach(x => viste.add(x.firma));
  });

  const items = [], spedizioni = [];
  righeProdotto.forEach(x => {
    const nome = x.nome.replace(/\s+/g, " ").replace(/\s+([,)])/g, "$1").replace(/\(\s+/g, "(").trim();
    if (SPEDIZIONE.test(nome)) { spedizioni.push(`${nome} × ${x.qty}`); return; }
    const p = (x.codice && perCodice[normCodice(x.codice)]) || perNome[normNome(nome)];
    if (p) items.push({ productId: p.id, qty: x.qty });
    else {
      items.push({ productId: "__custom__", customName: x.codice ? `${nome} (${x.codice})` : nome, qty: x.qty });
      ris.avvisi.push(`"${nome}" non è nel catalogo: l'ho messo come prodotto manuale.`);
    }
  });
  if (items.length) ris.items = items;

  const note = [];
  if (indirizzo) note.push("Indirizzo: " + indirizzo);
  if (piva) note.push("P.IVA cliente: " + piva);
  if (spedizioni.length) note.push(spedizioni.join(", "));
  if (scad) note.push("Scadenza pagamento: " + scad[1]);
  if (note.length) ris.notes = note.join("\n");
  return ris;
};

// ─── RIQUADRO IMPORTA ─────────────────────────────────────────────────────────
const leggiTesto = (testi, prodotti) => {
  const unito = testi.join("\n");
  return eProforma(unito) ? leggiProforma(testi, prodotti) : leggiOrdine(unito, prodotti);
};

export default function ImportaOrdine({ prodotti, ordini, onDati }) {
  const [aperto, setAperto] = useState(false);
  const [testo, setTesto] = useState("");
  const [immagini, setImmagini] = useState([]); // [{id, file, url}]
  const [stato, setStato] = useState(null); // {tipo, msg}
  const [lavoro, setLavoro] = useState(false);
  const fileRef = useRef();

  const aggiungi = (files) => {
    const nuove = Array.from(files || []).filter(f => f && f.type && f.type.startsWith("image/"))
      .map(f => ({ id: Math.random().toString(36).slice(2), file: f, url: URL.createObjectURL(f) }));
    if (nuove.length) { setImmagini(prev => [...prev, ...nuove]); setStato(null); }
    return nuove.length;
  };

  // Cmd+V ovunque nella pagina: se negli appunti c'è un'immagine la aggiungo
  React.useEffect(() => {
    const onPaste = (e) => {
      const files = Array.from((e.clipboardData && e.clipboardData.items) || [])
        .filter(it => it.kind === "file" && it.type.startsWith("image/")).map(it => it.getAsFile());
      if (files.length) { e.preventDefault(); aggiungi(files); }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, []);

  const togli = (id) => setImmagini(prev => prev.filter(x => { if (x.id === id) URL.revokeObjectURL(x.url); return x.id !== id; }));

  const applica = (testi) => {
    const d = leggiTesto(testi, prodotti);
    const trovato = d.customer || (d.items && d.items.length) || d.refNumber;
    if (!trovato) { setStato({ tipo: "err", msg: "Non ho trovato i dati dell'ordine. Controlla che negli screenshot si vedano cliente e prodotti, oppure prova con un'immagine più grande." }); return false; }
    const doppio = d.refNumber && (ordini || []).some(o => (o.refNumber || "").toUpperCase().replace(/\s/g, "") === d.refNumber.toUpperCase());
    const parti = [];
    if (d.customer) parti.push("cliente");
    if (d.items) parti.push(`${d.items.length} ${d.items.length === 1 ? "prodotto" : "prodotti"}`);
    if (d.paymentMethod) parti.push(`pagamento ${d.paymentMethod}`);
    if (d.refNumber) parti.push(`${d.refType === "Proforma" ? "proforma" : "ordine"} ${d.refNumber}`);
    onDati(d);
    setStato({
      tipo: doppio ? "warn" : "ok",
      msg: (doppio ? `Attenzione: ${d.refNumber} risulta già inserito. ` : "") + `Ho compilato: ${parti.join(", ")}. Controlla i dati qui sotto e premi "Inserisci ordine".` + (d.avvisi.length ? " " + d.avvisi.join(" ") : ""),
    });
    return true;
  };

  const leggiImmagini = async () => {
    if (!immagini.length) return;
    setLavoro(true);
    setStato({ tipo: "info", msg: `Leggo ${immagini.length === 1 ? "lo screenshot" : `${immagini.length} screenshot`}… la prima volta può volerci qualche secondo in più.` });
    try {
      await caricaScript(OCR_LIB);
      const testi = [];
      for (let i = 0; i < immagini.length; i++) {
        if (immagini.length > 1) setStato({ tipo: "info", msg: `Leggo lo screenshot ${i + 1} di ${immagini.length}…` });
        const r = await window.Tesseract.recognize(immagini[i].file, "ita+eng");
        testi.push(r.data.text || "");
      }
      if (applica(testi)) { immagini.forEach(x => URL.revokeObjectURL(x.url)); setImmagini([]); }
    } catch (e) {
      setStato({ tipo: "err", msg: "Non sono riuscito a leggere le immagini. Controlla la connessione e riprova, oppure copia e incolla il testo." });
    } finally { setLavoro(false); }
  };

  const colori = { ok: ["#F0FDF4", "#BBF7D0", "#166534"], warn: ["#FFFBEB", "#FDE68A", "#92400E"], err: ["#FEF2F2", "#FECACA", "#B91C1C"], info: ["#EFF6FF", "#BFDBFE", "#1D4ED8"] };
  const btn = { padding: "9px 12px", borderRadius: 8, border: "1.5px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8", fontWeight: 600, fontSize: 13.5, cursor: "pointer", fontFamily: "inherit" };
  const btnP = { background: "#1E293B", color: "#fff", border: "none", borderRadius: 8, padding: "11px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" };

  return (
    <div style={{ background: "#fff", border: "1.5px dashed #93C5FD", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: 4 }}>⚡ Importa ordine o proforma</div>
      <div style={{ fontSize: 13, color: "#64748B", marginBottom: 10 }}>Fai lo screenshot e premi <b>Cmd+V</b> qui: puoi incollarne anche più di uno se la proforma è lunga. Funziona con le proforma e con gli ordini del sito.</div>

      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); aggiungi(e.dataTransfer.files); }}
        onClick={() => !immagini.length && fileRef.current && fileRef.current.click()}
        style={{ border: "2px dashed #CBD5E1", borderRadius: 10, background: "#F8FAFC", padding: immagini.length ? 10 : "22px 12px", textAlign: "center", cursor: immagini.length ? "default" : "pointer" }}>
        {!immagini.length ? (
          <div style={{ color: "#64748B", fontSize: 14 }}>
            <div style={{ fontSize: 26, marginBottom: 4 }}>📸</div>
            <b style={{ color: "#1E293B" }}>Premi Cmd+V per incollare lo screenshot</b>
            <div style={{ fontSize: 12.5, marginTop: 3 }}>oppure trascinalo qui, o tocca per sceglierlo (da telefono)</div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-start" }}>
            {immagini.map((x, i) => (
              <div key={x.id} style={{ position: "relative", width: 110 }}>
                <img src={x.url} alt={`Screenshot ${i + 1}`} style={{ width: 110, height: 140, objectFit: "cover", objectPosition: "top", borderRadius: 6, border: "1.5px solid #E2E8F0", background: "#fff", display: "block" }} />
                <span style={{ position: "absolute", left: 4, top: 4, background: "#1E293B", color: "#fff", borderRadius: 99, fontSize: 11, fontWeight: 700, padding: "1px 7px" }}>{i + 1}</span>
                <button type="button" onClick={() => togli(x.id)} aria-label="Togli" disabled={lavoro}
                  style={{ position: "absolute", right: 4, top: 4, width: 24, height: 24, borderRadius: "50%", border: "none", background: "#EF4444", color: "#fff", fontWeight: 700, cursor: "pointer", lineHeight: "24px", padding: 0 }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current && fileRef.current.click()} disabled={lavoro}
              style={{ width: 110, height: 140, borderRadius: 6, border: "2px dashed #CBD5E1", background: "#fff", color: "#64748B", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}>＋ Aggiungi<br />(o Cmd+V)</button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={e => { aggiungi(e.target.files); e.target.value = ""; }} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
        {immagini.length > 0 && <button type="button" style={{ ...btnP, opacity: lavoro ? .6 : 1 }} disabled={lavoro} onClick={leggiImmagini}>{lavoro ? "Lettura in corso…" : `Leggi ${immagini.length === 1 ? "lo screenshot" : `i ${immagini.length} screenshot`} e compila`}</button>}
        <button type="button" style={btn} onClick={() => { setAperto(!aperto); setStato(null); }}>📋 Oppure incolla il testo</button>
      </div>

      {aperto && (
        <div style={{ marginTop: 10 }}>
          <textarea value={testo} onChange={e => setTesto(e.target.value)} autoFocus
            placeholder="Seleziona tutto il testo dell'ordine o della proforma (anche dal PDF), copia e incolla qui"
            style={{ width: "100%", boxSizing: "border-box", height: 120, padding: 10, border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "inherit", fontSize: 14, resize: "vertical" }} />
          <button type="button" disabled={!testo.trim()} onClick={() => { if (applica([testo])) { setAperto(false); setTesto(""); } }}
            style={{ ...btnP, marginTop: 8, opacity: testo.trim() ? 1 : .5 }}>Compila ordine</button>
        </div>
      )}
      {stato && (() => { const [bg, bd, fg] = colori[stato.tipo]; return (
        <div style={{ marginTop: 10, background: bg, border: `1.5px solid ${bd}`, color: fg, borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontWeight: 500 }}>{stato.msg}</div>
      ); })()}
    </div>
  );
}
