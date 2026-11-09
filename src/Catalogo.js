import React, { useState, useMemo, useRef, useEffect } from "react";

// ─── CATALOGO PRODOTTI ────────────────────────────────────────────────────────
// Catalogo ufficiale preso da gettoniere-shop.it, ricerca prodotti
// e schermata per importarlo abbinando i prodotti vecchi.

const SUPABASE_URL = "https://qdkgkjevmynbvuqvfceg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFka2dramV2bXluYnZ1cXZmY2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNzc3NDMsImV4cCI6MjA5NTc1Mzc0M30.LW57hzZliXjg-U32tGJ4iAQR824MgZoLU4XpfkUMbj0";
const H = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };
const SITO = "https://www.gettoniere-shop.it/it/";

const CATEGORIE_CATALOGO = ["Docce", "Lavatrici", "Porte", "Luci", "Universali", "POS", "RFID", "Cambiamonete", "Toelettature", "Distributori", "Speciali", "Gettoni e Tessere", "Servizi", "Ricambi"];

// [id interno, categoria, nome sul sito, link, codice prodotto del sito]
const CATALOGO_RAW = [
  ["DOC-001", "Docce", "1 DOCCIA - Gettoniera multimoneta + pausa + elettrovalvola 12Vcc", "gettoniere-per-docce/gettoniera-per-1-doccia-a-12vcc-per-esterni", "SC642979"],
  ["DOC-002", "Docce", "Gettoniera per 1 Doccia con Moneta o Gettone – Funzione Pausa con Elettrovalvola 12Vcc", "gettoniere-per-docce/gettoniera-mono-moneta-per-comando-di-1-doccia-elettrovalvola-12vcc-inclusa", "SC804813"],
  ["DOC-003", "Docce", "1 DOCCIA – Gettoniera multimoneta con apertura porta e comando doccia", "gettoniere-per-docce/1-doccia-gettoniera-multimoneta-per-1-doccia-apertura-porta", "SC784000"],
  ["DOC-004", "Docce", "Gettoniera Multimoneta per 1 Doccia con Elettrovalvola 12Vcc e Funzione Pausa", "gettoniere-per-docce/1-doccia-gettoniera-multi-moneta-elettrovalvola-12vcc", "SC116872"],
  ["DOC-005", "Docce", "Gettoniera Multimoneta per 1 Doccia con Elettrovalvola 12Vcc – Controllo a Tempo", "gettoniere-per-docce/1-doccia-gettoniera-multimoneta-elettrovalvola-12vcc", "SC498275"],
  ["DOC-006", "Docce", "1 DOCCIA – Gettoniera multimoneta con Lettore RFID, ricarica tessere integrata, Pausa ed elettrovalvola 12Vcc", "gettoniere-per-docce/gettoniera-multimoneta-per-doccia-lettore-rfid-con-elettrovalvola", "SC777580"],
  ["DOC-007", "Docce", "1 DOCCIA – Gettoniera multimoneta con Pausa ed elettrovalvola 12Vcc", "gettoniere-per-docce/gettoniera-per-docce-con-elettrovalvola", "SC680636"],
  ["DOC-008", "Docce", "Gettoniera multimoneta in box ABS per 1 doccia con elettrovalvola 12Vcc", "gettoniere-per-docce/1-doccia-box-in-abs-gettoniera-multimoneta-elettrovalvola-12vcc", "SC491365"],
  ["DOC-009", "Docce", "Lettore di Carte/Braccialetti per 1 doccia + pausa + elettrovalvola", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-per-1-doccia-pausa", "SC060849-01"],
  ["DOC-010", "Docce", "Lettore RFID per Carte e Braccialetti per 1 Doccia con Elettrovalvola 12 Vcc", "gettoniere-per-docce/copia-di-lettore-di-carte-braccialetti-per-1-doccia-o-altro-dispositivo", "RFID1DOCC-02"],
  ["DOC-011", "Docce", "1 DOCCIA – Lettore RFID per Tessere e Braccialetti con Programmatore Incluso ed Elettrovalvola 12Vcc", "gettoniere-per-docce/lettore-di-carte-braccialetti-programmatore", "SC876555"],
  ["DOC-012", "Docce", "Lettore TOP di Carte/Braccialetti per 1 doccia o altro dispositivo", "lettori-di-carte-e-braccialetti/lettore-top-di-carte-braccialetti-per-1-doccia-o-altro-dispositivo", "RFID1TOP"],
  ["DOC-013", "Docce", "2 DOCCE – Gettoniera multimoneta con POS integrato e elettrovalvole 12 Vcc", "gettoniere-per-docce/2-docce-gettoniera-multimoneta-con-pos-integrato-e-elettrovalvole-12-vcc", "SC611316"],
  ["DOC-014", "Docce", "2 DOCCE - Gettoniera + Lettore di carte/braccialetti ricaricabili + elettrovalvole - BOX in ABS", "gettoniere-per-docce/2-docce-gettoniera-lettore-di-carte-braccialetti-ricaricabili-elettrovalvole", "SC992814"],
  ["DOC-015", "Docce", "2 DOCCE - Gettoniera + Lettore di carte/braccialetti ricaricabili + PAUSE SMART + elettrovalvole - BOX in ABS", "gettoniere-per-docce/2-docce-gettoniera-lettore-di-carte-braccialetti-ricaricabili-pause-smart-elettrovalvole", "SC105943"],
  ["DOC-016", "Docce", "2 DOCCE - Gettoniera mono moneta + pausa + elettrovalvole 12Vcc", "gettoniere-per-docce/gettoniera-mono-moneta-per-2-docce-funzione-di-arresto-pausa-docce", "SC830752"],
  ["DOC-017", "Docce", "2 DOCCE - Gettoniera multimoneta + lettore di tessere RFID + elettrovalvole - BOX in Ferro", "gettoniere-per-docce/2-docce-gettoniera-multimoneta-lettore-di-tessere-rfid-elettrovalvole-box-in-ferro", "SC527454"],
  ["DOC-018", "Docce", "2 DOCCE - Lettore di carte/braccialetti ricaricabili + PAUSE SMART + elettrovalvole", "gettoniere-per-docce/2-docce-lettore-di-carte-braccialetti-ricaricabili-elettrovalvole-per-esterni", "SC515675"],
  ["DOC-019", "Docce", "Gettoniera elettronica per 2 docce con monete e RFID – Funzione Pausa SMART", "gettoniere-per-docce/2-docce-box-acciaio-gettoniera-tessere-pause-elettrovalvole", "SC767219"],
  ["DOC-020", "Docce", "Gettoniera elettronica per 2 docce con pagamento a monete e RFID ricaricabile", "gettoniere-per-docce/2-docce-box-acciaio-gettoniera-lettore-di-carte-braccialetti-ricaricabili-elettrovalvole", "SC765485"],
  ["DOC-021", "Docce", "2 DOCCE – Gettoniera multimoneta con elettrovalvole a 12 Vcc", "gettoniere-per-docce/gettoniera-multimoneta-per-2-docce", "BGM2DOC4000"],
  ["DOC-022", "Docce", "2 DOCCE – Gettoniera multimoneta con funzione PAUSA ed elettrovalvole 12 Vcc", "gettoniere-per-docce/copia-di-2-docce-gettoniera-multi-moneta-pausa-elettrovalvole-12vcc", "SC288175"],
  ["DOC-023", "Docce", "2 DOCCE – Gettoniera multimoneta con PAUSE SMART ed elettrovalvole 12 Vcc", "gettoniere-per-docce/gettoniera-multimoneta-per-2-docce-funzione-di-arresto-pausa-docce", "SC325135"],
  ["DOC-024", "Docce", "2 DOCCE – Lettore RFID per Docce Temporizzate con Tessere Ricaricabili", "gettoniere-per-docce/lettore-di-carte-braccialetti-per-2-docce-o-dispositivi", "SC761066"],
  ["DOC-025", "Docce", "3 DOCCE + POS – Gettoniera multimoneta con elettrovalvole 12 Vcc", "gettoniere-per-docce/3-docce-pos-gettoniera-multimoneta-con-elettrovalvole-12-vcc", "SC968948"],
  ["DOC-026", "Docce", "3 DOCCE – Gettoniera multimoneta + Lettore RFID con ricarica da gettoniera + PAUSA SMART + elettrovalvole 12Vcc", "gettoniere-per-docce/3-docce-gettoniera-lettore-carte-con-funzione-di-ricarica-da-gettoniera-pause-smart-elettrovalvole-12vcc", "SC359351"],
  ["DOC-027", "Docce", "3 DOCCE – Gettoniera multimoneta + Lettore RFID con ricarica da gettoniera + Programmatore di carte", "gettoniere-per-docce/gettoniera-lettore-carte-per-3-docce-completa-di-programmatore", "SC563630"],
  ["DOC-028", "Docce", "3 DOCCE – Gettoniera multimoneta + Lettore RFID con ricarica diretta da gettoniera + elettrovalvole 12 Vcc", "gettoniere-per-docce/gettoniera-lettore-carte-per-3-docce-ricarica-da-gettoniera", "SC680333"],
  ["DOC-029", "Docce", "3 DOCCE – Gettoniera multimoneta con elettrovalvole 12 Vcc", "gettoniere-per-docce/gettoniera-multimoneta-per-3-docce", "BGM3DOCC"],
  ["DOC-030", "Docce", "3 DOCCE – Gettoniera multimoneta con PAUSA SMART ed elettrovalvole 12 Vcc", "gettoniere-per-docce/gettoniera-multimoneta-per-3-docce-funzione-di-arresto-pausa-docce", "SC074300"],
  ["DOC-031", "Docce", "3 DOCCE – Lettore di Carte, Braccialetti e Portachiavi RFID ricaricabili", "gettoniere-per-docce/lettore-di-carte-braccialetti-per-3-docce-o-dispositivi", "RFID3DOCC"],
  ["DOC-032", "Docce", "3 DOCCE – Lettore RFID ricaricabile con PAUSA SMART e elettrovalvole 12 Vcc", "gettoniere-per-docce/3-docce-lettore-di-carte-braccialetti-ricaricabili-pause-smart-elettrovalvole", "SC546205"],
  ["DOC-033", "Docce", "4 DOCCE + POS – Gettoniera multimoneta con elettrovalvole 12 Vcc", "gettoniere-per-docce/4-docce-pos-gettoniera-multimoneta-con-elettrovalvole-12-vcc", "SC615918"],
  ["DOC-034", "Docce", "4 docce - Lettore di Carte/Braccialetti", "gettoniere-per-docce/lettore-di-carte-braccialetti-per-4-docce-o-dispositivi", "RFID4DOCC"],
  ["DOC-035", "Docce", "4 DOCCE – Gettoniera multimoneta + Lettore carte con ricarica da gettoniera + PAUSE SMART + elettrovalvole 12Vcc", "gettoniere-per-docce/gettoniera-lettore-carte-per-4-docce-ricarica-da-gettoniera-pause", "SC134766"],
  ["DOC-036", "Docce", "4 DOCCE – Gettoniera multimoneta + Lettore carte RFID con ricarica da gettoniera + elettrovalvole 12Vcc", "gettoniere-per-docce/gettoniera-lettore-carte-per-4-docce-con-ricarica-da-gettoniera", "SC421578"],
  ["DOC-037", "Docce", "4 DOCCE – Gettoniera multimoneta con elettrovalvole 12 Vcc", "gettoniere-per-docce/copia-di-gettoniera-multimoneta-per-4-docce", "BGM4DOCC"],
  ["DOC-038", "Docce", "4 DOCCE – Gettoniera multimoneta con PAUSA SMART + Elettrovalvole 12Vcc incluse", "gettoniere-per-docce/gettoniera-multimoneta-per-4-docce-funzione-di-arresto-pausa-docce", "SC817718"],
  ["DOC-039", "Docce", "4 DOCCE – Lettore di CARTE / Braccialetti RFID + Pause SMART + Elettrovalvole", "gettoniere-per-docce/4-docce-lettore-di-carte-braccialetti-rfid-pause-smart-elettrovalvole", "SC534252"],
  ["DOC-040", "Docce", "4 DOCCE - Lettore di CARTE/Braccialetti RFID + Elettrovalvole", "gettoniere-per-docce/4-docce-lettore-di-carte-braccialetti-rfid-elettrovalvole", "SC853922"],
  ["DOC-041", "Docce", "4 DOCCE – Lettore RFID per Carte/Braccialetti + Programmatore + Elettrovalvole", "gettoniere-per-docce/lettore-di-carte-braccialetti-per-4-docce-o-dispositivi-programmatore", "SC227118"],
  ["DOC-042", "Docce", "5 DOCCE – Gettoniera multimoneta con elettrovalvole 12 Vcc", "gettoniere-per-docce/gettoniera-per-5-docce-completa-di-elettrovalvole", "BGM5DOC4000"],
  ["DOC-043", "Docce", "5 DOCCE – Gettoniera multimoneta con Lettore RFID e funzione Pausa", "gettoniere-per-docce/5-docce-gettoniera-multimoneta-lettore-rfid-pause-smart", "SC756175"],
  ["DOC-044", "Docce", "5 DOCCE – Gettoniera multimoneta con Pausa ed elettrovalvole 12 Vcc", "gettoniere-per-docce/5-docce-gettoniera-multimoneta-pause-smart-elettrovalvole-12vcc", "SC432123"],
  ["DOC-045", "Docce", "5 DOCCE – Lettore di Carte / Braccialetti RFID con Elettrovalvole", "gettoniere-per-docce/5-docce-lettore-di-carte-braccialetti-rfid-elettrovalvole", "SC800566"],
  ["DOC-046", "Docce", "5 DOCCE – Lettore RFID ricaricabile con funzione Pausa + Elettrovalvole 12Vcc", "gettoniere-per-docce/5-docce-lettore-di-carte-braccialetti-ricaricabili-pause-smart-elettrovalvole", "SC706498"],
  ["DOC-047", "Docce", "6 DOCCE + POS – Gettoniera multimoneta con pagamento elettronico e 6 elettrovalvole 12Vcc", "gettoniere-per-docce/gettoniera-6-docce-pos-monete-elettrovalvole", "SC634063"],
  ["DOC-048", "Docce", "Lettore di Carte/Braccialetti per 6 docce e 4 phon", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-per-6-docce-e-4-phon", "RFID10USC"],
  ["DOC-049", "Docce", "6 DOCCE – Gettoniera multimoneta con elettrovalvole 12 Vcc", "gettoniere-per-docce/gettoniera-per-6-docce-completa-di-elettrovalvole", "BGMX6DOC"],
  ["DOC-050", "Docce", "6 DOCCE – Gettoniera multimoneta con Lettore RFID e ricarica tessere integrata", "gettoniere-per-docce/6-docce-gettoniera-multimoneta-lettore-rfid-tessere-ricaricabili-dalla-gettoniera", "SC298321"],
  ["DOC-051", "Docce", "6 DOCCE – Gettoniera multimoneta con Pausa ed elettrovalvole 12 Vcc", "gettoniere-per-docce/6-docce-gettoniera-multimoneta-pause-smart-elettrovalvole-12vcc", "SC857975"],
  ["DOC-052", "Docce", "6 DOCCE – Lettore RFID Carte e Braccialetti + Funzione Pausa + 6 Elettrovalvole 12Vcc", "gettoniere-per-docce/copia-di-6-docce-lettore-di-carte-braccialetti-rfid-pause-smart-elettrovalvole", "SC421645"],
  ["DOC-053", "Docce", "6 DOCCE – Lettore RFID per Carte e Braccialetti Ricaricabili + 6 Elettrovalvole 12Vcc", "gettoniere-per-docce/lettore-di-carte-braccialetti-rfid-per-6-dispositivi-con-uscite-a-12vcc-elettrovalvole", "SC948576"],
  ["DOC-054", "Docce", "8 DOCCE – Gettoniera elettronica professionale con doppio lettore monete", "gettoniere-per-docce/gettoniera-per-8-docce-completa-di-elettrovalvole", "BOXGM8DOC"],
  ["DOC-055", "Docce", "8 DOCCE – Gettoniera multimoneta con funzione PAUSA ed elettrovalvole 12 Vcc", "gettoniere-per-docce/copia-di-gettoniera-per-8-docce-pausa-completa-di-elettrovalvole", "SC214867"],
  ["DOC-056", "Docce", "8 DOCCE – Gettoniera multimoneta con Lettore RFID e elettrovalvole 12 Vcc", "gettoniere-per-docce/gettoniera-lettore-di-carte-braccialetti-per-8-docce", "SC412155"],
  ["DOC-057", "Docce", "8 DOCCE – Gettoniera multimoneta con Lettore RFID, funzione Pausa ed elettrovalvole 12 Vcc", "gettoniere-per-docce/8-docce-gettoniera-multimoneta-lettore-di-cartebraccialetti-pause-elettrovalvole-12vcc", "SC064517"],
  ["DOC-058", "Docce", "8 DOCCE – Lettore di Carte / Braccialetti RFID + Elettrovalvole 12Vcc", "gettoniere-per-docce/8-docce-lettore-di-carte-braccialetti-rfid-elettrovalvole", "SC924768"],
  ["DOC-059", "Docce", "8 DOCCE – Lettore di CARTE / Braccialetti RFID + Pause + Elettrovalvole", "gettoniere-per-docce/8-docce-lettore-di-carte-braccialetti-rfid-pause-smart-elettrovalvole", "SC268182"],
  ["DOC-060", "Docce", "10 DOCCE – Gettoniera multimoneta con 10 uscite 12Vcc + elettrovalvole incluse", "gettoniere-per-docce/10-docce-gettoniera-multimoneta-elettrovalvole-12vcc", "SC396937"],
  ["DOC-061", "Docce", "10 DOCCE – Gettoniera multimoneta con PAUSE + Elettrovalvole 12Vcc", "gettoniere-per-docce/10-docce-gettoniera-multimoneta-con-pause-elettrovalvole-12vcc", "SC621659"],
  ["DOC-062", "Docce", "10 DOCCE – Lettore di CARTE / Braccialetti RFID + Elettrovalvole 12Vcc", "gettoniere-per-docce/10-docce-lettore-di-carte-braccialetti-rfid-elettrovalvole", "SC235508"],
  ["DOC-063", "Docce", "12 DOCCE – Gettoniera multimoneta professionale + Elettrovalvole 12Vcc", "gettoniere-per-docce/gettoniera-per-12-docce-con-elettrovalvole-incluse", "SC828129"],
  ["DOC-064", "Docce", "Gettoniera per 1 doccia a moneta o gettone con funzione pausa, elettrovalvola 12V e alimentatore incluso", "gettoniere-per-docce/gettoniera-doccia-moneta-pausa-elettrovalvola-12v", "SC693760"],
  ["DOC-065", "Docce", "Lettore RFID a Basso Consumo per Tessere e Braccialetti con Elettrovalvola ad Impulsi 4,5 Vcc", "gettoniere-per-docce/lettore-di-tesserebraccialetti-per-comando-elettrovalvola-ad-impulsi", "SC072486"],
  ["DOC-066", "Docce", "Lettore RFID opzionale per gettoniere docce – Carte, Braccialetti e Portachiavi ricaricabili", "gettoniere-per-docce/lettore-di-carte-braccialetti-opzionale-per-gettoniere-per-docce", "SC039300"],
  ["LAV-001", "Lavatrici", "Lavatrice + Asciugatrice con Tessere ricaricabili autonomamente - SW per gestione in remoto delle macchine e dei clienti", "lavanderie-lavatrici-asciugatrici/lavatrice-asciugatrice-con-tessere-ricaricabili-autonomamente-sw-per-gestione-in-remoto-delle-macchine-e-dei-clienti", "SC344426"],
  ["LAV-002", "Lavatrici", "Gettoniera per Lavatrice Domestica con Staffe di Fissaggio a Parete (Max 1900W) – Ideale per B&B e Strutture Ricettive", "lavanderie-lavatrici-asciugatrici/gettoniera-per-lavatrice-domestica-con-staffe-di-fissaggio-a-parete-controllo-a-tempo-per-bb-e-strutture-ricettive", "SC296140"],
  ["LAV-003", "Lavatrici", "Gettoniera Elettronica per Lavatrice Domestica (Max 1900W) – Ideale per B&B e Strutture Ricettive", "lavanderie-lavatrici-asciugatrici/gettoniera-per-lavatrice-domestica", "BGMLAV4000"],
  ["LAV-004", "Lavatrici", "Gettoniera elettronica per una Lavatrice o Asciugatrice Trifase / sino a 6000W", "lavanderie-lavatrici-asciugatrici/gettoniera-elettronica-per-una-lavatrice-o-asciugatrice-trifase-sino-a-6000w", "SC155091"],
  ["LAV-005", "Lavatrici", "Gettoniera per Lavatrice / Asciugatrice con SELETTORE", "offerte-last-minute/gettoniera-per-lavatrice-asciugatrice-con-selettore", "SC962524"],
  ["LAV-006", "Lavatrici", "Gettoniera per Lavatrice o Asciugatrice con SELETTORE (o lavora una o l'altra)", "lavanderie-lavatrici-asciugatrici/gettoniera-per-asciugatrice-lavasciuga-con-selettore", "BOXGETSELETT"],
  ["LAV-007", "Lavatrici", "Gettoniera Elettronica per Lavatrice o Asciugatrice – Controllo a Tempo per macchine fino a 3500W", "lavanderie-lavatrici-asciugatrici/gettoniera-elettronica-per-lavatrice-asciugatrice-lavasciuga-domestica", "SC707065"],
  ["LAV-008", "Lavatrici", "Gettoniera multimoneta + Lettore RFID per Lavatrice o Asciugatrice (Ricarica Tessere Integrata)", "lavanderie-lavatrici-asciugatrici/gettoniera-multimoneta-lettore-rfid-autoricarica-per-lavatrice-o-asciugatrice", "SC203861"],
  ["LAV-009", "Lavatrici", "Lettore di Carte con selettore per Lavatrice e Asciugatrice (o una o l'altra)", "lavanderie-lavatrici-asciugatrici/lettore-di-carte-con-selettore-per-lavatrice-o-asciugatrice", ""],
  ["LAV-010", "Lavatrici", "Lettore di Tessere RFID per Lavatrice o Asciugatrice – Controllo a Tempo (230Vac – 3500W)", "lavanderie-lavatrici-asciugatrici/lettore-di-carte-braccialetti-per-una-lavatrice-o-asciugatrice-230vac-3500w", "SC603875"],
  ["LAV-011", "Lavatrici", "Dispositivo Cashless con POS Contactless per Avvio Lavatrici Professionali", "lavanderie-lavatrici-asciugatrici/dispositivo-cashless-pos-contactless-avvio-lavatrici-professionali", "SC614740"],
  ["LAV-012", "Lavatrici", "Dispositivo per pagamento CASHLESS per Lavatrice o Asciugatrice Professionale", "lavanderie-lavatrici-asciugatrici/dispositivo-per-pagamento-cashless-per-lavatrice-o-asciugatrice-professionale", "SC362139"],
  ["LAV-013", "Lavatrici", "QRPay – Sistema Cashless a QR Code per Lavatrice e Asciugatrice", "lavanderie-lavatrici-asciugatrici/sistema-di-pagamento-con-carta-di-credito-per-lavatrice-o-asciugatrice-domestica-novita", "SC878080"],
  ["LAV-014", "Lavatrici", "Gettoniera per Lavatrice e Asciugatrice Industriale con avvio con contatto NA", "lavanderie-lavatrici-asciugatrici/gettoniera-per-lavatrice-e-asciugatrice-industriali-con-avvio-con-contatto-na", "SC569829"],
  ["LAV-015", "Lavatrici", "Gettoniera Trifase 6000W per Mangani, Essiccatoi e Motori Industriali", "lavanderie-lavatrici-asciugatrici/gettoniera-elettronica-per-lavatrice-o-asciugatrice-trifase-controllo-a-tempo-per-macchine-fino-a-6000w", "SC651142"],
  ["LAV-016", "Lavatrici", "Gettoniera a Monete + RFID per 2 Lavatrici Professionali con Avvio START", "lavanderie-lavatrici-asciugatrici/2-macchine-gettoniera-multimoneta-lettore-di-tessere-ricaricabili-dalla-gettoniera-avvio-lavatrici-professionali", "SC045102"],
  ["LAV-017", "Lavatrici", "Lettore RFID Temporizzato per 2 Lavatrici/Asciugatrici – Sistema a Crediti per B&B e Lavanderie", "lavanderie-lavatrici-asciugatrici/2-lavatrici-asciugatrici-lettore-di-tessere-braccialetti-ricaricabili-per-2-dispositivi", "SC745318"],
  ["LAV-018", "Lavatrici", "Gettoniera a gettoni per Lavatrice e Asciugatrice - max 3500W cada (mod. TANDEM)", "lavanderie-lavatrici-asciugatrici/gettoniera-a-gettoni-per-lavatrice-e-asciugatrice-max-3500w-cada-mod-tandem", "SC433524"],
  ["LAV-019", "Lavatrici", "Gettoniera Cashless con POS Contactless per 2 Macchine – Lavatrice + Asciugatrice", "lavanderie-lavatrici-asciugatrici/it-lavanderielavatrici-asciugatrici-gettoniera-cashless-pos-2-macchine-lavatrice-asciugatrice-pagamento-contactless-a-tempo", "SC599711"],
  ["LAV-020", "Lavatrici", "Gettoniera multimoneta + Lettore RFID per Lavatrice e Asciugatrice (con ricarica carte dalla gettoniera)", "lavanderie-lavatrici-asciugatrici/gettoniera-multimoneta-lettore-rfid-ricarica-automatica-per-lavatrice-e-asciugatrice", "SC486115"],
  ["LAV-021", "Lavatrici", "Gettoniera per Lavatrice e Asciugatrice - max 3500W cada (mod. TANDEM) - Legge tutte le monete", "lavanderie-lavatrici-asciugatrici/gettoniera-multi-moneta-per-lavatrice-e-asciugatrice-max-3500w-cada", "SC994140"],
  ["LAV-022", "Lavatrici", "Gettoniera per 3 Lavatrici o Asciugatrici Domestiche – Sistema a Tempo", "lavanderie-lavatrici-asciugatrici/gettoniera-per-3-lavatrici-domestiche-o-2-lavatrici-e-1-asciugatrice", "SC470360"],
  ["LAV-023", "Lavatrici", "Gettoniera multi moneta per 4 LAVATRICI domestiche (o 2 lavatrici e 2 asciugatrici) Nuova!", "lavanderie-lavatrici-asciugatrici/gettoniera-per-4-lavatrici-domestiche-o-2-lavatrici-e-2-asciugatrici-nuova", "SC198988"],
  ["LAV-024", "Lavatrici", "Gettoniera Cashless con POS per 4 Lavatrici o Asciugatrici – Pagamento Contactless", "lavanderie-lavatrici-asciugatrici/gettoniera-cashless-pos-4-lavatrici-asciugatrici-pagamento-contactless", "SC424408"],
  ["LAV-025", "Lavatrici", "Controllo Intelligente per 4 Lavatrici o Asciugatrici – Gettoniera + Carte RFID Ricaricabili", "lavanderie-lavatrici-asciugatrici/gettoniera-lettore-di-carte-per-4-lavatrici", "BGRFID4LAV"],
  ["LAV-026", "Lavatrici", "Lettore di Carte/Braccialetti per 4 lavatrici (o 2 Lavatrici e 2 asciugatrici)", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-per-4-lavatrici-o-2-lavatrici-e-2-asciugatrici", "SC981498"],
  ["LAV-027", "Lavatrici", "Lettore di Carte/Braccialetti per 4 lavatrici (o 2 Lavatrici e 2 asciugatrici) + Programmatore", "lavanderie-lavatrici-asciugatrici/lettore-di-carte-braccialetti-per-4-lavatrici-o-2-lavatrici-e-2-asciugatrici-programmatore", "SC526677"],
  ["LAV-028", "Lavatrici", "Gettoniera + Lettore RFID per il Comando di 4 Macchine – Contatto NA - Professionale", "lavanderie-lavatrici-asciugatrici/gettoniera-lettore-di-tessere-per-avvio-macchine-con-contatto-na-tessere-ricaricabili-dalla-stessa-gettoniera", "SC131404"],
  ["LAV-029", "Lavatrici", "Sistema Professionale RFID per 5 Lavatrici o Asciugatrici – Attivazione a Tessera con 50 Card Incluse", "lavanderie-lavatrici-asciugatrici/5-lavatrici-lettore-di-carte-braccialetti-rfid", "SC371655"],
  ["LAV-030", "Lavatrici", "Gettoniera per 6 Lavatrici domestiche (o 3 lavatrici e 3 asciugatrici)", "lavanderie-lavatrici-asciugatrici/gettoniera-per-6-lavatrici-o-3-lavatrici-e-3-asciugatrici", "SC465187"],
  ["LAV-031", "Lavatrici", "Sistema Professionale per 6 Lavatrici o Asciugatrici domestiche – Gettoniera Multimoneta + Pagamenti Digitali QR", "lavanderie-lavatrici-asciugatrici/6-lavatrici-domestiche-gettoniera-cashless-o-3-lavatrici-e-3-asciugatrici", "SC922324"],
  ["LAV-032", "Lavatrici", "Gettoniera per 6 Lavatrici industriali (o 3 lavatrici e 3 asciugatrici)", "lavanderie-lavatrici-asciugatrici/gettoniera-per-6-lavatrici-industriali-o-3-lavatrici-e-3-asciugatrici", "SC669892"],
  ["LAV-033", "Lavatrici", "Sistema Professionale per 6 Lavatrici Industriali – Gettoniera Multimoneta + Pagamenti Digitali QR", "lavanderie-lavatrici-asciugatrici/gettoniera-carte-di-credito-per-6-lavatrici-domestiche-o-3-lavatrici-e-3-asciugatrici", "SC485790"],
  ["LAV-034", "Lavatrici", "Gettoniera per 8 Lavatrici (o 4 Lavatrici e 4 Asciugatrici)", "lavanderie-lavatrici-asciugatrici/gettoniera-per-8-lavatrici", "BGM8LAV"],
  ["LAV-035", "Lavatrici", "Gettoniera + Lettore di carte per 8 Lavatrici (o 4 Lavatrici e 4 Asciugatrici) - carte ricaricabili dalla stessa gettoniera", "lavanderie-lavatrici-asciugatrici/gettoniera-lettore-di-carte-per-8-lavatrici-o-4-lav-e-4-asc", "SC844878"],
  ["LAV-036", "Lavatrici", "10 Lavatrici Industriali con avvio NA - Gettoniera multimoneta", "lavanderie-lavatrici-asciugatrici/10-lavatrici-industriali-con-avvio-na-gettoniera-multimoneta", "SC125261"],
  ["POR-001", "Porte", "Dispositivo Contactless con POS per Tornelli ed Elettroserrature – Controllo Accessi a Pagamento", "accessi-automatici/dispo", "SC609040"],
  ["POR-002", "Porte", "Gettoniera Apriporta + Lettore di carte o ciondoli + 50 ciondoli RFID", "accessi-automatici/gettoniera-apriporta-lettore-di-carte-o-ciondoli-50-ciondoli-rfid", "SC873827"],
  ["POR-003", "Porte", "Gettoniera Apriporta + lettore di carte o ciondoli + Kit elettroserratura", "accessi-automatici/gettoniera-lettore-di-carte-apriporta-kit-elettroserratura", "SC753320"],
  ["POR-004", "Porte", "Gettoniera Apriporta a monete + gettoni con KIT serratura e sensore presenza", "accessi-automatici/gettoniera-multimomoneta-apriporta-con-kit-serratura-e-sensore-presenza", "SC442065"],
  ["POR-005", "Porte", "Gettoniera Apriporta a monete + gettoni con KIT serratura - sensore presenza - molla chiudi porta", "accessi-automatici/gettoniera-apriporta-a-monete-gettoni-con-kit-serratura-sensore-presenza-molla-chiudi-porta", "SC092645"],
  ["POR-006", "Porte", "Gettoniera monomoneta Apriporta (per esterno)", "accessi-automatici/gettoniera-monomoneta-apriporta-per-esterno", "SC985880-01"],
  ["POR-007", "Porte", "Gettoniera monomoneta Apriporta con uscita a 12Vcc", "accessi-automatici/gettoniera-monomoneta-apriporta-con-uscita-a-12vcc", "SC136459"],
  ["POR-008", "Porte", "Gettoniera multimoneta + Lettore RFID per ascensori / apriporte / apri sbarre o cancelli / uscita NA", "accessi-automatici/gettoniera-multimoneta-lettore-rfid-con-ricarica-per-ascensori-apriporte-apri-sbarre-o-cancelli", "SC146889"],
  ["POR-009", "Porte", "APRIPORTA - Gettoniera multimoneta Ingresso 230Vac / Uscita NA - CON COVER E DISPLAY ESTERNO", "gettoniere-apriporta/apriporta-gettoniera-multimoneta-ingresso-230vac-uscita-na-con-cover-e-display-esterno", "SC700619"],
  ["POR-010", "Porte", "Gettoniera multimoneta Apriporta (per esterno)", "accessi-automatici/gettoniera-multimonetao-apriporta-per-esterno", "SC475532"],
  ["POR-011", "Porte", "Gettoniera multimoneta Apriporta con display per serrature a 12Vcc", "accessi-automatici/gettoniera-multimoneta-apriporta-con-display-per-serrature-a-12vcc", "SC829187"],
  ["POR-012", "Porte", "Gettoniera multimoneta Apriporta con display per serrature - contatto NA (ingresso a 12Vcc)", "accessi-automatici/gettoniera-multimoneta-apriporta-con-display-per-serrature-contatto-na", "SC342020"],
  ["POR-013", "Porte", "Gettoniera multimoneta Apriporta con display per serrature - contatto NA (ingresso 230Vac)", "accessi-automatici/gettoniera-multimoneta-apriporta-con-display-per-serrature-contatto-na-ingresso-230vac", "SC052151"],
  ["POR-014", "Porte", "Gettoniera multimoneta Apriporta con Elettroserratura (per esterni)", "accessi-automatici/gettoniera-multi-moneta-apriporta-con-elettroserratura-per-esterni", "SC706082-01"],
  ["POR-015", "Porte", "Lettore di Carte RFID con uscita NA - Per apertura porte / tornelli / sbarre (contatto Normale aperto)", "accessi-automatici/lettore-di-carte-rfid-con-uscita-na-per-apertura-porte-tornelli-sbarre-contatto-normale-aperto", "SC382679"],
  ["POR-016", "Porte", "Lettore di Carte/Braccialetti apriporta COMPATTO con uscita 12Vcc", "accessi-automatici/lettore-di-carte-braccialetti-apriporta-compatto-con-uscita-12vcc", "SC368859"],
  ["POR-017", "Porte", "Lettore di Carte/Braccialetti apriporta COMPATTO SENZA DISPLAY con uscita 12Vcc", "accessi-automatici/lettore-di-carte-braccialetti-apriporta-compatto-senza-display-con-uscita-12vcc", "SC847843"],
  ["POR-018", "Porte", "Lettore di carte/portachiavi RFID per Apriporta", "accessi-automatici/lettore-di-carte-portachiavi-rfid-per-apriporta", "SC863630"],
  ["POR-019", "Porte", "Lettore di Carte/Braccialetti apriporta o sbarra con contatto NA", "accessi-automatici/lettore-di-carte-braccialetti-apriporta-o-sbarra-con-contatto-na", "SC543756"],
  ["POR-020", "Porte", "Lettore di Tessere/Braccialetti apriporta (NON scala credito dalla tessera)", "accessi-automatici/lettore-di-tessere-apriporta-non-scala-credito-dalla-tessera", "SC422400"],
  ["POR-021", "Porte", "Lettore di Tessere/Braccialetti apriporta (scala credito dalla tessera)", "accessi-automatici/lettore-di-tesserebraccialetti-apriporta", "SC044257"],
  ["POR-022", "Porte", "Lettore di Tessere/Ciondoli apriporta o docce (NON scala credito dalla tessera) + 100 ciondoli", "accessi-automatici/lettore-di-tesserebraccialetti-apriporta-non-scala-credito-dalla-tessera", "SC725397"],
  ["POR-023", "Porte", "Lettore di Tessere/Ciondoli apriporta o per docce (NON scala credito dalla tessera) + 100 tessere", "accessi-automatici/lettore-di-tesserebraccialetti-apriporta-non-scala-credito-dalla-tessera-100-tessere", "SC045079"],
  ["POR-024", "Porte", "Paga e Apri - L'Apriporta a pagamento con codice QR", "accessi-automatici/paga-e-apri-l-apriporta-a-pagamento-con-codice-qr", "SC908006"],
  ["POR-025", "Porte", "Sistema Sblocco Porta con QR e PIN su Scontrino", "accessi-automatici/sistema-sblocco-porta-con-qr-e-pin-su-scontrino", "SC595994"],
  ["POR-026", "Porte", "Apri sbarra (per esterni) - Gettoniera multimoneta - SENZA DISPLAY ESTERNO", "accessi-automatici/apri-sbarra-per-esterni-gettoniera-multimoneta-senza-display-esterno", "SC250365"],
  ["POR-027", "Porte", "Gettoniera multimoneta per 2 porte (elettroserrature)", "accessi-automatici/gettoniera-multimoneta-per-2-porte-elettroserrature", "SC727538"],
  ["POR-028", "Porte", "Gettoniera + POS per Apertura di 2 Porte – Multimoneta, 12V, Sistema Professionale", "accessi-automatici/gettoniera-pos-per-apertura-di-2-porte-multimoneta-12v-sistema-professionale", "SC777484"],
  ["POR-029", "Porte", "2 PORTE - Lettore di Tessere/Braccialetti ricaricabili (per 2 apriporta)", "accessi-automatici/2-porte-lettore-di-tesserebraccialetti-ricaricabili-per-2-apriporta", "SC702053"],
  ["POR-030", "Porte", "Gettoniera a monete + cashless per 3 porte (elettroserrature)", "accessi-automatici/gettoniera-a-monete-cashless-per-3-porte-elettroserrature", "SC418744"],
  ["POR-031", "Porte", "Gettoniera Multimoneta per 3 Porte con Elettroserrature 12Vcc – Sistema Apriporta Temporizzato", "accessi-automatici/copia-di-gettoniera-multimoneta-per-3-porte", "SC475298"],
  ["POR-032", "Porte", "Gettoniera + POS per Apertura di 3 Porte – Multimoneta 12 V, Sistema Professionale", "accessi-automatici/gettoniera-pos-3-porte-elettroserrature-multimoneta", "SC667434"],
  ["POR-033", "Porte", "Gettoniera Multimoneta per 4 Porte con Elettroserrature 12Vcc – Sistema Apriporta Temporizzato", "accessi-automatici/gettoniera-multimoneta-per-4-porte-elettroserrature", "SC608084"],
  ["POR-034", "Porte", "Gettoniera + POS per Apertura di 4 Porte – Multimoneta, 12V, Sistema Professionale", "accessi-automatici/gettoniera-pos-per-apertura-di-4-porte-multimoneta-12v-sistema-professionale", "SC649750"],
  ["POR-035", "Porte", "KEY39 Multi – Sistema Intelligente per l'Apertura di 4 Porte con Codice QR e Gestione Cloud", "accessi-automatici/key39-multi-sistema-intelligente-per-lapertura-di-4-porte-con-codice-qr-e-gestione-cloud", "SC763587"],
  ["POR-036", "Porte", "Gettoniera multimoneta per 6 porte (elettroserrature)", "accessi-automatici/gettoniera-multimoneta-per-6-porte-elettroserrature", "SC938510"],
  ["POR-037", "Porte", "KEY39 Plus - Apriporta con QR + SW Gestionale - per Palestre e Centri Fitness", "accessi-automatici/apriporta-sw-gestionale-per-key39-per-palestre-e-centri-fitness", "SC581796"],
  ["POR-038", "Porte", "Check in a DISTANZA con codice QR (senza apparecchi o scatole all'esterno) - KEY39 WIFI o LAN", "accessi-automatici/key39-lapriporta-con-codice-qr", "SC810405"],
  ["POR-039", "Porte", "Kit con elettroserratura, sensore di presenza e spia bagno occupato", "accessi-automatici/kit-con-elettroserratura-sensore-di-presenza-e-spia-bagno-occupato", "SC770688"],
  ["POR-040", "Porte", "Kit completo di: elettroserratura, sensore di presenza, spia bagno occupato, molla di richiamo porta", "accessi-automatici/kit-completo-di-elettroserratura-sensore-di-presenza-spia-bagno-occupato-molla-di-richiamo-porta", "SC047767"],
  ["POR-041", "Porte", "Lettore di Carte/Braccialetti con uscita 12Vcc (per valvole, elettroserrature..)", "accessi-automatici/lettore-di-carte-braccialetti-12vcc", "SC080537-01"],
  ["POR-042", "Porte", "Lettore di Carte/Braccialetti con uscita 12Vcc (per valvole, elettroserrature..) - NUOVO - Mod. TOP", "accessi-automatici/lettore-di-carte-braccialetti-con-uscita-12vcc-per-valvole-elettroserrature-nuovo-mod-top", "SC253741"],
  ["LUC-001", "Luci", "Gettoniera elettronica temporizzata per impianto luci a LED – 230V 3500W", "gettoniere-per-luci/gettoniera-elettronica-temporizzata-per-impianto-luci-a-led-230v-3500w", "SC709437"],
  ["LUC-002", "Luci", "Dispositivo Cashless con POS Contactless per Impianti Luci fino a 3500W", "gettoniere-per-luci/cashless-nayax-pos-lighting-3500w", "SC685134"],
  ["LUC-003", "Luci", "Gettoniera per impianto Luci - Max 1900W", "gettoniere-per-luci/gettoniera-per-luci-max-1900w", "BGMLUCI4000"],
  ["LUC-004", "Luci", "Gettoniera per comando impianto luci con funzione di preavviso – 230V 3500W", "gettoniere-per-luci/gettoniera-multimoneta-per-1-impianto-luci-con-funzione-di-preavviso-max-3500w-per-esterni", "SC098171"],
  ["LUC-005", "Luci", "Gettoniera multimoneta + Lettore RFID per impianto LUCI (max 3500W)", "gettoniere-per-luci/gettoniera-multimoneta-lettore-rfid-autoricarica-per-accensione-impianti-luci", "SC240267"],
  ["LUC-006", "Luci", "Gettoniera per 2 Impianti Luce - Uscite NA - max 3500W cada", "gettoniere-per-luci/gettoniera-per-2-impianti-luce-max-3500w-cada", "SC485697"],
  ["LUC-007", "Luci", "Gettoniera mono moneta per 2 Impianti Luce - max 1500W cada", "gettoniere-per-luci/gettoniera-mono-moneta-per-2-impianti-luce-max-1500w-cada", "SC838742"],
  ["LUC-008", "Luci", "Gettoniera multi moneta per 2 Impianti Luce - max 1500W cada", "gettoniere-per-luci/gettoniera-multi-moneta-per-2-impianti-luce-max-1500w-cada", "SC605294"],
  ["LUC-009", "Luci", "Gettoniera multimoneta per 2 Impianti Luce con funzione preavviso (max 3500W / cada)", "gettoniere-per-luci/gettoniera-multimoneta-per-2-impianti-luce-con-lampeggio-x-preavviso", "SC132128"],
  ["LUC-010", "Luci", "3 Impianti LUCE - Gettoniera + Lettore tessere con uscite NA - con funzione di Preavviso fine tempo", "gettoniere-per-luci/3-impianti-luce-gettoniera-lettore-tessere-con-uscite-na", "SC093082"],
  ["LUC-011", "Luci", "Gettoniera multimoneta per 3 impianti luce + funzione lampeggio preavviso", "gettoniere-per-luci/gettoniera-multimoneta-per-3-impianti-luce-funzione-lampeggio-preavviso", "SC900070"],
  ["LUC-012", "Luci", "Gettoniera per il comando di 3 Gruppi Lampade indipendenti sino a 3500W / cada", "gettoniere-per-luci/gettoniera-per-il-comando-di-3-gruppi-lampade-indipendenti-sino-a-3500w-cada", "SC802165"],
  ["LUC-013", "Luci", "Gettoniera Cashless con POS Contactless per 4 Impianti Luce", "gettoniere-per-luci/gettoniera-cashless-con-pos-per-comando-4-impianti-luce-pagamento-contactless-a-tempo", "SC334520"],
  ["LUC-014", "Luci", "Gettoniera multi moneta per 4 Impianti di illuminazione", "gettoniere-per-luci/gettoniera-multi-moneta-per-4-impianti-di-illuminazione", "SC676989"],
  ["LUC-015", "Luci", "Gettoniera multimoneta per 4 impianti luce + funzione lampeggio preavviso", "gettoniere-per-luci/gettoniera-multimoneta-per-4-impianti-luce-funzione-lampeggio-preavviso", "SC388139"],
  ["LUC-016", "Luci", "Gettoniera per Chiese - per 4 impianti luce (per centraline domestiche) a doppio impulso", "gettoniere-per-luci/gettoniera-per-chiese-per-4-impianti-luce-per-centraline-domestiche-a-doppio-impulso", "SC207242"],
  ["LUC-017", "Luci", "6 impianti di illuminazione - Gettoniera elettronica multimoneta con pagamento cashless e con funzione di preavviso a lampeggi prima dello spegnimento", "gettoniere-per-luci/6-impianti-di-illuminazione-gettoniera-elettronica-multimoneta-con-pagamento-cashless-e-con-funzione-di-preavviso-a-lampeggi-prima-dello-spegnimento", "SC056396"],
  ["UNI-001", "Universali", "Gettoniera Multimoneta a 12Vcc con uscita con contatto NA (normale aperto)", "gettoniere-a-monete/gettoniera-universale-con-uscita-con-contatto-na-normale-aperto-ingresso-12vcc", "SC494386"],
  ["UNI-002", "Universali", "Gettoniera Multimoneta a 12Vcc con uscita con contatto NA (normale aperto) + contatore LCD", "gettoniere-a-monete/gettoniera-multimoneta-con-uscita-con-contatto-na-normale-aperto-contatore-lcd-ingresso-12vcc", "SC145215"],
  ["UNI-003", "Universali", "Gettoniera (multimoneta) per dispositivi a 12Vcc / max 2A + Pausa (per esterni)", "gettoniere-a-monete/gettoniera-multimoneta-per-dispositivi-a-12vcc-max-2a-pausa-per-esterni", "SC664792"],
  ["UNI-004", "Universali", "Gettoniera multimoneta Universale a 12Vcc per dispositivi con uscita a 12Vcc", "gettoniere-a-monete/gettoniera-multimoneta-universale-per-dispositivi-a-12vcc", "SC099871"],
  ["UNI-005", "Universali", "Gettoniera Universale per dispositivi a 12Vcc", "gettoniere-a-monete/gettoniera-universale-per-dispositivi-a-12vcc", "BGM400012"],
  ["UNI-006", "Universali", "Lettore di Carte ricaricabili + PAUSA con uscita a 12Vcc + Programmatore", "gettoniere-a-monete/lettore-di-carte-ricaricabili-pausa-con-uscita-a-12vcc-programmatore", "SC559542"],
  ["UNI-007", "Universali", "Gettoniera mono moneta per dispositivi a 230V / max 3500W con spina industriale", "gettoniere-a-monete/gettoniera-mono-moneta-per-dispositivi-a-230v-max-3500w-con-spina-industriale", "SC222294"],
  ["UNI-008", "Universali", "Gettoniera multi moneta per dispositivi a 230V / max 3500W", "gettoniere-a-monete/gettoniera-multi-moneta-per-dispositivi-a-230v-max-3500w", "SC958279"],
  ["UNI-009", "Universali", "Gettoniera multi moneta con funzione BYPASS per dispositivi a 230V / max 3500W (per interni)", "gettoniere-a-monete/gettoniera-multi-moneta-con-funzione-bypass-per-dispositivi-a-230v-max-3500w-per-interni", "SC362302"],
  ["UNI-010", "Universali", "Gettoniera Universale per dispositivi a 230V / max 1500W (per interni)", "gettoniere-a-monete/gettoniera-universale-per-dispositivi-a-230v-max-1500w-per-interni", "SC836799"],
  ["UNI-011", "Universali", "Gettoniera Universale per dispositivi a 230V / max 1900W", "gettoniere-a-monete/gettoniera-universale-per-dispositivi-a-230v-max-1900w", "BGM4000220"],
  ["UNI-012", "Universali", "Gettoniera Universale (multimoneta) per dispositivi a 230V / max 3500W (per esterni)", "gettoniere-a-monete/gettoniera-universale-per-dispositivi-a-230v-max-3500w-per-esterni", "SC175761"],
  ["UNI-013", "Universali", "Gettoniera elettronica per un dispositivo 380V Trifase / sino a 6000W", "gettoniere-a-monete/gettoniera-elettronica-per-un-dispositivo-380v-trifase-sino-a-6000w", "SC483998"],
  ["UNI-014", "Universali", "Gettoniera (BOX in ABS) - multimoneta - Uscita NA", "gettoniere-a-monete/gettoniera-box-in-abs-multimoneta-uscita-na", "SC434229"],
  ["UNI-015", "Universali", "Gettoniera multi moneta con doppio contatto NA (max 20A di carico)", "gettoniere-a-monete/gettoniera-multi-moneta-per-con-doppio-contatto-na-max-20a-di-carico", "SC001756"],
  ["UNI-016", "Universali", "Gettoniera Universale per avvio macchine o dispositivi con contatto NA (ingresso a 230V)", "gettoniere-a-monete/gettoniera-universale-per-avvio-macchine-o-dispositivi-con-contatto-na-ingresso-a-230v", "SC541488"],
  ["UNI-017", "Universali", "Gettoniera Multimoneta per Phon – Timer Elettronico per Asciugacapelli Self Service", "gettoniere-a-monete/gettoniera-multimoneta-per-phon", "BGM1PHON"],
  ["UNI-018", "Universali", "Gettoniera multimoneta con 2 contatti NA", "gettoniere-a-monete/gettoniera-multimoneta-2-contatti-na", "SC237272"],
  ["UNI-019", "Universali", "Gettoniera mono moneta per 2 dispositivi a 230V - max 3500W cada", "gettoniere-a-monete/gettoniera-multi-moneta-per-2-dispositivi-a-230v-max-3500w-cada-funzione-di-arresto", "SC222816"],
  ["UNI-020", "Universali", "Gettoniera multimoneta per 2 dispositivi a 230V", "gettoniere-a-monete/gettoniera-multimoneta-per-2-dispositivi-a-230v", "SC184814"],
  ["UNI-021", "Universali", "Gettoniera multi moneta per 2 dispositivi a 230V - max 3500W cada + funzione di arresto", "gettoniere-a-monete/gettoniera-multi-moneta-per-2-dispositivi-a-220v-max-3500w-cada-funzione-di-arresto", "SC662694"],
  ["UNI-022", "Universali", "Gettoniera + Lettore RFID per 2 Macchine – Multimoneta, 2 Uscite NA Temporizzate", "gettoniere-a-monete/gettoniera-multimoneta-lettore-rfid-per-2-dispositivi-con-ricarica-carte-dalla-gettoniera-uscite-na", "SC180283"],
  ["UNI-023", "Universali", "2 PHON - Gettoniera multimoneta + PRESE ESTERNE", "gettoniere-a-monete/2-phon-gettoniera-multimoneta-prese-esterne", "SC678588"],
  ["UNI-024", "Universali", "2 PHON - Lettore di Carte/Braccialetti per comando di 2 PHON + 2 PRESE da Parete", "gettoniere-a-monete/lettore-di-carte-braccialetti-per-2-phon", "SC732842"],
  ["UNI-025", "Universali", "3 DISPOSITIVI - Gettoniera + Lettore carte con funzione di ricarica da gettoniera - Uscite NA", "gettoniere-a-monete/3-dispositivi-gettoniera-lettore-carte-con-funzione-di-ricarica-da-gettoniera-uscite-na", "SC402950"],
  ["UNI-026", "Universali", "3 PHON - Gettoniera multimoneta + PRESE ESTERNE", "gettoniere-a-monete/3-phon-gettoniera-multimoneta-prese-esterne", "SC140020"],
  ["UNI-027", "Universali", "Gettoniera per 4 Dispositivi elettrici a 230Vac / max 3000W cada", "gettoniere-a-monete/gettoniera-per-4-dispositivi-elettrici", "SC636471"],
  ["UNI-028", "Universali", "Lettore di Carte/Braccialetti per 4 Dispositivi a 230Vac (max 3000W cada)", "lettori-di-carte-e-braccialetti/lettore-di-cartebraccialetti-per-4-dispositivi-a-230vac-max-3000w-cada", "SC957237"],
  ["UNI-029", "Universali", "Gettoniera per 4 Dispositivi elettrici Monofase sino a 3500W / cada", "gettoniere-a-monete/gettoniera-per-4-dispositivi-elettrici-monofase-sino-a-3500w-cada", "SC011564"],
  ["UNI-030", "Universali", "5 DISPOSITIVI - Gettoniera multimoneta con contatti NA (max 3500 W / cada)", "gettoniere-a-monete/5-dispositivi-gettoniera-multimoneta-con-contatti-na-max-3500-w-cada", "SC347642"],
  ["UNI-031", "Universali", "Lettore di CARTE/Braccialetti RFID con 5 uscite 12Vcc", "gettoniere-a-monete/lettore-di-carte-braccialetti-rfid-con-uscite-12vcc", "SC472069"],
  ["UNI-032", "Universali", "Gettoniera per 8 prese elettriche di ricarica", "gettoniere-a-monete/gettoniera-per-8-prese-elettriche-di-ricarica", "SC298712"],
  ["UNI-033", "Universali", "Dispositivo Contactless con POS per azionamento lampade asciugatura cavalli (max 3500W)", "gettoniere-a-monete/getti-per-cavalli", "SC960618"],
  ["UNI-034", "Universali", "Gettoniera multimoneta per Lavaggio e Asciugatura cavalli", "gettoniere-a-monete/gettoniera-multimoneta-per-lavaggio-e-asciugatura-cavalli", "BGMLAVASCCAV"],
  ["UNI-035", "Universali", "Gettoniera per Lampade asciugatura cavallo - Max 2000W", "gettoniere-a-monete/gettoniera-per-lampade-asciugatura-cavallo-max-2000w", "BGMASCCAV"],
  ["UNI-036", "Universali", "Gettoniera per Lampade IR a 230V con potenza sino a 3500W", "gettoniere-a-monete/gettoniera-per-lampade-ir-a-230v-con-potenza-sino-a-3500w", "SC785288"],
  ["UNI-037", "Universali", "Gettoniera per Lavaggio cavalli - Con elettrovalvola", "gettoniere-a-monete/gettoniera-per-lavaggio-cavalli-con-elettrovalvola", "BGMLAVCAV"],
  ["UNI-038", "Universali", "Gettoniera per Condizionatori - Max 1900W", "gettoniere-a-monete/gettoniera-per-condizionatori-max-2000w", "SC374448"],
  ["UNI-039", "Universali", "Gettoniera con prese di ricarica per Minicar elettriche (230V / max 3500W)", "gettoniere-a-monete/gettoniera-con-prese-di-ricarica-per-auto-elettriche-230v-max-3500w", "SC737309"],
  ["UNI-040", "Universali", "Ricarica Minicar con pagamento Cashless - pagamento con codice QR", "gettoniere-a-monete/ricarica-minicar-con-pagamento-cashless-pagamento-con-codice-qr", "SC099377"],
  ["UNI-041", "Universali", "Gettoniera per poltrona massaggi a 230V / max 2000W", "gettoniere-a-monete/gettoniera-per-poltrona-massaggi-a-220v-max-2000w", "SC277207"],
  ["UNI-042", "Universali", "Dispositivo Contactless per Sauna con POS Nayax – Controllo Automatico a Tempo fino a 3500W", "gettoniere-a-monete/dispositivo-contactless-per-sauna-con-pos-nayax-controllo-automatico-a-tempo-fino-a-3500w", "SC756873"],
  ["UNI-043", "Universali", "Gettoniera Universale per Sauna a 230V / max 3500W (per interni)", "gettoniere-a-monete/gettoniera-universale-per-sauna-a-220v-max-3500w-per-interni", "SC880598"],
  ["POS-001", "POS", "Dispositivo Contactless con POS – Controllo carichi elettrici fino a 3500W", "dispositivi-cashless/dispositivo-cashless-con-pos-nayax-controllo-carichi-elettrici-fino-a-3500w", "SC667090"],
  ["POS-002", "POS", "QR Pay - Aziona un dispositivo elettrico a pagamento con codice QR", "pagamenti-cashless/qr-pay-aziona-un-dispositivo-elettrico-a-pagamento-con-codice-qr", "SC409519"],
  ["POS-003", "POS", "Gettoniera Cashless con POS – 2 Uscite Sequenziali 12Vcc + 230Vac", "dispositivi-cashless/gettoniera-pos-2-uscite-sequenziali-12vcc-230vac", "SC132964"],
  ["POS-004", "POS", "Gettoniera + Cashless per 12 dispositivi a 230V - Max 3500W cadauno (Novità)", "gettoniere-a-monete/gettoniera-carte-di-credito-paypal-per-12-dispositivi-a-220v-max-3500w-cadauno-novita", "SC462339"],
  ["POS-005", "POS", "POS cashless per gonfia-gomme con comando elettrovalvola", "dispositivi-cashless/gonfia-gomme-a-pagamento-con-pos", "SC510866"],
  ["RFI-001", "RFID", "ACQUA - sistema di comando pompa con Carte RFID con credito a scalare", "lettori-di-carte-e-braccialetti/acqua-controllo-lettore-di-carte-rfid-con-credito-a-scalare", "SC118008"],
  ["RFI-002", "RFID", "Gettoniera + Lettore di Carte/Braccialetti con uscita NA (contatto Normale Aperto) - per avvio macchine lavanderia", "lettori-di-carte-e-braccialetti/gettoniera-lettore-di-carte-braccialetti-per-avvio-macchine-con-uscita-na-contatto-normale-aperto", "SC097467"],
  ["RFI-003", "RFID", "IMPIANTO ELETTRICO GENERALE - sistema di comando con tessere RFID con credito a scalare", "lettori-di-carte-e-braccialetti/acqua-luci-riscaldamanto-sistema-di-comando-con-tessere-rfid-con-credito-a-scalare", "SC854078"],
  ["RFI-004", "RFID", "Lettore di Carte/Braccialetti (230Vac - 1500W) + Programmatore", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-220vac-1500w-programmatore", "SC013436"],
  ["RFI-005", "RFID", "Lettore di Carte/Braccialetti (230Vac - 3500W) + Programmatore", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-230vac-3500w-programmatore", "SC823888"],
  ["RFI-006", "RFID", "Lettore di Carte/Braccialetti COMPATTO con uscita NA - Per avvio macchine o impianti (contatto Normale aperto)", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-compatto-con-uscita-na-contatto-normale-aperto", "SC950398"],
  ["RFI-007", "RFID", "Lettore di Carte/Braccialetti (contatto NA) + Programmatore", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-contatto-na-programmatore", "SC113096"],
  ["RFI-008", "RFID", "Lettore di Carte/Braccialetti RFID da incasso / uscita a 12vcc", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-rfid-da-incasso-uscita-a-12vcc", "SC076954"],
  ["RFI-009", "RFID", "Lettore di Tessere RFID per verifica credito", "lettori-di-carte-e-braccialetti/lettore-di-tessere-rfid-per-verifica-credito", "SC233962"],
  ["RFI-010", "RFID", "Lettore di Tessere/Braccialetti con pulsante di reset - uscita contatto NA", "lettori-di-carte-e-braccialetti/lettore-di-tesserebraccialetti-con-pulsante-di-reset-uscita-contatto-na", "SC347675"],
  ["RFI-011", "RFID", "Programmatore di tessere RFID", "lettori-di-carte-e-braccialetti/programmatore-di-tessere-rfid", "SC692690"],
  ["RFI-012", "RFID", "Programmatore di tessere RFID (carte, braccialetti, portachiavi)", "lettori-di-carte-e-braccialetti/programmatore-di-cartebraccialettiportachiavi-rfid", "RFIDPROG"],
  ["RFI-013", "RFID", "Programmatore di tessere RFID + Gestionale Clienti in Cloud", "lettori-di-carte-e-braccialetti/programmatore-di-tessere-rfid-gestionale-clienti-in-cloud", "SC528247"],
  ["CAM-001", "Cambiamonete", "CAMBIAGETTONI (cambia banconote e monete) - modello B", "cambiamonete/cambiagettoni-cambia-banconote-e-monete-modello-b", "SC313822"],
  ["CAM-002", "Cambiamonete", "CAMBIAGETTONI (cambia banconote e monete e CASHLESS) - modello D", "cambiamonete/cambiagettoni-cambia-banconote-e-monete-e-cashless-modello-c-nuovo", "SC425398"],
  ["CAM-003", "Cambiamonete", "Cambiagettoni Elettronico con Lettore Banconote e POS – Cambio da €5, €10, €20, €50 in Gettoni - modello CPOS", "cambiamonete/cambiagettoni-cambia-banconote-pos-in-gettoni-modello-cpos", "SC489131"],
  ["CAM-004", "Cambiamonete", "Cambiagettoni con POS – Accetta banconote, monete e carte", "cambiamonete/cambiagettoni-con-pos-accetta-tutte-le-carte-banconote-monete", "SC786382"],
  ["CAM-005", "Cambiamonete", "CAMBIAMONETE (cambia banconote in monete o gettoni) - modello C", "cambiamonete/cambiamonete-cambia-banconote-in-monete-o-gettoni-modello-c", "SC876229"],
  ["CAM-006", "Cambiamonete", "CARICATORE DI Carte RFID (legge banconote da € 5,10,20,50 e tutte le monete)", "cambiamonete/caricatore-di-carte-rfid-legge-banconote-e-monete", "SC421674"],
  ["CAM-007", "Cambiamonete", "Caricatore Tessere RFID Cashless con Pagamento tramite Carte di Debito e Credito", "cambiamonete/caricatore-di-carte-rfid-con-carte-di-credito-stripe", "SC158856"],
  ["CAM-008", "Cambiamonete", "Caricatore Automatico di Tessere RFID con Lettore Banconote da 5, 10, 20 e 50 €", "cambiamonete/caricatore-di-carte-rfid-legge-banconote-da-5-10-20-50", "SC342928"],
  ["CAM-009", "Cambiamonete", "Caricatore Tessere RFID con POS – Ricarica Credito tramite Carte di Debito e Credito", "cambiamonete/caricatore-tessere-rfid-con-pos-ricarica-credito-tramite-carte-di-debito-e-credito", "SC529324"],
  ["CAM-010", "Cambiamonete", "CARICATORE DI Carte RFID per Lavanderie Self service (legge banconote da € 5,10,20,50)", "gettoniere-per-negozi-self/caricatore-di-carte-rfid-per-lavanderie-self-service-legge-banconote-da-5-10-20-50", "SC850725"],
  ["CAM-011", "Cambiamonete", "Erogatore di TESSERE - con Lettore di Banconote e Monete", "cambiamonete/erogatore-di-tessere-con-lettore-di-banconote-e-monete", "SC443270"],
  ["CAM-012", "Cambiamonete", "QRChange – il cambiamonete cashless Made in Italy: incassi 100% digitali", "cambiamonete/qrchange-il-cambiamonete-cashless-made-in-italy-incassi-digitali-monete-reali", "SC658165"],
  ["TOE-001", "Toelettature", "Gettoniera toelettatura cani 3 utenze – Acqua calda/fredda + prese 230Vac", "gettoniere-per-negozi-self/3-utenze-vasca-toelettatura-h20-asciugatura-e-soffiatura", ""],
  ["TOE-002", "Toelettature", "3 UTENZE - Acqua, Asciugatrice, Aspiratore (per Toelettature per Cani)", "gettoniere-per-negozi-self/3-utenze-acqua-asciugatrice-aspiratore-per-toelettature-per-cani", "SC721663"],
  ["TOE-003", "Toelettature", "Attrezzature per Toelettatura Self-Service con 2 Vasche Grandi, POS, Gettoniere, Phon e Distributore Prodotti", "gettoniere-per-negozi-self/attrezzature-per-toelettatura-self-service-con-2-vasche-grandi-pos-gettoniere-phon-e-distributore-prodotti", "SC049532"],
  ["TOE-004", "Toelettature", "Gettoniera + Lettore RFID per 3 Dispositivi con Funzione \"Acqua + Sapone\" – Kit completo per Toelettature Self", "gettoniere-per-negozi-self/gettoniera-rfid-toelettatura-full-con-kit-pompa-sapone", "SC539382"],
  ["DIS-001", "Distributori", "Distributore Capsule Caffè con Gettoniera Elettronica – 4 Selezioni, 24 Capsule", "distributori-di-prodotti/it-distributori-di-capsule-caffe-distributore-capsule-caffe-gettoniera-elettronica", "SC577688"],
  ["DIS-002", "Distributori", "Distributore automatico di capsule caffè e detersivo per lavatrice e lavastoviglie – 4 piste multiprodotto", "distributori-di-prodotti/distributore-automatico-di-capsule-caffe-e-detersivo-per-lavatrice-e-lavastoviglie-4-piste-multiprodotto", "SC211029"],
  ["DIS-003", "Distributori", "Distributore Capsule Caffè DOLCE GUSTO con gettoniera meccanica da 0,5€", "distributori-di-capsule-caffe/distributore-capsule-caffe-dolce-gusto-con-gettoniera-meccanica-da-0-5", "SC103789"],
  ["DIS-004", "Distributori", "Distributore Capsule Caffè Lavazza A MODO MIO con gettoniera meccanica da 1,0€", "distributori-di-capsule-caffe/distributore-capsule-caffe-lavazza-a-modo-mio-con-gettoniera-meccanica-da-1-0", "SC263920"],
  ["DIS-005", "Distributori", "Distributore Capsule Caffè NESPRESSO / BORBONE con gettoniera meccanica da 1€", "distributori-di-capsule-caffe/distributore-capsule-caffe-nespresso-con-gettoniera-meccanica-da-1", "SC586599"],
  ["DIS-006", "Distributori", "Distributore Capsule Caffè NESPRESSO Professional con gettoniera meccanica da 0,5€", "distributori-di-capsule-caffe/distributore-capsule-caffe-nespresso-professional-con-gettoniera-meccanica-da-50-cent", "SC718365"],
  ["DIS-007", "Distributori", "Distributore di piccoli prodotti con Gettoniera meccanica (1 fila a 1 Euro e 1 fila a 50 Cent)", "distributori-di-prodotti/distributore-di-piccoli-prodotti-con-gettoniera-meccanica-1-fila-a-1-euro-e-1-fila-a-50-cent", "SC442331"],
  ["DIS-008", "Distributori", "Distributore di piccoli prodotti con Gettoniera meccanica (2 file a 1 Euro)", "distributori-di-prodotti/distributore-di-piccoli-prodotti-con-gettoniera-meccanica-2-file-a-1-euro", "SC222312"],
  ["DIS-009", "Distributori", "Distributore di piccoli prodotti con Gettoniera meccanica (2 file a 50 Cent)", "distributori-di-prodotti/distributore-di-piccoli-prodotti-con-gettoniera-meccanica-2-file-a-50-cent", "SC982835"],
  ["SPE-001", "Speciali", "2 DISPOSITIVI ELETTRICI + SW PER GESTIONE IN REMOTO E RICARICA TESSERE A DISTANZA", "gettoniere-speciali-vedi-sottocategorie/2-dispositivi-elettrici-sw-per-gestione-in-remoto-e-ricarica-tessere-a-distanza", "SC509459"],
  ["SPE-002", "Speciali", "2 DISPOSITIVI ELETTRICI PER GESTIONE IN REMOTO E RICARICA TESSERE A DISTANZA", "gettoniere-speciali-vedi-sottocategorie/2-dispositivi-elettrici-per-gestione-in-remoto-e-ricarica-tessere-a-distanza", "SC713153"],
  ["SPE-003", "Speciali", "4 DISPOSITIVI ELETTRICI + SW PER GESTIONE IN REMOTO E RICARICA TESSERE A DISTANZA", "gettoniere-speciali-vedi-sottocategorie/4-dispositivi-elettrici-con-gestione-in-remoto-e-ricarica-tessere-a-distanza", "SC095190"],
  ["SPE-004", "Speciali", "4 DISPOSITIVI ELETTRICI PER GESTIONE IN REMOTO E RICARICA TESSERE A DISTANZA", "gettoniere-speciali-vedi-sottocategorie/4-dispositivi-elettrici-per-gestione-in-remoto-e-ricarica-tessere-a-distanza", "SC750349"],
  ["SPE-005", "Speciali", "Generatore OZONO (produzione 10g/h, sanifica un locale di 130m2/h)", "gettoniere-speciali-vedi-sottocategorie/generatore-ozono-produzione-10g-h-sanifica-un-locale-di-130m2-h-pronta-consegna", "SC232466"],
  ["SPE-006", "Speciali", "Generatore OZONO (produzione 20g/h, sanifica un locale di 260m2/ 60 min)", "gettoniere-speciali-vedi-sottocategorie/generatore-ozono-produzione-20g-h-sanifica-un-locale-di-260m2-60-min", "SC874766"],
  ["SPE-007", "Speciali", "Generatore OZONO (produzione 5g/h, sanifica un locale di 67m2/h)", "gettoniere-speciali-vedi-sottocategorie/generatore-ozono-produzione-5g-h-67m2-h", "SC940247"],
  ["SPE-008", "Speciali", "Generatore OZONO (produzione 5g/h, sanifica un locale di 67m2/h) - Timer Digitale", "gettoniere-speciali-vedi-sottocategorie/generatore-ozono-produzione-5g-h-67m2-h-timer-digitale", "SC541744"],
  ["GET-001", "Gettoni e Tessere", "Braccialetti RFID 13,56 MHz, M1, con Cinturino Regolabile (50 pz) - colore ARANCIONE", "lettori-di-carte-e-braccialetti/braccialetti-rfid-13-56-mhz-m1-con-cinturino-regolabile-50-pz-colore-arancione", "SC169475"],
  ["GET-002", "Gettoni e Tessere", "Braccialetti RFID 13,56 MHz, M1, con Cinturino Regolabile (20 pz) - colore BLU", "gettoni-tessere-bracciali-rfid/copia-di-braccialetti-rfid-13-56-mhz-m1-con-cinturino-regolabile-20-pz-colore-blu", "SC904357"],
  ["GET-003", "Gettoni e Tessere", "Braccialetti RFID 13,56 MHz, M1, con Cinturino Regolabile (50 pz) - colore BLU", "gettoni-tessere-bracciali-rfid/braccialetti-rfid-13-56-mhz-m1-con-cinturino-regolabile-50-pz-colore-blu", "SC658575"],
  ["GET-004", "Gettoni e Tessere", "Gettone in acciaio mod. PAY39 (100pz)", "gettoni-tessere-bracciali-rfid/gettone-in-acciaio-mod-pay39", "GETPAY39"],
  ["GET-005", "Gettoni e Tessere", "Gettone in acciaio mod. PAY39 (50pz)", "gettoni-tessere-bracciali-rfid/gettone-in-acciaio-mod-pay39-50pz", "SC421657"],
  ["GET-006", "Gettoni e Tessere", "Gettone in acciaio mod. Shoppy (100pz)", "gettoni-tessere-bracciali-rfid/gettone-in-acciaio-mod-shoppy-100pz", "SC311139"],
  ["GET-007", "Gettoni e Tessere", "Gettoni in Acciaio Mod. Shoppy per Gettoniere – Confezione da 20 Pezzi", "gettoni-tessere-bracciali-rfid/copia-di-gettone-in-acciaio-mod-shoppy-20pz-nuovo-modello", "SC866740"],
  ["GET-008", "Gettoni e Tessere", "Gettone in acciaio mod. Shoppy (50pz)", "gettoni-tessere-bracciali-rfid/gettone-in-acciaio-mod-shoppy-50pz", "SC846569"],
  ["GET-009", "Gettoni e Tessere", "Portachiavi - ciondolo RFID 125 KHz (50 pz)", "gettoni-tessere-bracciali-rfid/portachiavi-ciondolo-rfid-125-khz-mhz-50-pz", "SC755008"],
  ["GET-010", "Gettoni e Tessere", "Portachiavi - ciondolo RFID 13,56 MHz (100 pz) - M1 1K", "gettoni-tessere-bracciali-rfid/portachiavi-ciondolo-rfid-13-56-mhz-100-pz-m1-1k", "SC538415"],
  ["GET-011", "Gettoni e Tessere", "Portachiavi - ciondolo RFID 13,56 MHz (20 pz) - M1 1K", "gettoni-tessere-bracciali-rfid/portachiavi-ciondolo-rfid-13-56-mhz-20-pz-m1", "SC952837"],
  ["GET-012", "Gettoni e Tessere", "Portachiavi - ciondolo RFID 13,56 MHz (50 pz) - M1 1K", "gettoni-tessere-bracciali-rfid/portachiavi-ciondolo-rfid-1356-mhz-50-pz-m1-1k", "SC836979"],
  ["GET-013", "Gettoni e Tessere", "Tessere RFID 125 KHz (100 pz)", "gettoni-tessere-bracciali-rfid/tessere-rfid-125-khz-100-pz", "SC099515"],
  ["GET-014", "Gettoni e Tessere", "Tessere RFID 125 KHz (50 pz)", "gettoni-tessere-bracciali-rfid/tessere-rfid-125-khz-50-pz", "SC082008"],
  ["GET-015", "Gettoni e Tessere", "Tessere RFID 13,56 MHz (100 pz) - 1K 14443 A ISO", "gettoni-tessere-bracciali-rfid/carte-rfid-1356-mhz", "CARD1356A"],
  ["GET-016", "Gettoni e Tessere", "Tessera RFID 13,56 MHz MIFARE 1K – ISO 14443 A (Confezione da 20 pezzi)", "gettoni-tessere-bracciali-rfid/tessere-rfid-13-56-mhz-mifare-1k-confezione-20-pz", "SC127793"],
  ["GET-017", "Gettoni e Tessere", "Tessera RFID 13,56 MHz MIFARE 1K – ISO 14443 A (Confezione da 50 pezzi)", "gettoni-tessere-bracciali-rfid/carte-rfid-13-56-mhz-50-pz-1k-14443-a-iso", "SC520989"],
  ["GET-018", "Gettoni e Tessere", "Tessere RFID 13,56 MHz PERSONALIZZATE (200 pz) - due LATI", "gettoni-tessere-bracciali-rfid/tessere-rfid-1356-mhz-personalizzate-50-pz-due-lati", "SC351691"],
  ["GET-019", "Gettoni e Tessere", "Tessere RFID 13,56 MHz PERSONALIZZATE (200 pz) - un LATO", "gettoni-tessere-bracciali-rfid/carte-rfid-13-56-mhz-200-pz-1k-14443-a-iso", "SC475273"],
  ["GET-020", "Gettoni e Tessere", "Tessere RFID 13,56 MHz PERSONALIZZATE (50 pz) - un LATO", "gettoni-tessere-bracciali-rfid/tessere-rfid-1356-mhz-personalizzate-50-pz-un-lato", "SC944217"],
  ["SER-001", "Servizi", "ABBONAMENTO 1 ANNO AL SERVIZIO CLOUD (KEY39 e PAY39)", "tele-assistenza/abbonamento-1-anno-al-servizio-cloud-key39", "SC564612"],
  ["SER-002", "Servizi", "Abbonamento annuale Server (per Apriporta e Gestionali per Palestre)", "tele-assistenza/abbonamento-annuale-server-per-key39-e-qrpay", "SC417061"],
  ["SER-003", "Servizi", "App corrispettivi EASY 1 per una gettoniera – Abbonamento 12 mesi", "app-per-invio-corrispettivi/app-corrispettivi-easy-1-per-una-gettoniera-abbonamento-12-mesi", "SC157151"],
  ["SER-004", "Servizi", "App corrispettivi EASY 2 per due gettoniere – Abbonamento 12 mesi", "app-per-invio-corrispettivi/app-corrispettivi-easy-2-per-due-gettoniere-abbonamento-12-mesi", "SC219296"],
  ["SER-005", "Servizi", "App corrispettivi EASY Light per gettoniere illimitate – Abbonamento 12 mesi", "app-per-invio-corrispettivi/app-corrispettivi-easy-light-per-gettoniere-illimitate-abbonamento-12-mesi", "SC470310"],
  ["SER-006", "Servizi", "CARICAMENTO DATA BASE SU NOSTRI SW GESTIONALI", "tele-assistenza/caricamento-data-base-su-nostri-gestionali", "SC941524"],
  ["SER-007", "Servizi", "Caricamento Software Centralina di Pagamento QR – Ultima Release in Teleassistenza", "tele-assistenza/caricamento-software-centralina-di-pagamento-qr-ultima-release-in-teleassistenza", "SC214697"],
  ["SER-008", "Servizi", "DUPLICATO ISTRUZIONI / DOCUMENTAZIONE TECNICA", "tele-assistenza/duplicato-istruzioni-documentazione-tecnica", "SC523771"],
  ["SER-009", "Servizi", "Montaggio e riparazione (1h)", "tele-assistenza/montaggio-e-riparazione-1h", "SC607053"],
  ["SER-010", "Servizi", "Rinnovo Abbonamento SW Gestionali – Mantieni Attivi i Tuoi Servizi Cloud", "tele-assistenza/rinnovo-abbonamento-sw-gestionali-mantieni-attivi-i-tuoi-servizi-cloud", "SC144559"],
  ["SER-011", "Servizi", "Ritiro merce presso Vostra Sede", "tele-assistenza/ritiro-merce-sede-cliente", "SC358238"],
  ["SER-012", "Servizi", "SW PER GESTIONE ABBONATI PER CENTRI SPORTIVI / CON AVVISI SCADENZE", "codici-qr-applicazioni-nuovo/gestione-abbonati-per-centri-sportivi-con-avvisi-scadenze", "SC792843"],
  ["SER-013", "Servizi", "15 MIN - TELE ASSISTENZA PER PROGRAMMAZIONE NUOVI PARAMETRI", "tele-assistenza/15-min-tele-assistenza-per-programmazione-nuovi-parametri", "SC580422"],
  ["SER-014", "Servizi", "Trasporto Andata e Ritorno", "tele-assistenza/trasporto-presso-nostra-sede", "SC648477"],
  ["RIC-001", "Ricambi", "Alimentatore 12Vcc 2A (24W) da parete", "parti-di-ricambio/alimentatore-12vcc-2a-24w-da-parete", "SC843398"],
  ["RIC-002", "Ricambi", "Alimentatore 12Vcc 5A (60W) con cavo di alimentazione da 1,4m", "parti-di-ricambio/alimentatore-12vcc-5a-con-cavo-di-alimentazione", "SC308351"],
  ["RIC-003", "Ricambi", "Alimentatore 12Vcc 5A (60W) da quadro", "parti-di-ricambio/alimentatore-12vcc-5a-60w-da-quadro", "SC920675"],
  ["RIC-004", "Ricambi", "Alimentatore 230/12Vcc 2,5A in cassetta stagna", "parti-di-ricambio/alimentatore-230-12vcc-2-5a-in-cassetta-stagna", "SC178100"],
  ["RIC-005", "Ricambi", "Alimentatore 230/12Vcc 5A in cassetta stagna", "parti-di-ricambio/alimentatore-23012vcc-5a-in-cassetta-stagna", "SC415518"],
  ["RIC-006", "Ricambi", "Box per KIT Gettoniera con cassetto portamonete e serratura", "parti-di-ricambio/box-per-kit-gettoniera-con-cassetto-portamonete-e-serratura", "BOXKIT"],
  ["RIC-007", "Ricambi", "Cassetta in ABS per montaggio KIT Gettoniera + Mascherina in Plexi", "parti-di-ricambio/cassetta-in-abs-per-montaggio-kit-gettoniera-mascherina-in-plexi", "SC149242"],
  ["RIC-008", "Ricambi", "Cavi per Pulsanti per schede a 2 - 3 - 4 ..sino a 12 uscite", "parti-di-ricambio/cavi-per-pulsanti-per-schede-a-2-3-4-uscite", "SC556460"],
  ["RIC-009", "Ricambi", "Cavo display", "parti-di-ricambio/cavo-display", "SC947157"],
  ["RIC-010", "Ricambi", "Cavo per elettrovalvola a 12Vcc con DIODO di protezione (2 pezzi)", "parti-di-ricambio/cavo-per-elettrovalvola-a-12vcc-con-diodo-di-protezione", "SC019215"],
  ["RIC-011", "Ricambi", "Chiave per BOX in lamiera", "parti-di-ricambio/chiave-per-box-in-lamiera", "SC354384"],
  ["RIC-012", "Ricambi", "Contamonete digitale", "parti-di-ricambio/contamonete-digitale", "SC103980"],
  ["RIC-013", "Ricambi", "Contatore Acqua con attacchi da 3/4\" - uscita ad impulsi (1/10L)", "parti-di-ricambio/contatore-acqua-con-attacchi-da-34-uscita-ad-impulsi-110l", "SC196089"],
  ["RIC-014", "Ricambi", "Contattore Bipolare da 25A (bobina a 12Vcc)", "parti-di-ricambio/contattore-bipolare-da-25a-bobina-a-12vcc", "SC101373"],
  ["RIC-015", "Ricambi", "Contattore Bipolare da 25A (bobina a 230Vac)", "parti-di-ricambio/contattore-bipolare-da-25a-bobina-a-230vac", "SC082156"],
  ["RIC-016", "Ricambi", "COVER per Gettoniera", "parti-di-ricambio/cover-per-gettoniera", "SC291270"],
  ["RIC-017", "Ricambi", "COVER per Gettoniera con cerniera (Mod. A)", "parti-di-ricambio/cover-per-gettoniera-con-cerniera-mod-a", "SC417027"],
  ["RIC-018", "Ricambi", "COVER per Gettoniera con cerniera (Mod. B)", "parti-di-ricambio/cover-per-gettoniera-con-cerniera-mod-b", "SC842056"],
  ["RIC-019", "Ricambi", "Display LCD a 2 line seriale 16x2", "parti-di-ricambio/display-lcd-a-2-line-seriale-16x2", "SC525559"],
  ["RIC-020", "Ricambi", "Display per scheda 230Vac / 12Vcc", "parti-di-ricambio/display-per-scheda-230vac-12vcc", "SC256264"],
  ["RIC-021", "Ricambi", "Elettrovalvola H2O ad impulsi - in ottone a 4,5Vcc / attacchi da 1/2\"", "parti-di-ricambio/elettrovalvola-h2o-ad-impulsi", "SC379000"],
  ["RIC-022", "Ricambi", "Elettrovalvola H2O con bobina a 12Vcc / attacchi da 1/2\"", "parti-di-ricambio/elettrovalvola-h2o-con-bobina-a-12vcc-attacchi-da-12", "ELETTRV12VA"],
  ["RIC-023", "Ricambi", "Elettrovalvola H2O in ottone con bobina a 12Vcc / attacchi da 1/2\"", "parti-di-ricambio/elettrovalvola-h2o-in-ottone-con-bobina-a-12vcc-attacchi-da-1-2", "SC713535"],
  ["RIC-024", "Ricambi", "Gettoniera monomoneta a comparazione", "parti-di-ricambio/gettoniera-monomoneta-a-comparazione", "GETT638"],
  ["RIC-025", "Ricambi", "Gettoniera Monomoneta con Microinterruttore", "parti-di-ricambio/gettoniera-monomoneta-con-micro", "SC828607"],
  ["RIC-026", "Ricambi", "Gettoniera multimoneta Alberici mod. AL66S euro (Pulse/CCtalk)", "parti-di-ricambio/gettoniera-multimoneta-alberici-mod-al66s-euro-pulse-cctalk", "SC636054"],
  ["RIC-027", "Ricambi", "Gettoniera multimoneta (Euro 0,1..0,2..0,5..1..2) - mod.600F", "parti-di-ricambio/gettoniera-multimoneta-euro-0-1-0-2-0-5-1-2-mod-600f", "GETT600F"],
  ["RIC-028", "Ricambi", "Gettoniera multimoneta (Euro 0,1..0,2..0,5..1..2) - mod.926", "parti-di-ricambio/gettoniera-multimoneta-euro-0-1-0-2-0-5-1-2-mod-926", "GET926"],
  ["RIC-029", "Ricambi", "Gettoniera multimoneta di alta precisione (Euro 0,1..0,2..0,5..1..2) - mod.CL-168 - LEGGE 5 MONETE", "parti-di-ricambio/gettoniera-multimoneta-euro-0-1-0-2-0-5-1-2-mod-cl-168-legge-5-monete", "SC514019"],
  ["RIC-030", "Ricambi", "Inserto per moneta da 1 Euro (per distributori di capsule caffè)", "parti-di-ricambio/inserto-per-moneta-da-1-euro-per-distributori-di-capsule-caffe", "SC943790"],
  ["RIC-031", "Ricambi", "Inserto per moneta da 50 Cent (per distributori di capsule caffè)", "parti-di-ricambio/inserto-per-moneta-da-50-cent-per-distributori-di-capsule-caffe", "SC391764"],
  ["RIC-032", "Ricambi", "KIT Pulsante + Elettrovalvola + set di cavi + assistenza", "parti-di-ricambio/kit-pulsante-elettrovalvola-set-di-cavi-assistenza", "SC030345"],
  ["RIC-033", "Ricambi", "Lettore di Banconote da 5,10,20,50 euro - uscita ad impulsi", "parti-di-ricambio/lettore-di-banconote-da-5-10-20-euro-uscita-ad-impulsi", "SC889174"],
  ["RIC-034", "Ricambi", "Lettore di Banconote da 5,10,20,50 euro + dima fissaggio - uscita ad impulsi", "parti-di-ricambio/lettore-di-banconote-da-5-10-20-euro-dima-fissaggio-uscita-ad-impulsi", "SC793104"],
  ["RIC-035", "Ricambi", "Siemens 6ED1052-2MD08-0BA1 Modulo di controllo PLC 12 V/DC, 24 V/DC", "schede-timer/siemens-6ed1052-2md08-0ba1-modulo-di-controllo-plc-12-v-dc-24-v-dc", "SC219593"],
  ["RIC-036", "Ricambi", "Modulo relè bipolare da 25A (230Vac)", "parti-di-ricambio/modulo-rele-bipolare-da-25a-230vac", "SC577241"],
  ["RIC-037", "Ricambi", "Modulo relè bipolare da 25A (bobina a 12Vcc)", "parti-di-ricambio/modulo-rele-bipolare-da-25a-bobina-a-12vcc", "SC440184"],
  ["RIC-038", "Ricambi", "Mostrina + cover trasparente per display LCD", "parti-di-ricambio/mostrina-cover-trasparente-per-display-lcd", "SC438304"],
  ["RIC-039", "Ricambi", "Mostrina copri errori per gettoniera", "parti-di-ricambio/mostrina-copri-errori-per-gettoniera", "SC577549"],
  ["RIC-040", "Ricambi", "Mostrina copri errori per gettoniera e display", "parti-di-ricambio/mostrina-copri-errori-per-gettoniera-e-display", "MOSTRINA1"],
  ["RIC-041", "Ricambi", "Mostrina Fronte e Retro per gettoniera e fissaggio display", "parti-di-ricambio/mostrina-fronte-e-retro-per-gettoniera-e-fissaggio-display", "SC445854"],
  ["RIC-042", "Ricambi", "Mostrina per gettoniera CL168", "parti-di-ricambio/mostrina-per-gettoniera-cl168", "SC306144"],
  ["RIC-043", "Ricambi", "Mostrina per gettoniera DG600F", "parti-di-ricambio/mostrina-per-gettoniera-dg600f", "SC654434"],
  ["RIC-044", "Ricambi", "Presa Elettrica Impermeabile IP66 10/16A 2P+T", "parti-di-ricambio/presa-elettriche-impermeabileip66-1016a-2pt", "SC667403"],
  ["RIC-045", "Ricambi", "Presa per PHON / altri dispositivi a 230Vac", "parti-di-ricambio/presa-per-phon-con-alimentazione-a-230vac", "SC081407"],
  ["RIC-046", "Ricambi", "Presa per PHON / altri dispositivi a 230Vac per gettoniera con uscita a 12Vcc", "parti-di-ricambio/presa-per-phon-altri-dispositivi-a-230vac-per-gettoniera-con-uscita-a-12vcc", "SC606579"],
  ["RIC-047", "Ricambi", "Presa SHUKO con cavo guainato F3G2,5", "parti-di-ricambio/presa-shuko-con-cavo-sguainato", "SC800296"],
  ["RIC-048", "Ricambi", "Protezione parasole in plexiglas per gettoniere Mod. MAXI (41 x 30 cm)", "parti-di-ricambio/protezione-parasole-in-plexiglas-per-gettoniere-mod-maxi-41-x-30-cm", "SC059125"],
  ["RIC-049", "Ricambi", "Protezione parasole in plexiglas per gettoniere mod. MINI (32 x 30 cm)", "parti-di-ricambio/protezione-parasole-in-plexiglas-per-gettoniere", "SC644121"],
  ["RIC-050", "Ricambi", "Pulsante con micro - colore BIANCO retroilluminato con LED (5Vcc) - 1 Pezzo", "parti-di-ricambio/pulsante-con-micro-colore-bianco-retroilluminato-con-led-5vcc-1-pezzo", "SC479628"],
  ["RIC-051", "Ricambi", "Pulsante con micro - colore BLU retroilluminato con LED (5Vcc) - 1 Pezzo", "parti-di-ricambio/pulsante-con-micro-colore-blu-retroilluminato-con-led-5vcc-1-pezzo", "SC802994"],
  ["RIC-052", "Ricambi", "Pulsante con micro - colore GIALLO retroilluminato con LED (5Vcc) - 1 Pezzo", "parti-di-ricambio/pulsante-con-micro-colore-giallo-retroilluminato-con-led-5vcc-1-pezzo", "SC617741"],
  ["RIC-053", "Ricambi", "Pulsante con micro - colore ROSSO retroilluminato con LED (5Vcc) - 1 Pezzo", "parti-di-ricambio/pulsante-con-micro-colore-rosso-retroilluminato-con-led-5vcc-1-pezzo", "SC052943"],
  ["RIC-054", "Ricambi", "Pulsante con micro - colore VERDE retroilluminato con LED (5Vcc) - 1 Pezzo", "parti-di-ricambio/pulsante-con-micro-colore-verde-retroilluminato-con-led-5vcc-1-pezzo", "SC649042"],
  ["RIC-055", "Ricambi", "Pulsante di pausa con contenitore a tenuta stagna (IP56)", "parti-di-ricambio/pulsante-di-pausa-con-contenitore-a-tenuta-stagna-ip56", "SC083705"],
  ["RIC-056", "Ricambi", "Pulsante mod. MINI - colore BIANCO retroilluminato con LED (5Vcc) - 1 Pezzo", "parti-di-ricambio/pulsante-mod-mini-colore-bianco-retroilluminato-con-led-5vcc-1-pezzo", "SC627725"],
  ["RIC-057", "Ricambi", "Pulsante mod. MINI - colore GIALLO retroilluminato con LED (5Vcc) - 1 Pezzo", "parti-di-ricambio/pulsante-mod-mini-colore-giallo-retroilluminato-con-led-5vcc-1-pezzo", "SC876301"],
  ["RIC-058", "Ricambi", "Pulsante mod. MINI - colore ROSSO retroilluminato con LED (5Vcc) - 1 Pezzo", "parti-di-ricambio/pulsante-mod-mini-colore-rosso-retroilluminato-con-led-5vcc-1-pezzo", "SC719201"],
  ["RIC-059", "Ricambi", "Pulsante mod. MINI - colore VERDE retroilluminato con LED (5Vcc) - 1 Pezzo", "parti-di-ricambio/pulsante-mod-mini-colore-verde-retroilluminato-con-led-5vcc-1-pezzo", "SC405369"],
  ["RIC-060", "Ricambi", "Pulsanti colorati (con microswitch) retroilluminati con LED (5Vcc) - set di 4 pezzi", "parti-di-ricambio/pulsanti-colorati-con-microswitch-retroilluminati-con-led-5vcc-set-di-4-pezzi", "SC848099"],
  ["RIC-061", "Ricambi", "Pulsanti colorati (con microswitch) retroilluminati con LED (5Vcc) - set di 5 pezzi", "parti-di-ricambio/pulsanti-colorati-con-microswitch-retroilluminati-con-led-5vcc-set-di-5-pezzi", "SC271609"],
  ["RIC-062", "Ricambi", "Pulsanti colorati retroilluminati con LED (5Vcc) - set di 4 pezzi", "parti-di-ricambio/pulsanti-colorati-retroilluminati-con-led-5vcc-set-di-4-pezzi", "SC101646"],
  ["RIC-063", "Ricambi", "Pulsantiera con 2 pulsanti con LED", "parti-di-ricambio/pulsantiera-con-2-pulsanti-con-led", "SC316413"],
  ["RIC-064", "Ricambi", "Pulsantiera con 3 pulsanti con LED", "parti-di-ricambio/pulsantiera-con-3-pulsanti-con-led", "SC787780"],
  ["RIC-065", "Ricambi", "Pulsantiera con 3 pulsanti con LED - box giallo", "parti-di-ricambio/pulsantiera-con-3-pulsanti-con-led-box-giallo", "SC816838"],
  ["RIC-066", "Ricambi", "Pulsantiera con 4 pulsanti con LED", "parti-di-ricambio/pulsantiera-con-4-pulsanti-con-led", "SC858021"],
  ["RIC-067", "Ricambi", "Pulsantiera per 2 pulsanti", "parti-di-ricambio/pulsantiera-per-2-pulsanti", "SC481808"],
  ["RIC-068", "Ricambi", "Pulsantiera per 3 pulsanti", "parti-di-ricambio/pulsantiera-per-3-pulsanti", "SC167574"],
  ["RIC-069", "Ricambi", "Pulsantiera per 4 pulsanti", "parti-di-ricambio/pulsantiera-per-4-pulsanti", "SC060912"],
  ["RIC-070", "Ricambi", "Scheda Timer per gettoniera con 4 uscite", "parti-di-ricambio/scheda-timer-per-gettoniera-con-4-uscite", "SC685733"],
  ["RIC-071", "Ricambi", "Scheda Timer per gettoniera - IN/OUT 230V - 10A (Lavatrici, Luci)", "parti-di-ricambio/scheda-timer-per-gettoniera-in-out-220v-10a-lavatrici-luci", "SC044417"],
  ["RIC-072", "Ricambi", "Serratura con chiave in plastica (5 set) - Diam. 23 mm", "parti-di-ricambio/serratura-con-chiave-in-plastica-5-set", "SC984383"],
  ["RIC-073", "Ricambi", "Serratura di sicurezza con 2 CHIAVI - Mod. A", "parti-di-ricambio/serratura-di-sicurezza-con-2-chiavi-moda", "SC328632"],
  ["RIC-074", "Ricambi", "Serratura di sicurezza con 2 CHIAVI - Mod. B", "parti-di-ricambio/serratura-con-2-chiavi-modb", "SC728446"],
  ["RIC-075", "Ricambi", "Set di 4 Staffe di Fissaggio a Parete per Gettoniera – Alluminio Nero con Tasselli Inclusi", "parti-di-ricambio/staffa-per-fissaggio-a-parete-gettoniera-per-lavatrice", "SC330112"],
  ["RIC-076", "Ricambi", "Timer per gettoniera - IN 12Vcc / Uscita contatto Aperto", "parti-di-ricambio/timer-per-gettoniera-in-out-12vcc", "TIMER12VCCNA"],
  ["RIC-077", "Ricambi", "Timer per gettoniera - IN/OUT 12Vcc", "parti-di-ricambio/timer-per-gettoniera-in-e-out-12vcc", "TIMER12VCC12"],
  ["RIC-078", "Ricambi", "Timer per gettoniera - IN/OUT 230V - 6A", "parti-di-ricambio/timer-per-gettoniera-inout-220v-6a", "TIMER220V"],
  ["RIC-079", "Ricambi", "Trasformatore 220/9Vac 12VA (5 pezzi)", "parti-di-ricambio/trasformatore-220v9v-ac-5-pezzi", "SC825619"],
  ["RIC-080", "Ricambi", "Trasformatore 220/9Vac - 889mA - 8VA", "parti-di-ricambio/trasformatore-220-9vac-889ma", "SC467854"],
  ["RIC-081", "Ricambi", "Convogliatore di prodotti a nastro con motore passo passo a 24Vcc - lunghezza utile 42cm", "parti-di-ricambio/convogliatore-di-prodotti-a-nastro-con-motore-passo-passo-a-24vcc-lunghezza-utile-42cm", "SC716004"],
  ["RIC-082", "Ricambi", "Distributore prodotti a nastro con motore passo passo a 24Vcc - lunghezza utile 40cm", "parti-di-ricambio/distributore-prodotti-a-nastro-con-motore-passo-passo-a-24vcc-lunghezza-utile-40cm", "SC092102"],
  ["RIC-083", "Ricambi", "Doppio Convogliatore di prodotti a nastro con motore passo passo a 24Vcc - lunghezza utile 42cm", "parti-di-ricambio/doppio-convogliatore-di-prodotti-a-nastro-con-motore-passo-passo-a-24vcc-lunghezza-utile-42cm", "SC848408"],
  ["RIC-084", "Ricambi", "Elettroserratura per distributore vending a 5Vcc con feedback", "parti-di-ricambio/elettroserratura-per-distributore-vending-a-5vcc-con-feedback", "SC034032"],
  ["RIC-085", "Ricambi", "Guida per molla diametro 40mm per distributore di prodotti - lunghezza utile 45cm", "parti-di-ricambio/guida-per-molla-per-distributore-di-prodotti-lunghezza-utile-45cm", "SC698695"],
  ["RIC-086", "Ricambi", "Molla in acciaio per distributore automatico L=50cm, Passo=4cm, Dia=4cm", "parti-di-ricambio/molle-in-acciaio-per-distributore-automatico-l50cm-passo4cm-dia4cm", "SC947708"],
  ["RIC-087", "Ricambi", "Motore Passo passo singolo per macchina Vending a 24Vcc", "parti-di-ricambio/motore-passo-passo-per-macchina-vending-24vcc", "SC130322"],
  ["RIC-088", "Ricambi", "Scheda a radiazione infrarossa che rileva la caduta dei prodotti", "parti-di-ricambio/scheda-a-radiazione-infrarossa-che-rileva-la-caduta-dei-prodotti", "SC829657"],
  ["RIC-089", "Ricambi", "Spingi prodotti con motore passo passo a 24Vcc - lunghezza utile 45cm", "parti-di-ricambio/spingi-prodotti-con-motore-passo-passo-a-24vcc-lunghezza-utile-45cm", "SC428339"],
  ["RIC-090", "Ricambi", "Vite + Dado M3 in acciaio inox (Vite L=20mm) / Set di 4 bulloni", "parti-di-ricambio/vite-dado-m3-in-acciaio-inox-vite-l20mm-set-di-4-bulloni", "SC079051"],
];

export const CATALOGO = CATALOGO_RAW.map(([id, category, name, link, codiceSito]) => ({ id, code: codiceSito || id, category, name, link: SITO + link }));
export { CATEGORIE_CATALOGO };

// ─── UTILITY RICERCA ──────────────────────────────────────────────────────────
const norma = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const parole = (s) => norma(s).split(/[^a-z0-9]+/).filter(Boolean);
export const corrisponde = (testo, q) => {
  const t = norma(testo);
  return parole(q).every(w => t.includes(w));
};
export const prodottiVisibili = (products) =>
  products.filter(p => p && !Array.isArray(p) && p.id && p.name && !p.hidden);

const ST = {
  input: { width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: 14, border: "1.5px solid #E2E8F0", borderRadius: 8, fontFamily: "'IBM Plex Sans',sans-serif", color: "#1E293B", background: "#fff", outline: "none" },
  scelto: { width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: 14, border: "1.5px solid #CBD5E1", borderRadius: 8, fontFamily: "'IBM Plex Sans',sans-serif", color: "#1E293B", background: "#F8FAFC", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" },
  lista: { position: "absolute", left: 0, right: 0, top: "calc(100% + 4px)", background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 8, boxShadow: "0 8px 24px rgba(15,23,42,.12)", maxHeight: 320, overflowY: "auto", zIndex: 50 },
  voce: { display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderTop: "1px solid #F1F5F9", padding: "9px 12px", cursor: "pointer", fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 14, color: "#1E293B" },
  gruppo: { padding: "6px 12px", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "#94A3B8", background: "#F8FAFC" },
  codice: { fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#94A3B8", marginLeft: 6 },
};

// ─── SCELTA CON RICERCA ───────────────────────────────────────────────────────
// items: [{ id, label, code, group }]
export function SceltaConRicerca({ items, value, onChange, placeholder, extra, etichettaScelta }) {
  const [aperto, setAperto] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef();
  const scelto = items.find(i => i.id === value) || (extra || []).find(i => i.id === value);

  useEffect(() => {
    if (!aperto) return;
    const chiudi = (e) => { if (box.current && !box.current.contains(e.target)) setAperto(false); };
    document.addEventListener("mousedown", chiudi);
    document.addEventListener("touchstart", chiudi);
    return () => { document.removeEventListener("mousedown", chiudi); document.removeEventListener("touchstart", chiudi); };
  }, [aperto]);

  const trovati = useMemo(() => {
    const r = q.trim() ? items.filter(i => corrisponde(`${i.label} ${i.code || ""} ${i.group || ""}`, q)) : items;
    return r.slice(0, 80);
  }, [items, q]);

  const scegli = (id) => { onChange(id); setAperto(false); setQ(""); };

  if (!aperto && value) {
    return (
      <button type="button" style={ST.scelto} onClick={() => setAperto(true)}>
        <span style={{ minWidth: 0 }}>{etichettaScelta ? etichettaScelta(scelto) : (scelto ? scelto.label : "Prodotto non trovato")}{scelto && scelto.code && <span style={ST.codice}>{scelto.code}</span>}</span>
        <span style={{ color: "#94A3B8", fontSize: 12, flexShrink: 0 }}>Cambia</span>
      </button>
    );
  }

  let gruppoPrec = null;
  return (
    <div ref={box} style={{ position: "relative" }}>
      <input autoFocus={aperto} value={q} onChange={e => { setQ(e.target.value); setAperto(true); }} onFocus={() => setAperto(true)}
        onKeyDown={e => { if (e.key === "Escape") setAperto(false); if (e.key === "Enter" && trovati.length) { e.preventDefault(); scegli(trovati[0].id); } }}
        placeholder={placeholder || "Scrivi per cercare (es. 4 docce pos)"} style={ST.input} />
      {aperto && (
        <div style={ST.lista}>
          {(extra || []).map(x => (
            <button type="button" key={x.id} style={{ ...ST.voce, color: x.colore || "#B45309", fontWeight: 600 }} onMouseDown={e => e.preventDefault()} onClick={() => scegli(x.id)}>{x.label}</button>
          ))}
          {trovati.map(i => {
            const titolo = i.group && i.group !== gruppoPrec ? i.group : null;
            gruppoPrec = i.group;
            return (
              <React.Fragment key={i.id}>
                {titolo && <div style={ST.gruppo}>{titolo}</div>}
                <button type="button" style={ST.voce} onMouseDown={e => e.preventDefault()} onClick={() => scegli(i.id)}>
                  {i.label}{i.code && <span style={ST.codice}>{i.code}</span>}
                </button>
              </React.Fragment>
            );
          })}
          {!trovati.length && <div style={{ padding: 12, color: "#94A3B8", fontSize: 13 }}>Nessun prodotto trovato. Prova con meno parole.</div>}
          {trovati.length === 80 && <div style={{ padding: 10, color: "#94A3B8", fontSize: 12 }}>Scrivi qualche parola in più per restringere la ricerca.</div>}
        </div>
      )}
    </div>
  );
}

// ─── SCELTA PRODOTTO PER GLI ORDINI ───────────────────────────────────────────
export function SceltaProdotto({ products, categories, value, onChange, manuale }) {
  const items = useMemo(() => {
    const vis = prodottiVisibili(products);
    const ordineCat = (categories || []).concat(CATEGORIE_CATALOGO);
    const pos = (c) => { const i = ordineCat.indexOf(c); return i < 0 ? 999 : i; };
    return vis
      .slice()
      .sort((a, b) => pos(a.category) - pos(b.category) || (a.code || "").localeCompare(b.code || "") || a.name.localeCompare(b.name))
      .map(p => ({ id: p.id, label: p.name, code: p.code, group: p.category || "Altro" }));
  }, [products, categories]);
  // il prodotto già scelto resta visibile anche se ora è nascosto
  const tutti = useMemo(() => {
    if (!value || value === "__custom__" || items.some(i => i.id === value)) return items;
    const p = products.find(x => x && x.id === value);
    return p ? [{ id: p.id, label: p.name, code: p.code, group: p.category }, ...items] : items;
  }, [items, value, products]);
  const extra = manuale ? [{ id: "__custom__", label: "✏️ Scrivi prodotto manuale…" }] : [];
  return (
    <SceltaConRicerca items={tutti} value={value} onChange={onChange} extra={extra}
      etichettaScelta={(s) => value === "__custom__" ? "✏️ Prodotto manuale" : (s ? s.label : "Prodotto non trovato")} />
  );
}

// ─── AGGIORNA CATALOGO ────────────────────────────────────────────────────────
// Un solo pulsante: mette nel gestionale tutti i prodotti del sito (nome e codice
// del sito) e nasconde quelli inseriti a mano. Gli ordini vecchi restano collegati.
const upsertProdotti = async (lista) => {
  for (let i = 0; i < lista.length; i += 100) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/prodotti`, {
      method: "POST",
      headers: { ...H, Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(lista.slice(i, i + 100).map(p => ({ id: p.id, data: p }))),
    });
    if (!r.ok) throw new Error("Salvataggio non riuscito");
  }
};

export function ImportaCatalogo({ products, onFatto }) {
  const [fase, setFase] = useState("pronto"); // pronto | conferma | lavoro | fatto | errore
  const [esito, setEsito] = useState(null);

  const validi = useMemo(() => products.filter(p => p && !Array.isArray(p) && p.id && p.name), [products]);
  const daNascondere = useMemo(() => validi.filter(p => !p.catalogCode && !p.hidden), [validi]);

  const aggiorna = async () => {
    setFase("lavoro");
    try {
      const daSalvare = [];
      const perCodice = {};
      validi.forEach(p => { if (p.catalogCode) (perCodice[p.catalogCode] = perCodice[p.catalogCode] || []).push(p); });
      CATALOGO.forEach(c => {
        const dati = { name: c.name, code: c.code, category: c.category, link: c.link, catalogCode: c.id };
        const esistenti = perCodice[c.id] || [];
        if (!esistenti.length) { daSalvare.push({ id: c.id, notes: "", ...dati }); return; }
        // il primo resta visibile, eventuali doppioni restano nascosti
        const principale = esistenti.find(p => !p.hidden) || esistenti[0];
        esistenti.forEach(p => daSalvare.push({ ...p, ...dati, hidden: p.id !== principale.id }));
      });
      daNascondere.forEach(p => daSalvare.push({ ...p, hidden: true }));
      await upsertProdotti(daSalvare);
      await onFatto([...CATEGORIE_CATALOGO]);
      setEsito({ catalogo: CATALOGO.length, nascosti: daNascondere.length });
      setFase("fatto");
    } catch (e) {
      setFase("errore");
    }
  };

  const card = { background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "16px 18px", maxWidth: 640 };
  const btnP = { background: "#1E293B", color: "#fff", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const btnS = { background: "#fff", color: "#475569", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "12px 20px", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };

  return (
    <div style={{ maxWidth: 680 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1E293B", margin: "0 0 6px" }}>Aggiorna catalogo dal sito</h1>
      <p style={{ color: "#64748B", margin: "0 0 18px" }}>
        Mette nel gestionale tutti i {CATALOGO.length} prodotti di gettoniere-shop.it, con il nome e il codice prodotto del sito, divisi in {CATEGORIE_CATALOGO.length} categorie. I prodotti inseriti a mano vengono nascosti: non si cancella niente e gli ordini già fatti restano leggibili.
      </p>

      {fase === "pronto" && (
        <div style={card}>
          <p style={{ margin: "0 0 14px", color: "#1E293B" }}>
            {daNascondere.length > 0 ? `${daNascondere.length} prodotti inseriti a mano verranno nascosti.` : "Non ci sono prodotti inseriti a mano da nascondere."}
          </p>
          <button style={btnP} onClick={() => setFase("conferma")}>Aggiorna catalogo</button>
        </div>
      )}
      {fase === "conferma" && (
        <div style={{ ...card, borderLeft: "4px solid #F59E0B" }}>
          <p style={{ margin: "0 0 12px", color: "#1E293B" }}>Confermi l'aggiornamento?</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={btnP} onClick={aggiorna}>Sì, aggiorna</button>
            <button style={btnS} onClick={() => setFase("pronto")}>Annulla</button>
          </div>
        </div>
      )}
      {fase === "lavoro" && <p style={{ color: "#1D4ED8", fontWeight: 600 }}>Aggiornamento in corso… non chiudere la pagina.</p>}
      {fase === "fatto" && (
        <div style={{ ...card, borderLeft: "4px solid #22C55E" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>✅ Catalogo aggiornato</h2>
          <p style={{ margin: 0, color: "#475569" }}>
            {esito.catalogo} prodotti del sito con nome e codice aggiornati{esito.nascosti ? `, ${esito.nascosti} prodotti vecchi nascosti` : ""}. Ora li trovi tutti in Nuovo ordine scrivendo nella ricerca.
          </p>
        </div>
      )}
      {fase === "errore" && (
        <div style={{ ...card, borderLeft: "4px solid #EF4444" }}>
          <p style={{ margin: "0 0 12px" }}>L'aggiornamento si è interrotto, probabilmente per la connessione. Puoi riprovare: non si creano doppioni.</p>
          <button style={btnP} onClick={aggiorna}>Riprova</button>
        </div>
      )}
    </div>
  );
}
