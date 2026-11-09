import React, { useState, useMemo, useRef, useEffect } from "react";

// ─── CATALOGO PRODOTTI ────────────────────────────────────────────────────────
// Catalogo ufficiale preso da gettoniere-shop.it, ricerca prodotti
// e schermata per importarlo abbinando i prodotti vecchi.

const SUPABASE_URL = "https://qdkgkjevmynbvuqvfceg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFka2dramV2bXluYnZ1cXZmY2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxNzc3NDMsImV4cCI6MjA5NTc1Mzc0M30.LW57hzZliXjg-U32tGJ4iAQR824MgZoLU4XpfkUMbj0";
const H = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };
const SITO = "https://www.gettoniere-shop.it/it/";

const CATEGORIE_CATALOGO = ["Docce", "Lavatrici", "Porte", "Luci", "Universali", "POS", "RFID", "Cambiamonete", "Toelettature", "Distributori", "Speciali", "Gettoni e Tessere", "Servizi", "Ricambi"];

// [codice, categoria, nome, link sul sito]
const CATALOGO_RAW = [
  ["DOC-001", "Docce", "1 DOCCIA - Gettoniera multimoneta + pausa + elettrovalvola 12Vcc (per esterni)", "gettoniere-per-docce/gettoniera-per-1-doccia-a-12vcc-per-esterni"],
  ["DOC-002", "Docce", "1 DOCCIA – Gettoniera con Moneta o Gettone, funzione Pausa ed elettrovalvola 12Vcc", "gettoniere-per-docce/gettoniera-mono-moneta-per-comando-di-1-doccia-elettrovalvola-12vcc-inclusa"],
  ["DOC-003", "Docce", "1 DOCCIA – Gettoniera multimoneta con apertura porta e comando doccia", "gettoniere-per-docce/1-doccia-gettoniera-multimoneta-per-1-doccia-apertura-porta"],
  ["DOC-004", "Docce", "1 DOCCIA – Gettoniera multimoneta con elettrovalvola 12Vcc e funzione Pausa", "gettoniere-per-docce/1-doccia-gettoniera-multi-moneta-elettrovalvola-12vcc"],
  ["DOC-005", "Docce", "1 DOCCIA – Gettoniera multimoneta con elettrovalvola 12Vcc, controllo a tempo", "gettoniere-per-docce/1-doccia-gettoniera-multimoneta-elettrovalvola-12vcc"],
  ["DOC-006", "Docce", "1 DOCCIA – Gettoniera multimoneta con Lettore RFID, ricarica tessere integrata, Pausa ed elettrovalvola 12Vcc", "gettoniere-per-docce/gettoniera-multimoneta-per-doccia-lettore-rfid-con-elettrovalvola"],
  ["DOC-007", "Docce", "1 DOCCIA – Gettoniera multimoneta con Pausa ed elettrovalvola 12Vcc", "gettoniere-per-docce/gettoniera-per-docce-con-elettrovalvola"],
  ["DOC-008", "Docce", "1 DOCCIA – Gettoniera multimoneta in box ABS con elettrovalvola 12Vcc", "gettoniere-per-docce/1-doccia-box-in-abs-gettoniera-multimoneta-elettrovalvola-12vcc"],
  ["DOC-009", "Docce", "1 DOCCIA – Lettore di Carte/Braccialetti + pausa + elettrovalvola", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-per-1-doccia-pausa"],
  ["DOC-010", "Docce", "1 DOCCIA – Lettore RFID per Carte e Braccialetti con Elettrovalvola 12 Vcc", "gettoniere-per-docce/copia-di-lettore-di-carte-braccialetti-per-1-doccia-o-altro-dispositivo"],
  ["DOC-011", "Docce", "1 DOCCIA – Lettore RFID per Tessere e Braccialetti con Programmatore Incluso ed Elettrovalvola 12Vcc", "gettoniere-per-docce/lettore-di-carte-braccialetti-programmatore"],
  ["DOC-012", "Docce", "1 DOCCIA – Lettore TOP di Carte/Braccialetti per 1 doccia o altro dispositivo", "lettori-di-carte-e-braccialetti/lettore-top-di-carte-braccialetti-per-1-doccia-o-altro-dispositivo"],
  ["DOC-013", "Docce", "2 DOCCE + POS – Gettoniera multimoneta con POS integrato e elettrovalvole 12 Vcc", "gettoniere-per-docce/2-docce-gettoniera-multimoneta-con-pos-integrato-e-elettrovalvole-12-vcc"],
  ["DOC-014", "Docce", "2 DOCCE - Gettoniera + Lettore di carte/braccialetti ricaricabili + elettrovalvole - BOX in ABS", "gettoniere-per-docce/2-docce-gettoniera-lettore-di-carte-braccialetti-ricaricabili-elettrovalvole"],
  ["DOC-015", "Docce", "2 DOCCE - Gettoniera + Lettore di carte/braccialetti ricaricabili + PAUSE SMART + elettrovalvole - BOX in ABS", "gettoniere-per-docce/2-docce-gettoniera-lettore-di-carte-braccialetti-ricaricabili-pause-smart-elettrovalvole"],
  ["DOC-016", "Docce", "2 DOCCE - Gettoniera mono moneta + pausa + elettrovalvole 12Vcc", "gettoniere-per-docce/gettoniera-mono-moneta-per-2-docce-funzione-di-arresto-pausa-docce"],
  ["DOC-017", "Docce", "2 DOCCE - Gettoniera multimoneta + lettore di tessere RFID + elettrovalvole - BOX in Ferro", "gettoniere-per-docce/2-docce-gettoniera-multimoneta-lettore-di-tessere-rfid-elettrovalvole-box-in-ferro"],
  ["DOC-018", "Docce", "2 DOCCE - Lettore di carte/braccialetti ricaricabili + PAUSE SMART + elettrovalvole", "gettoniere-per-docce/2-docce-lettore-di-carte-braccialetti-ricaricabili-elettrovalvole-per-esterni"],
  ["DOC-019", "Docce", "2 DOCCE – Gettoniera monete + RFID con Pausa SMART - BOX in acciaio", "gettoniere-per-docce/2-docce-box-acciaio-gettoniera-tessere-pause-elettrovalvole"],
  ["DOC-020", "Docce", "2 DOCCE – Gettoniera monete + RFID ricaricabile - BOX in acciaio", "gettoniere-per-docce/2-docce-box-acciaio-gettoniera-lettore-di-carte-braccialetti-ricaricabili-elettrovalvole"],
  ["DOC-021", "Docce", "2 DOCCE – Gettoniera multimoneta con elettrovalvole a 12 Vcc", "gettoniere-per-docce/gettoniera-multimoneta-per-2-docce"],
  ["DOC-022", "Docce", "2 DOCCE – Gettoniera multimoneta con funzione PAUSA ed elettrovalvole 12 Vcc", "gettoniere-per-docce/copia-di-2-docce-gettoniera-multi-moneta-pausa-elettrovalvole-12vcc"],
  ["DOC-023", "Docce", "2 DOCCE – Gettoniera multimoneta con PAUSE SMART ed elettrovalvole 12 Vcc", "gettoniere-per-docce/gettoniera-multimoneta-per-2-docce-funzione-di-arresto-pausa-docce"],
  ["DOC-024", "Docce", "2 DOCCE – Lettore RFID per Docce Temporizzate con Tessere Ricaricabili", "gettoniere-per-docce/lettore-di-carte-braccialetti-per-2-docce-o-dispositivi"],
  ["DOC-025", "Docce", "3 DOCCE + POS – Gettoniera multimoneta con elettrovalvole 12 Vcc", "gettoniere-per-docce/3-docce-pos-gettoniera-multimoneta-con-elettrovalvole-12-vcc"],
  ["DOC-026", "Docce", "3 DOCCE – Gettoniera multimoneta + Lettore RFID con ricarica da gettoniera + PAUSA SMART + elettrovalvole 12Vcc", "gettoniere-per-docce/3-docce-gettoniera-lettore-carte-con-funzione-di-ricarica-da-gettoniera-pause-smart-elettrovalvole-12vcc"],
  ["DOC-027", "Docce", "3 DOCCE – Gettoniera multimoneta + Lettore RFID con ricarica da gettoniera + Programmatore di carte", "gettoniere-per-docce/gettoniera-lettore-carte-per-3-docce-completa-di-programmatore"],
  ["DOC-028", "Docce", "3 DOCCE – Gettoniera multimoneta + Lettore RFID con ricarica diretta da gettoniera + elettrovalvole 12 Vcc", "gettoniere-per-docce/gettoniera-lettore-carte-per-3-docce-ricarica-da-gettoniera"],
  ["DOC-029", "Docce", "3 DOCCE – Gettoniera multimoneta con elettrovalvole 12 Vcc", "gettoniere-per-docce/gettoniera-multimoneta-per-3-docce"],
  ["DOC-030", "Docce", "3 DOCCE – Gettoniera multimoneta con PAUSA SMART ed elettrovalvole 12 Vcc", "gettoniere-per-docce/gettoniera-multimoneta-per-3-docce-funzione-di-arresto-pausa-docce"],
  ["DOC-031", "Docce", "3 DOCCE – Lettore di Carte, Braccialetti e Portachiavi RFID ricaricabili", "gettoniere-per-docce/lettore-di-carte-braccialetti-per-3-docce-o-dispositivi"],
  ["DOC-032", "Docce", "3 DOCCE – Lettore RFID ricaricabile con PAUSA SMART e elettrovalvole 12 Vcc", "gettoniere-per-docce/3-docce-lettore-di-carte-braccialetti-ricaricabili-pause-smart-elettrovalvole"],
  ["DOC-033", "Docce", "4 DOCCE + POS – Gettoniera multimoneta con elettrovalvole 12 Vcc", "gettoniere-per-docce/4-docce-pos-gettoniera-multimoneta-con-elettrovalvole-12-vcc"],
  ["DOC-034", "Docce", "4 docce - Lettore di Carte/Braccialetti", "gettoniere-per-docce/lettore-di-carte-braccialetti-per-4-docce-o-dispositivi"],
  ["DOC-035", "Docce", "4 DOCCE – Gettoniera multimoneta + Lettore carte con ricarica da gettoniera + PAUSE SMART + elettrovalvole 12Vcc", "gettoniere-per-docce/gettoniera-lettore-carte-per-4-docce-ricarica-da-gettoniera-pause"],
  ["DOC-036", "Docce", "4 DOCCE – Gettoniera multimoneta + Lettore carte RFID con ricarica da gettoniera + elettrovalvole 12Vcc", "gettoniere-per-docce/gettoniera-lettore-carte-per-4-docce-con-ricarica-da-gettoniera"],
  ["DOC-037", "Docce", "4 DOCCE – Gettoniera multimoneta con elettrovalvole 12 Vcc", "gettoniere-per-docce/copia-di-gettoniera-multimoneta-per-4-docce"],
  ["DOC-038", "Docce", "4 DOCCE – Gettoniera multimoneta con PAUSA SMART + Elettrovalvole 12Vcc incluse", "gettoniere-per-docce/gettoniera-multimoneta-per-4-docce-funzione-di-arresto-pausa-docce"],
  ["DOC-039", "Docce", "4 DOCCE – Lettore di Carte / Braccialetti RFID + Pause SMART + Elettrovalvole", "gettoniere-per-docce/4-docce-lettore-di-carte-braccialetti-rfid-pause-smart-elettrovalvole"],
  ["DOC-040", "Docce", "4 DOCCE – Lettore di Carte/Braccialetti RFID + Elettrovalvole", "gettoniere-per-docce/4-docce-lettore-di-carte-braccialetti-rfid-elettrovalvole"],
  ["DOC-041", "Docce", "4 DOCCE – Lettore RFID per Carte/Braccialetti + Programmatore + Elettrovalvole", "gettoniere-per-docce/lettore-di-carte-braccialetti-per-4-docce-o-dispositivi-programmatore"],
  ["DOC-042", "Docce", "5 DOCCE – Gettoniera multimoneta con elettrovalvole 12 Vcc", "gettoniere-per-docce/gettoniera-per-5-docce-completa-di-elettrovalvole"],
  ["DOC-043", "Docce", "5 DOCCE – Gettoniera multimoneta con Lettore RFID e funzione Pausa", "gettoniere-per-docce/5-docce-gettoniera-multimoneta-lettore-rfid-pause-smart"],
  ["DOC-044", "Docce", "5 DOCCE – Gettoniera multimoneta con Pausa ed elettrovalvole 12 Vcc", "gettoniere-per-docce/5-docce-gettoniera-multimoneta-pause-smart-elettrovalvole-12vcc"],
  ["DOC-045", "Docce", "5 DOCCE – Lettore di Carte / Braccialetti RFID con Elettrovalvole", "gettoniere-per-docce/5-docce-lettore-di-carte-braccialetti-rfid-elettrovalvole"],
  ["DOC-046", "Docce", "5 DOCCE – Lettore RFID ricaricabile con funzione Pausa + Elettrovalvole 12Vcc", "gettoniere-per-docce/5-docce-lettore-di-carte-braccialetti-ricaricabili-pause-smart-elettrovalvole"],
  ["DOC-047", "Docce", "6 DOCCE + POS – Gettoniera multimoneta con pagamento elettronico e 6 elettrovalvole 12Vcc", "gettoniere-per-docce/gettoniera-6-docce-pos-monete-elettrovalvole"],
  ["DOC-048", "Docce", "6 DOCCE e 4 PHON – Lettore di Carte/Braccialetti", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-per-6-docce-e-4-phon"],
  ["DOC-049", "Docce", "6 DOCCE – Gettoniera multimoneta con elettrovalvole 12 Vcc", "gettoniere-per-docce/gettoniera-per-6-docce-completa-di-elettrovalvole"],
  ["DOC-050", "Docce", "6 DOCCE – Gettoniera multimoneta con Lettore RFID e ricarica tessere integrata", "gettoniere-per-docce/6-docce-gettoniera-multimoneta-lettore-rfid-tessere-ricaricabili-dalla-gettoniera"],
  ["DOC-051", "Docce", "6 DOCCE – Gettoniera multimoneta con Pausa ed elettrovalvole 12 Vcc", "gettoniere-per-docce/6-docce-gettoniera-multimoneta-pause-smart-elettrovalvole-12vcc"],
  ["DOC-052", "Docce", "6 DOCCE – Lettore RFID Carte e Braccialetti + Funzione Pausa + 6 Elettrovalvole 12Vcc", "gettoniere-per-docce/copia-di-6-docce-lettore-di-carte-braccialetti-rfid-pause-smart-elettrovalvole"],
  ["DOC-053", "Docce", "6 DOCCE – Lettore RFID per Carte e Braccialetti Ricaricabili + 6 Elettrovalvole 12Vcc", "gettoniere-per-docce/lettore-di-carte-braccialetti-rfid-per-6-dispositivi-con-uscite-a-12vcc-elettrovalvole"],
  ["DOC-054", "Docce", "8 DOCCE – Gettoniera elettronica professionale con doppio lettore monete", "gettoniere-per-docce/gettoniera-per-8-docce-completa-di-elettrovalvole"],
  ["DOC-055", "Docce", "8 DOCCE – Gettoniera multimoneta con funzione PAUSA ed elettrovalvole 12 Vcc", "gettoniere-per-docce/copia-di-gettoniera-per-8-docce-pausa-completa-di-elettrovalvole"],
  ["DOC-056", "Docce", "8 DOCCE – Gettoniera multimoneta con Lettore RFID e elettrovalvole 12 Vcc", "gettoniere-per-docce/gettoniera-lettore-di-carte-braccialetti-per-8-docce"],
  ["DOC-057", "Docce", "8 DOCCE – Gettoniera multimoneta con Lettore RFID, funzione Pausa ed elettrovalvole 12 Vcc", "gettoniere-per-docce/8-docce-gettoniera-multimoneta-lettore-di-cartebraccialetti-pause-elettrovalvole-12vcc"],
  ["DOC-058", "Docce", "8 DOCCE – Lettore di Carte / Braccialetti RFID + Elettrovalvole 12Vcc", "gettoniere-per-docce/8-docce-lettore-di-carte-braccialetti-rfid-elettrovalvole"],
  ["DOC-059", "Docce", "8 DOCCE – Lettore di Carte / Braccialetti RFID + Pause + Elettrovalvole", "gettoniere-per-docce/8-docce-lettore-di-carte-braccialetti-rfid-pause-smart-elettrovalvole"],
  ["DOC-060", "Docce", "10 DOCCE – Gettoniera multimoneta con 10 uscite 12Vcc + elettrovalvole incluse", "gettoniere-per-docce/10-docce-gettoniera-multimoneta-elettrovalvole-12vcc"],
  ["DOC-061", "Docce", "10 DOCCE – Gettoniera multimoneta con PAUSE + Elettrovalvole 12Vcc", "gettoniere-per-docce/10-docce-gettoniera-multimoneta-con-pause-elettrovalvole-12vcc"],
  ["DOC-062", "Docce", "10 DOCCE – Lettore di Carte / Braccialetti RFID + Elettrovalvole 12Vcc", "gettoniere-per-docce/10-docce-lettore-di-carte-braccialetti-rfid-elettrovalvole"],
  ["DOC-063", "Docce", "12 DOCCE – Gettoniera multimoneta professionale + Elettrovalvole 12Vcc", "gettoniere-per-docce/gettoniera-per-12-docce-con-elettrovalvole-incluse"],
  ["DOC-064", "Docce", "Gettoniera per doccia a moneta con pausa (1 doccia, elettrovalvola 12V)", "gettoniere-per-docce/gettoniera-doccia-moneta-pausa-elettrovalvola-12v"],
  ["DOC-065", "Docce", "Lettore RFID a Basso Consumo per Tessere e Braccialetti con Elettrovalvola ad Impulsi 4,5 Vcc", "gettoniere-per-docce/lettore-di-tesserebraccialetti-per-comando-elettrovalvola-ad-impulsi"],
  ["DOC-066", "Docce", "Lettore RFID opzionale per gettoniere docce – Carte, Braccialetti e Portachiavi ricaricabili", "gettoniere-per-docce/lettore-di-carte-braccialetti-opzionale-per-gettoniere-per-docce"],
  ["LAV-001", "Lavatrici", "1 LAVATRICE + 1 ASCIUGATRICE – Tessere ricaricabili autonomamente + SW gestione remota", "lavanderie-lavatrici-asciugatrici/lavatrice-asciugatrice-con-tessere-ricaricabili-autonomamente-sw-per-gestione-in-remoto-delle-macchine-e-dei-clienti"],
  ["LAV-002", "Lavatrici", "1 LAVATRICE domestica – Gettoniera con staffe di fissaggio a parete (max 1900W)", "lavanderie-lavatrici-asciugatrici/gettoniera-per-lavatrice-domestica-con-staffe-di-fissaggio-a-parete-controllo-a-tempo-per-bb-e-strutture-ricettive"],
  ["LAV-003", "Lavatrici", "1 LAVATRICE domestica – Gettoniera elettronica (max 1900W)", "lavanderie-lavatrici-asciugatrici/gettoniera-per-lavatrice-domestica"],
  ["LAV-004", "Lavatrici", "1 LAVATRICE o asciugatrice trifase – Gettoniera elettronica (fino a 6000W)", "lavanderie-lavatrici-asciugatrici/gettoniera-elettronica-per-una-lavatrice-o-asciugatrice-trifase-sino-a-6000w"],
  ["LAV-005", "Lavatrici", "1 LAVATRICE o asciugatrice – Gettoniera con SELETTORE (offerta)", "offerte-last-minute/gettoniera-per-lavatrice-asciugatrice-con-selettore"],
  ["LAV-006", "Lavatrici", "1 LAVATRICE o asciugatrice – Gettoniera con SELETTORE (una o l'altra)", "lavanderie-lavatrici-asciugatrici/gettoniera-per-asciugatrice-lavasciuga-con-selettore"],
  ["LAV-007", "Lavatrici", "1 LAVATRICE o asciugatrice – Gettoniera elettronica a tempo (fino a 3500W)", "lavanderie-lavatrici-asciugatrici/gettoniera-elettronica-per-lavatrice-asciugatrice-lavasciuga-domestica"],
  ["LAV-008", "Lavatrici", "1 LAVATRICE o asciugatrice – Gettoniera multimoneta + Lettore RFID con ricarica integrata", "lavanderie-lavatrici-asciugatrici/gettoniera-multimoneta-lettore-rfid-autoricarica-per-lavatrice-o-asciugatrice"],
  ["LAV-009", "Lavatrici", "1 LAVATRICE o asciugatrice – Lettore di Carte con selettore", "lavanderie-lavatrici-asciugatrici/lettore-di-carte-con-selettore-per-lavatrice-o-asciugatrice"],
  ["LAV-010", "Lavatrici", "1 LAVATRICE o asciugatrice – Lettore tessere RFID controllo a tempo (230Vac 3500W)", "lavanderie-lavatrici-asciugatrici/lettore-di-carte-braccialetti-per-una-lavatrice-o-asciugatrice-230vac-3500w"],
  ["LAV-011", "Lavatrici", "1 LAVATRICE professionale – Dispositivo Cashless con POS contactless per avvio", "lavanderie-lavatrici-asciugatrici/dispositivo-cashless-pos-contactless-avvio-lavatrici-professionali"],
  ["LAV-012", "Lavatrici", "1 LAVATRICE professionale – Dispositivo per pagamento CASHLESS", "lavanderie-lavatrici-asciugatrici/dispositivo-per-pagamento-cashless-per-lavatrice-o-asciugatrice-professionale"],
  ["LAV-013", "Lavatrici", "1 LAVATRICE – QRPay sistema cashless a QR code", "lavanderie-lavatrici-asciugatrici/sistema-di-pagamento-con-carta-di-credito-per-lavatrice-o-asciugatrice-domestica-novita"],
  ["LAV-014", "Lavatrici", "1 LAVATRICE/asciugatrice industriale – Gettoniera con avvio contatto NA", "lavanderie-lavatrici-asciugatrici/gettoniera-per-lavatrice-e-asciugatrice-industriali-con-avvio-con-contatto-na"],
  ["LAV-015", "Lavatrici", "1 MACCHINA trifase – Gettoniera per mangani, essiccatoi e motori industriali (6000W)", "lavanderie-lavatrici-asciugatrici/gettoniera-elettronica-per-lavatrice-o-asciugatrice-trifase-controllo-a-tempo-per-macchine-fino-a-6000w"],
  ["LAV-016", "Lavatrici", "2 LAVATRICI professionali – Gettoniera a monete + RFID con avvio START", "lavanderie-lavatrici-asciugatrici/2-macchine-gettoniera-multimoneta-lettore-di-tessere-ricaricabili-dalla-gettoniera-avvio-lavatrici-professionali"],
  ["LAV-017", "Lavatrici", "2 LAVATRICI/asciugatrici – Lettore RFID temporizzato a crediti", "lavanderie-lavatrici-asciugatrici/2-lavatrici-asciugatrici-lettore-di-tessere-braccialetti-ricaricabili-per-2-dispositivi"],
  ["LAV-018", "Lavatrici", "2 MACCHINE (lavatrice + asciugatrice) – Gettoniera a gettoni mod. TANDEM (max 3500W cad.)", "lavanderie-lavatrici-asciugatrici/gettoniera-a-gettoni-per-lavatrice-e-asciugatrice-max-3500w-cada-mod-tandem"],
  ["LAV-019", "Lavatrici", "2 MACCHINE (lavatrice + asciugatrice) – Gettoniera Cashless con POS contactless", "lavanderie-lavatrici-asciugatrici/it-lavanderielavatrici-asciugatrici-gettoniera-cashless-pos-2-macchine-lavatrice-asciugatrice-pagamento-contactless-a-tempo"],
  ["LAV-020", "Lavatrici", "2 MACCHINE (lavatrice + asciugatrice) – Gettoniera multimoneta + Lettore RFID con ricarica", "lavanderie-lavatrici-asciugatrici/gettoniera-multimoneta-lettore-rfid-ricarica-automatica-per-lavatrice-e-asciugatrice"],
  ["LAV-021", "Lavatrici", "2 MACCHINE (lavatrice + asciugatrice) – Gettoniera multimoneta mod. TANDEM (max 3500W cad.)", "lavanderie-lavatrici-asciugatrici/gettoniera-multi-moneta-per-lavatrice-e-asciugatrice-max-3500w-cada"],
  ["LAV-022", "Lavatrici", "3 LAVATRICI o asciugatrici domestiche – Gettoniera a tempo", "lavanderie-lavatrici-asciugatrici/gettoniera-per-3-lavatrici-domestiche-o-2-lavatrici-e-1-asciugatrice"],
  ["LAV-023", "Lavatrici", "4 LAVATRICI domestiche – Gettoniera multimoneta (o 2 lavatrici e 2 asciugatrici)", "lavanderie-lavatrici-asciugatrici/gettoniera-per-4-lavatrici-domestiche-o-2-lavatrici-e-2-asciugatrici-nuova"],
  ["LAV-024", "Lavatrici", "4 LAVATRICI o asciugatrici – Gettoniera Cashless con POS contactless", "lavanderie-lavatrici-asciugatrici/gettoniera-cashless-pos-4-lavatrici-asciugatrici-pagamento-contactless"],
  ["LAV-025", "Lavatrici", "4 LAVATRICI – Gettoniera + Carte RFID ricaricabili", "lavanderie-lavatrici-asciugatrici/gettoniera-lettore-di-carte-per-4-lavatrici"],
  ["LAV-026", "Lavatrici", "4 LAVATRICI – Lettore di Carte/Braccialetti (o 2 lavatrici e 2 asciugatrici)", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-per-4-lavatrici-o-2-lavatrici-e-2-asciugatrici"],
  ["LAV-027", "Lavatrici", "4 LAVATRICI – Lettore di Carte/Braccialetti + Programmatore", "lavanderie-lavatrici-asciugatrici/lettore-di-carte-braccialetti-per-4-lavatrici-o-2-lavatrici-e-2-asciugatrici-programmatore"],
  ["LAV-028", "Lavatrici", "4 MACCHINE con contatto NA – Gettoniera + Lettore RFID professionale", "lavanderie-lavatrici-asciugatrici/gettoniera-lettore-di-tessere-per-avvio-macchine-con-contatto-na-tessere-ricaricabili-dalla-stessa-gettoniera"],
  ["LAV-029", "Lavatrici", "5 LAVATRICI o asciugatrici – Sistema RFID con 50 card incluse", "lavanderie-lavatrici-asciugatrici/5-lavatrici-lettore-di-carte-braccialetti-rfid"],
  ["LAV-030", "Lavatrici", "6 LAVATRICI domestiche – Gettoniera (o 3 lavatrici e 3 asciugatrici)", "lavanderie-lavatrici-asciugatrici/gettoniera-per-6-lavatrici-o-3-lavatrici-e-3-asciugatrici"],
  ["LAV-031", "Lavatrici", "6 LAVATRICI domestiche – Gettoniera multimoneta + Pagamenti digitali QR", "lavanderie-lavatrici-asciugatrici/6-lavatrici-domestiche-gettoniera-cashless-o-3-lavatrici-e-3-asciugatrici"],
  ["LAV-032", "Lavatrici", "6 LAVATRICI industriali – Gettoniera (o 3 lavatrici e 3 asciugatrici)", "lavanderie-lavatrici-asciugatrici/gettoniera-per-6-lavatrici-industriali-o-3-lavatrici-e-3-asciugatrici"],
  ["LAV-033", "Lavatrici", "6 LAVATRICI industriali – Gettoniera multimoneta + Pagamenti digitali QR", "lavanderie-lavatrici-asciugatrici/gettoniera-carte-di-credito-per-6-lavatrici-domestiche-o-3-lavatrici-e-3-asciugatrici"],
  ["LAV-034", "Lavatrici", "8 LAVATRICI – Gettoniera (o 4 lavatrici e 4 asciugatrici)", "lavanderie-lavatrici-asciugatrici/gettoniera-per-8-lavatrici"],
  ["LAV-035", "Lavatrici", "8 LAVATRICI – Gettoniera + Lettore carte ricaricabili dalla gettoniera", "lavanderie-lavatrici-asciugatrici/gettoniera-lettore-di-carte-per-8-lavatrici-o-4-lav-e-4-asc"],
  ["LAV-036", "Lavatrici", "10 LAVATRICI industriali con avvio NA – Gettoniera multimoneta", "lavanderie-lavatrici-asciugatrici/10-lavatrici-industriali-con-avvio-na-gettoniera-multimoneta"],
  ["POR-001", "Porte", "1 PORTA – Dispositivo contactless con POS per tornelli ed elettroserrature", "accessi-automatici/dispo"],
  ["POR-002", "Porte", "1 PORTA – Gettoniera apriporta + Lettore carte/ciondoli + 50 ciondoli RFID", "accessi-automatici/gettoniera-apriporta-lettore-di-carte-o-ciondoli-50-ciondoli-rfid"],
  ["POR-003", "Porte", "1 PORTA – Gettoniera apriporta + Lettore carte/ciondoli + Kit elettroserratura", "accessi-automatici/gettoniera-lettore-di-carte-apriporta-kit-elettroserratura"],
  ["POR-004", "Porte", "1 PORTA – Gettoniera apriporta con serratura e sensore di presenza", "accessi-automatici/gettoniera-multimomoneta-apriporta-con-kit-serratura-e-sensore-presenza"],
  ["POR-005", "Porte", "1 PORTA – Gettoniera apriporta monete + gettoni con KIT serratura, sensore e molla", "accessi-automatici/gettoniera-apriporta-a-monete-gettoni-con-kit-serratura-sensore-presenza-molla-chiudi-porta"],
  ["POR-006", "Porte", "1 PORTA – Gettoniera monomoneta apriporta (per esterno)", "accessi-automatici/gettoniera-monomoneta-apriporta-per-esterno"],
  ["POR-007", "Porte", "1 PORTA – Gettoniera monomoneta apriporta con uscita 12Vcc", "accessi-automatici/gettoniera-monomoneta-apriporta-con-uscita-a-12vcc"],
  ["POR-008", "Porte", "1 PORTA – Gettoniera multimoneta + Lettore RFID (ascensori, apriporte, sbarre, cancelli)", "accessi-automatici/gettoniera-multimoneta-lettore-rfid-con-ricarica-per-ascensori-apriporte-apri-sbarre-o-cancelli"],
  ["POR-009", "Porte", "1 PORTA – Gettoniera multimoneta 230Vac / uscita NA con cover e display esterno", "gettoniere-apriporta/apriporta-gettoniera-multimoneta-ingresso-230vac-uscita-na-con-cover-e-display-esterno"],
  ["POR-010", "Porte", "1 PORTA – Gettoniera multimoneta apriporta (per esterno)", "accessi-automatici/gettoniera-multimonetao-apriporta-per-esterno"],
  ["POR-011", "Porte", "1 PORTA – Gettoniera multimoneta con display per serrature 12Vcc", "accessi-automatici/gettoniera-multimoneta-apriporta-con-display-per-serrature-a-12vcc"],
  ["POR-012", "Porte", "1 PORTA – Gettoniera multimoneta con display, contatto NA (ingresso 12Vcc)", "accessi-automatici/gettoniera-multimoneta-apriporta-con-display-per-serrature-contatto-na"],
  ["POR-013", "Porte", "1 PORTA – Gettoniera multimoneta con display, contatto NA (ingresso 230Vac)", "accessi-automatici/gettoniera-multimoneta-apriporta-con-display-per-serrature-contatto-na-ingresso-230vac"],
  ["POR-014", "Porte", "1 PORTA – Gettoniera multimoneta con elettroserratura (per esterni)", "accessi-automatici/gettoniera-multi-moneta-apriporta-con-elettroserratura-per-esterni"],
  ["POR-015", "Porte", "1 PORTA – Lettore Carte RFID con uscita NA (porte, tornelli, sbarre)", "accessi-automatici/lettore-di-carte-rfid-con-uscita-na-per-apertura-porte-tornelli-sbarre-contatto-normale-aperto"],
  ["POR-016", "Porte", "1 PORTA – Lettore Carte/Braccialetti COMPATTO con display, uscita 12Vcc", "accessi-automatici/lettore-di-carte-braccialetti-apriporta-compatto-con-uscita-12vcc"],
  ["POR-017", "Porte", "1 PORTA – Lettore Carte/Braccialetti COMPATTO senza display, uscita 12Vcc", "accessi-automatici/lettore-di-carte-braccialetti-apriporta-compatto-senza-display-con-uscita-12vcc"],
  ["POR-018", "Porte", "1 PORTA – Lettore carte/portachiavi RFID per apriporta", "accessi-automatici/lettore-di-carte-portachiavi-rfid-per-apriporta"],
  ["POR-019", "Porte", "1 PORTA – Lettore di Carte/Braccialetti apriporta o sbarra, contatto NA", "accessi-automatici/lettore-di-carte-braccialetti-apriporta-o-sbarra-con-contatto-na"],
  ["POR-020", "Porte", "1 PORTA – Lettore tessere/braccialetti apriporta (non scala credito)", "accessi-automatici/lettore-di-tessere-apriporta-non-scala-credito-dalla-tessera"],
  ["POR-021", "Porte", "1 PORTA – Lettore tessere/braccialetti apriporta (scala credito)", "accessi-automatici/lettore-di-tesserebraccialetti-apriporta"],
  ["POR-022", "Porte", "1 PORTA – Lettore tessere/ciondoli (non scala credito) + 100 ciondoli", "accessi-automatici/lettore-di-tesserebraccialetti-apriporta-non-scala-credito-dalla-tessera"],
  ["POR-023", "Porte", "1 PORTA – Lettore tessere/ciondoli (non scala credito) + 100 tessere", "accessi-automatici/lettore-di-tesserebraccialetti-apriporta-non-scala-credito-dalla-tessera-100-tessere"],
  ["POR-024", "Porte", "1 PORTA – Paga e Apri, apriporta a pagamento con codice QR", "accessi-automatici/paga-e-apri-l-apriporta-a-pagamento-con-codice-qr"],
  ["POR-025", "Porte", "1 PORTA – Sistema sblocco porta con QR e PIN su scontrino", "accessi-automatici/sistema-sblocco-porta-con-qr-e-pin-su-scontrino"],
  ["POR-026", "Porte", "1 SBARRA – Gettoniera multimoneta apri sbarra per esterni (senza display)", "accessi-automatici/apri-sbarra-per-esterni-gettoniera-multimoneta-senza-display-esterno"],
  ["POR-027", "Porte", "2 PORTE – Gettoniera multimoneta (elettroserrature)", "accessi-automatici/gettoniera-multimoneta-per-2-porte-elettroserrature"],
  ["POR-028", "Porte", "2 PORTE – Gettoniera multimoneta + POS 12V", "accessi-automatici/gettoniera-pos-per-apertura-di-2-porte-multimoneta-12v-sistema-professionale"],
  ["POR-029", "Porte", "2 PORTE – Lettore di tessere/braccialetti ricaricabili", "accessi-automatici/2-porte-lettore-di-tesserebraccialetti-ricaricabili-per-2-apriporta"],
  ["POR-030", "Porte", "3 PORTE – Gettoniera a monete + cashless", "accessi-automatici/gettoniera-a-monete-cashless-per-3-porte-elettroserrature"],
  ["POR-031", "Porte", "3 PORTE – Gettoniera multimoneta (elettroserrature 12Vcc)", "accessi-automatici/copia-di-gettoniera-multimoneta-per-3-porte"],
  ["POR-032", "Porte", "3 PORTE – Gettoniera multimoneta + POS 12V", "accessi-automatici/gettoniera-pos-3-porte-elettroserrature-multimoneta"],
  ["POR-033", "Porte", "4 PORTE – Gettoniera multimoneta (elettroserrature 12Vcc)", "accessi-automatici/gettoniera-multimoneta-per-4-porte-elettroserrature"],
  ["POR-034", "Porte", "4 PORTE – Gettoniera multimoneta + POS 12V", "accessi-automatici/gettoniera-pos-per-apertura-di-4-porte-multimoneta-12v-sistema-professionale"],
  ["POR-035", "Porte", "4 PORTE – KEY39 Multi apertura con codice QR e gestione cloud", "accessi-automatici/key39-multi-sistema-intelligente-per-lapertura-di-4-porte-con-codice-qr-e-gestione-cloud"],
  ["POR-036", "Porte", "6 PORTE – Gettoniera multimoneta (elettroserrature)", "accessi-automatici/gettoniera-multimoneta-per-6-porte-elettroserrature"],
  ["POR-037", "Porte", "KEY39 Plus – Apriporta con QR + SW gestionale per palestre", "accessi-automatici/apriporta-sw-gestionale-per-key39-per-palestre-e-centri-fitness"],
  ["POR-038", "Porte", "KEY39 – Check-in a distanza con codice QR (WiFi o LAN)", "accessi-automatici/key39-lapriporta-con-codice-qr"],
  ["POR-039", "Porte", "KIT serratura + sensore di presenza", "accessi-automatici/kit-con-elettroserratura-sensore-di-presenza-e-spia-bagno-occupato"],
  ["POR-040", "Porte", "KIT serratura + sensore di presenza + spia occupato + molla richiamo", "accessi-automatici/kit-completo-di-elettroserratura-sensore-di-presenza-spia-bagno-occupato-molla-di-richiamo-porta"],
  ["POR-041", "Porte", "Lettore di Carte/Braccialetti con uscita 12Vcc (valvole, elettroserrature)", "accessi-automatici/lettore-di-carte-braccialetti-12vcc"],
  ["POR-042", "Porte", "Lettore di Carte/Braccialetti con uscita 12Vcc – mod. TOP", "accessi-automatici/lettore-di-carte-braccialetti-con-uscita-12vcc-per-valvole-elettroserrature-nuovo-mod-top"],
  ["LUC-001", "Luci", "1 IMPIANTO LUCI LED – Gettoniera elettronica temporizzata (230V 3500W)", "gettoniere-per-luci/gettoniera-elettronica-temporizzata-per-impianto-luci-a-led-230v-3500w"],
  ["LUC-002", "Luci", "1 IMPIANTO LUCI – Dispositivo cashless con POS contactless (3500W)", "gettoniere-per-luci/cashless-nayax-pos-lighting-3500w"],
  ["LUC-003", "Luci", "1 IMPIANTO LUCI – Gettoniera (max 1900W)", "gettoniere-per-luci/gettoniera-per-luci-max-1900w"],
  ["LUC-004", "Luci", "1 IMPIANTO LUCI – Gettoniera con funzione di preavviso (230V 3500W)", "gettoniere-per-luci/gettoniera-multimoneta-per-1-impianto-luci-con-funzione-di-preavviso-max-3500w-per-esterni"],
  ["LUC-005", "Luci", "1 IMPIANTO LUCI – Gettoniera multimoneta + Lettore RFID (max 3500W)", "gettoniere-per-luci/gettoniera-multimoneta-lettore-rfid-autoricarica-per-accensione-impianti-luci"],
  ["LUC-006", "Luci", "2 IMPIANTI LUCE – Gettoniera con uscite NA (max 3500W cad.)", "gettoniere-per-luci/gettoniera-per-2-impianti-luce-max-3500w-cada"],
  ["LUC-007", "Luci", "2 IMPIANTI LUCE – Gettoniera mono moneta (max 1500W cad.)", "gettoniere-per-luci/gettoniera-mono-moneta-per-2-impianti-luce-max-1500w-cada"],
  ["LUC-008", "Luci", "2 IMPIANTI LUCE – Gettoniera multimoneta (max 1500W cad.)", "gettoniere-per-luci/gettoniera-multi-moneta-per-2-impianti-luce-max-1500w-cada"],
  ["LUC-009", "Luci", "2 IMPIANTI LUCE – Gettoniera multimoneta con preavviso (max 3500W cad.)", "gettoniere-per-luci/gettoniera-multimoneta-per-2-impianti-luce-con-lampeggio-x-preavviso"],
  ["LUC-010", "Luci", "3 IMPIANTI LUCE – Gettoniera + Lettore tessere con uscite NA e preavviso", "gettoniere-per-luci/3-impianti-luce-gettoniera-lettore-tessere-con-uscite-na"],
  ["LUC-011", "Luci", "3 IMPIANTI LUCE – Gettoniera multimoneta con lampeggio di preavviso", "gettoniere-per-luci/gettoniera-multimoneta-per-3-impianti-luce-funzione-lampeggio-preavviso"],
  ["LUC-012", "Luci", "3 IMPIANTI LUCE – Gettoniera per 3 gruppi lampade indipendenti (3500W cad.)", "gettoniere-per-luci/gettoniera-per-il-comando-di-3-gruppi-lampade-indipendenti-sino-a-3500w-cada"],
  ["LUC-013", "Luci", "4 IMPIANTI LUCE – Gettoniera Cashless con POS contactless", "gettoniere-per-luci/gettoniera-cashless-con-pos-per-comando-4-impianti-luce-pagamento-contactless-a-tempo"],
  ["LUC-014", "Luci", "4 IMPIANTI LUCE – Gettoniera multimoneta", "gettoniere-per-luci/gettoniera-multi-moneta-per-4-impianti-di-illuminazione"],
  ["LUC-015", "Luci", "4 IMPIANTI LUCE – Gettoniera multimoneta con lampeggio di preavviso", "gettoniere-per-luci/gettoniera-multimoneta-per-4-impianti-luce-funzione-lampeggio-preavviso"],
  ["LUC-016", "Luci", "4 IMPIANTI LUCE – Gettoniera per chiese a doppio impulso", "gettoniere-per-luci/gettoniera-per-chiese-per-4-impianti-luce-per-centraline-domestiche-a-doppio-impulso"],
  ["LUC-017", "Luci", "6 IMPIANTI LUCE – Gettoniera multimoneta + cashless con preavviso", "gettoniere-per-luci/6-impianti-di-illuminazione-gettoniera-elettronica-multimoneta-con-pagamento-cashless-e-con-funzione-di-preavviso-a-lampeggi-prima-dello-spegnimento"],
  ["UNI-001", "Universali", "1 DISPOSITIVO 12Vcc – Gettoniera multimoneta con contatto NA", "gettoniere-a-monete/gettoniera-universale-con-uscita-con-contatto-na-normale-aperto-ingresso-12vcc"],
  ["UNI-002", "Universali", "1 DISPOSITIVO 12Vcc – Gettoniera multimoneta con contatto NA + contatore LCD", "gettoniere-a-monete/gettoniera-multimoneta-con-uscita-con-contatto-na-normale-aperto-contatore-lcd-ingresso-12vcc"],
  ["UNI-003", "Universali", "1 DISPOSITIVO 12Vcc – Gettoniera multimoneta max 2A + Pausa (esterni)", "gettoniere-a-monete/gettoniera-multimoneta-per-dispositivi-a-12vcc-max-2a-pausa-per-esterni"],
  ["UNI-004", "Universali", "1 DISPOSITIVO 12Vcc – Gettoniera multimoneta universale", "gettoniere-a-monete/gettoniera-multimoneta-universale-per-dispositivi-a-12vcc"],
  ["UNI-005", "Universali", "1 DISPOSITIVO 12Vcc – Gettoniera universale", "gettoniere-a-monete/gettoniera-universale-per-dispositivi-a-12vcc"],
  ["UNI-006", "Universali", "1 DISPOSITIVO 12Vcc – Lettore carte ricaricabili + PAUSA + Programmatore", "gettoniere-a-monete/lettore-di-carte-ricaricabili-pausa-con-uscita-a-12vcc-programmatore"],
  ["UNI-007", "Universali", "1 DISPOSITIVO 230V – Gettoniera mono moneta con spina industriale (max 3500W)", "gettoniere-a-monete/gettoniera-mono-moneta-per-dispositivi-a-230v-max-3500w-con-spina-industriale"],
  ["UNI-008", "Universali", "1 DISPOSITIVO 230V – Gettoniera multimoneta (max 3500W)", "gettoniere-a-monete/gettoniera-multi-moneta-per-dispositivi-a-230v-max-3500w"],
  ["UNI-009", "Universali", "1 DISPOSITIVO 230V – Gettoniera multimoneta con funzione BYPASS (max 3500W, interni)", "gettoniere-a-monete/gettoniera-multi-moneta-con-funzione-bypass-per-dispositivi-a-230v-max-3500w-per-interni"],
  ["UNI-010", "Universali", "1 DISPOSITIVO 230V – Gettoniera universale (max 1500W, interni)", "gettoniere-a-monete/gettoniera-universale-per-dispositivi-a-230v-max-1500w-per-interni"],
  ["UNI-011", "Universali", "1 DISPOSITIVO 230V – Gettoniera universale (max 1900W)", "gettoniere-a-monete/gettoniera-universale-per-dispositivi-a-230v-max-1900w"],
  ["UNI-012", "Universali", "1 DISPOSITIVO 230V – Gettoniera universale multimoneta (max 3500W, esterni)", "gettoniere-a-monete/gettoniera-universale-per-dispositivi-a-230v-max-3500w-per-esterni"],
  ["UNI-013", "Universali", "1 DISPOSITIVO trifase – Gettoniera elettronica 380V (fino a 6000W)", "gettoniere-a-monete/gettoniera-elettronica-per-un-dispositivo-380v-trifase-sino-a-6000w"],
  ["UNI-014", "Universali", "1 DISPOSITIVO – Gettoniera multimoneta box ABS, uscita NA", "gettoniere-a-monete/gettoniera-box-in-abs-multimoneta-uscita-na"],
  ["UNI-015", "Universali", "1 DISPOSITIVO – Gettoniera multimoneta con doppio contatto NA (max 20A)", "gettoniere-a-monete/gettoniera-multi-moneta-per-con-doppio-contatto-na-max-20a-di-carico"],
  ["UNI-016", "Universali", "1 DISPOSITIVO – Gettoniera universale avvio macchine con contatto NA (ingresso 230V)", "gettoniere-a-monete/gettoniera-universale-per-avvio-macchine-o-dispositivi-con-contatto-na-ingresso-a-230v"],
  ["UNI-017", "Universali", "1 PHON – Gettoniera multimoneta, timer per asciugacapelli", "gettoniere-a-monete/gettoniera-multimoneta-per-phon"],
  ["UNI-018", "Universali", "2 CONTATTI NA – Gettoniera multimoneta", "gettoniere-a-monete/gettoniera-multimoneta-2-contatti-na"],
  ["UNI-019", "Universali", "2 DISPOSITIVI 230V – Gettoniera mono moneta (max 3500W cad.)", "gettoniere-a-monete/gettoniera-multi-moneta-per-2-dispositivi-a-230v-max-3500w-cada-funzione-di-arresto"],
  ["UNI-020", "Universali", "2 DISPOSITIVI 230V – Gettoniera multimoneta", "gettoniere-a-monete/gettoniera-multimoneta-per-2-dispositivi-a-230v"],
  ["UNI-021", "Universali", "2 DISPOSITIVI 230V – Gettoniera multimoneta con funzione di arresto (max 3500W cad.)", "gettoniere-a-monete/gettoniera-multi-moneta-per-2-dispositivi-a-220v-max-3500w-cada-funzione-di-arresto"],
  ["UNI-022", "Universali", "2 MACCHINE – Gettoniera + Lettore RFID, 2 uscite NA temporizzate", "gettoniere-a-monete/gettoniera-multimoneta-lettore-rfid-per-2-dispositivi-con-ricarica-carte-dalla-gettoniera-uscite-na"],
  ["UNI-023", "Universali", "2 PHON – Gettoniera multimoneta + prese esterne", "gettoniere-a-monete/2-phon-gettoniera-multimoneta-prese-esterne"],
  ["UNI-024", "Universali", "2 PHON – Lettore di Carte/Braccialetti + 2 prese da parete", "gettoniere-a-monete/lettore-di-carte-braccialetti-per-2-phon"],
  ["UNI-025", "Universali", "3 DISPOSITIVI – Gettoniera + Lettore carte con ricarica, uscite NA", "gettoniere-a-monete/3-dispositivi-gettoniera-lettore-carte-con-funzione-di-ricarica-da-gettoniera-uscite-na"],
  ["UNI-026", "Universali", "3 PHON – Gettoniera multimoneta + prese esterne", "gettoniere-a-monete/3-phon-gettoniera-multimoneta-prese-esterne"],
  ["UNI-027", "Universali", "4 DISPOSITIVI 230Vac – Gettoniera (max 3000W cad.)", "gettoniere-a-monete/gettoniera-per-4-dispositivi-elettrici"],
  ["UNI-028", "Universali", "4 DISPOSITIVI 230Vac – Lettore di Carte/Braccialetti (max 3000W cad.)", "lettori-di-carte-e-braccialetti/lettore-di-cartebraccialetti-per-4-dispositivi-a-230vac-max-3000w-cada"],
  ["UNI-029", "Universali", "4 DISPOSITIVI monofase – Gettoniera (fino a 3500W cad.)", "gettoniere-a-monete/gettoniera-per-4-dispositivi-elettrici-monofase-sino-a-3500w-cada"],
  ["UNI-030", "Universali", "5 DISPOSITIVI – Gettoniera multimoneta con contatti NA (max 3500W cad.)", "gettoniere-a-monete/5-dispositivi-gettoniera-multimoneta-con-contatti-na-max-3500-w-cada"],
  ["UNI-031", "Universali", "5 USCITE 12Vcc – Lettore di Carte/Braccialetti RFID", "gettoniere-a-monete/lettore-di-carte-braccialetti-rfid-con-uscite-12vcc"],
  ["UNI-032", "Universali", "8 PRESE di ricarica – Gettoniera", "gettoniere-a-monete/gettoniera-per-8-prese-elettriche-di-ricarica"],
  ["UNI-033", "Universali", "CAVALLI – Dispositivo contactless con POS per lampade asciugatura (max 3500W)", "gettoniere-a-monete/getti-per-cavalli"],
  ["UNI-034", "Universali", "CAVALLI – Gettoniera multimoneta per lavaggio e asciugatura", "gettoniere-a-monete/gettoniera-multimoneta-per-lavaggio-e-asciugatura-cavalli"],
  ["UNI-035", "Universali", "CAVALLI – Gettoniera per lampade asciugatura (max 2000W)", "gettoniere-a-monete/gettoniera-per-lampade-asciugatura-cavallo-max-2000w"],
  ["UNI-036", "Universali", "CAVALLI – Gettoniera per lampade IR 230V (fino a 3500W)", "gettoniere-a-monete/gettoniera-per-lampade-ir-a-230v-con-potenza-sino-a-3500w"],
  ["UNI-037", "Universali", "CAVALLI – Gettoniera per lavaggio con elettrovalvola", "gettoniere-a-monete/gettoniera-per-lavaggio-cavalli-con-elettrovalvola"],
  ["UNI-038", "Universali", "CONDIZIONATORI – Gettoniera (max 1900W)", "gettoniere-a-monete/gettoniera-per-condizionatori-max-2000w"],
  ["UNI-039", "Universali", "MINICAR – Gettoniera con prese di ricarica (230V max 3500W)", "gettoniere-a-monete/gettoniera-con-prese-di-ricarica-per-auto-elettriche-230v-max-3500w"],
  ["UNI-040", "Universali", "MINICAR – Ricarica con pagamento cashless QR", "gettoniere-a-monete/ricarica-minicar-con-pagamento-cashless-pagamento-con-codice-qr"],
  ["UNI-041", "Universali", "POLTRONA MASSAGGI – Gettoniera 230V (max 2000W)", "gettoniere-a-monete/gettoniera-per-poltrona-massaggi-a-220v-max-2000w"],
  ["UNI-042", "Universali", "SAUNA – Dispositivo contactless con POS (fino a 3500W)", "gettoniere-a-monete/dispositivo-contactless-per-sauna-con-pos-nayax-controllo-automatico-a-tempo-fino-a-3500w"],
  ["UNI-043", "Universali", "SAUNA – Gettoniera universale 230V (max 3500W, interni)", "gettoniere-a-monete/gettoniera-universale-per-sauna-a-220v-max-3500w-per-interni"],
  ["POS-001", "POS", "1 DISPOSITIVO – Contactless con POS, controllo carichi fino a 3500W", "dispositivi-cashless/dispositivo-cashless-con-pos-nayax-controllo-carichi-elettrici-fino-a-3500w"],
  ["POS-002", "POS", "1 DISPOSITIVO – QR Pay, aziona un dispositivo elettrico con codice QR", "pagamenti-cashless/qr-pay-aziona-un-dispositivo-elettrico-a-pagamento-con-codice-qr"],
  ["POS-003", "POS", "2 USCITE sequenziali 12Vcc + 230Vac – Gettoniera Cashless con POS", "dispositivi-cashless/gettoniera-pos-2-uscite-sequenziali-12vcc-230vac"],
  ["POS-004", "POS", "12 DISPOSITIVI – Gettoniera + Cashless (230V, max 3500W cad.)", "gettoniere-a-monete/gettoniera-carte-di-credito-paypal-per-12-dispositivi-a-220v-max-3500w-cadauno-novita"],
  ["POS-005", "POS", "Gonfia-gomme con POS cashless e comando elettrovalvola", "dispositivi-cashless/gonfia-gomme-a-pagamento-con-pos"],
  ["RFI-001", "RFID", "ACQUA – Comando pompa con carte RFID a credito", "lettori-di-carte-e-braccialetti/acqua-controllo-lettore-di-carte-rfid-con-credito-a-scalare"],
  ["RFI-002", "RFID", "Gettoniera + Lettore Carte/Braccialetti con uscita NA (avvio macchine lavanderia)", "lettori-di-carte-e-braccialetti/gettoniera-lettore-di-carte-braccialetti-per-avvio-macchine-con-uscita-na-contatto-normale-aperto"],
  ["RFI-003", "RFID", "IMPIANTO ELETTRICO GENERALE – Comando con tessere RFID a credito", "lettori-di-carte-e-braccialetti/acqua-luci-riscaldamanto-sistema-di-comando-con-tessere-rfid-con-credito-a-scalare"],
  ["RFI-004", "RFID", "Lettore Carte/Braccialetti 230Vac 1500W + Programmatore", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-220vac-1500w-programmatore"],
  ["RFI-005", "RFID", "Lettore Carte/Braccialetti 230Vac 3500W + Programmatore", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-230vac-3500w-programmatore"],
  ["RFI-006", "RFID", "Lettore Carte/Braccialetti COMPATTO con uscita NA (avvio macchine o impianti)", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-compatto-con-uscita-na-contatto-normale-aperto"],
  ["RFI-007", "RFID", "Lettore Carte/Braccialetti con contatto NA + Programmatore", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-contatto-na-programmatore"],
  ["RFI-008", "RFID", "Lettore Carte/Braccialetti RFID da incasso, uscita 12Vcc", "lettori-di-carte-e-braccialetti/lettore-di-carte-braccialetti-rfid-da-incasso-uscita-a-12vcc"],
  ["RFI-009", "RFID", "Lettore Tessere RFID per verifica credito", "lettori-di-carte-e-braccialetti/lettore-di-tessere-rfid-per-verifica-credito"],
  ["RFI-010", "RFID", "Lettore Tessere/Braccialetti con pulsante di reset, uscita NA", "lettori-di-carte-e-braccialetti/lettore-di-tesserebraccialetti-con-pulsante-di-reset-uscita-contatto-na"],
  ["RFI-011", "RFID", "Programmatore di tessere RFID", "lettori-di-carte-e-braccialetti/programmatore-di-tessere-rfid"],
  ["RFI-012", "RFID", "Programmatore di tessere RFID (carica tessere, portachiavi, braccialetti)", "lettori-di-carte-e-braccialetti/programmatore-di-cartebraccialettiportachiavi-rfid"],
  ["RFI-013", "RFID", "Programmatore di tessere RFID + Gestionale clienti in cloud", "lettori-di-carte-e-braccialetti/programmatore-di-tessere-rfid-gestionale-clienti-in-cloud"],
  ["CAM-001", "Cambiamonete", "Cambiagettoni (banconote e monete) – mod. B", "cambiamonete/cambiagettoni-cambia-banconote-e-monete-modello-b"],
  ["CAM-002", "Cambiamonete", "Cambiagettoni (banconote, monete e cashless) – mod. D", "cambiamonete/cambiagettoni-cambia-banconote-e-monete-e-cashless-modello-c-nuovo"],
  ["CAM-003", "Cambiamonete", "Cambiagettoni con lettore banconote e POS – mod. CPOS", "cambiamonete/cambiagettoni-cambia-banconote-pos-in-gettoni-modello-cpos"],
  ["CAM-004", "Cambiamonete", "Cambiagettoni con POS – banconote, monete e carte", "cambiamonete/cambiagettoni-con-pos-accetta-tutte-le-carte-banconote-monete"],
  ["CAM-005", "Cambiamonete", "Cambiamonete (banconote in monete o gettoni) – mod. C", "cambiamonete/cambiamonete-cambia-banconote-in-monete-o-gettoni-modello-c"],
  ["CAM-006", "Cambiamonete", "Caricatore tessere RFID (banconote 5-10-20-50 € e tutte le monete)", "cambiamonete/caricatore-di-carte-rfid-legge-banconote-e-monete"],
  ["CAM-007", "Cambiamonete", "Caricatore tessere RFID cashless (carte di debito e credito, Stripe)", "cambiamonete/caricatore-di-carte-rfid-con-carte-di-credito-stripe"],
  ["CAM-008", "Cambiamonete", "Caricatore tessere RFID con lettore banconote (5-10-20-50 €)", "cambiamonete/caricatore-di-carte-rfid-legge-banconote-da-5-10-20-50"],
  ["CAM-009", "Cambiamonete", "Caricatore tessere RFID con POS (carte di debito e credito)", "cambiamonete/caricatore-tessere-rfid-con-pos-ricarica-credito-tramite-carte-di-debito-e-credito"],
  ["CAM-010", "Cambiamonete", "Caricatore tessere RFID per lavanderie self (banconote 5-10-20-50 €)", "gettoniere-per-negozi-self/caricatore-di-carte-rfid-per-lavanderie-self-service-legge-banconote-da-5-10-20-50"],
  ["CAM-011", "Cambiamonete", "Erogatore di TESSERE con lettore banconote e monete", "cambiamonete/erogatore-di-tessere-con-lettore-di-banconote-e-monete"],
  ["CAM-012", "Cambiamonete", "QRChange – Cambiamonete cashless", "cambiamonete/qrchange-il-cambiamonete-cashless-made-in-italy-incassi-digitali-monete-reali"],
  ["TOE-001", "Toelettature", "TOELETTATURA SELF – 3 utenze: acqua calda/fredda + prese 230Vac", "gettoniere-per-negozi-self/3-utenze-vasca-toelettatura-h20-asciugatura-e-soffiatura"],
  ["TOE-002", "Toelettature", "TOELETTATURA SELF – 3 utenze: acqua, asciugatrice, aspiratore", "gettoniere-per-negozi-self/3-utenze-acqua-asciugatrice-aspiratore-per-toelettature-per-cani"],
  ["TOE-003", "Toelettature", "TOELETTATURA SELF – Attrezzatura completa 2 vasche grandi, POS, gettoniere, phon e distributore", "gettoniere-per-negozi-self/attrezzature-per-toelettatura-self-service-con-2-vasche-grandi-pos-gettoniere-phon-e-distributore-prodotti"],
  ["TOE-004", "Toelettature", "TOELETTATURA SELF – Gettoniera + RFID 3 dispositivi acqua + sapone, kit completo", "gettoniere-per-negozi-self/gettoniera-rfid-toelettatura-full-con-kit-pompa-sapone"],
  ["DIS-001", "Distributori", "Distributore capsule caffè con gettoniera elettronica – 4 selezioni, 24 capsule", "distributori-di-prodotti/it-distributori-di-capsule-caffe-distributore-capsule-caffe-gettoniera-elettronica"],
  ["DIS-002", "Distributori", "Distributore capsule caffè e detersivi – 4 piste multiprodotto", "distributori-di-prodotti/distributore-automatico-di-capsule-caffe-e-detersivo-per-lavatrice-e-lavastoviglie-4-piste-multiprodotto"],
  ["DIS-003", "Distributori", "Distributore capsule DOLCE GUSTO, gettoniera meccanica 0,50 €", "distributori-di-capsule-caffe/distributore-capsule-caffe-dolce-gusto-con-gettoniera-meccanica-da-0-5"],
  ["DIS-004", "Distributori", "Distributore capsule LAVAZZA A MODO MIO, gettoniera meccanica 1 €", "distributori-di-capsule-caffe/distributore-capsule-caffe-lavazza-a-modo-mio-con-gettoniera-meccanica-da-1-0"],
  ["DIS-005", "Distributori", "Distributore capsule NESPRESSO / BORBONE, gettoniera meccanica 1 €", "distributori-di-capsule-caffe/distributore-capsule-caffe-nespresso-con-gettoniera-meccanica-da-1"],
  ["DIS-006", "Distributori", "Distributore capsule NESPRESSO Professional, gettoniera meccanica 0,50 €", "distributori-di-capsule-caffe/distributore-capsule-caffe-nespresso-professional-con-gettoniera-meccanica-da-50-cent"],
  ["DIS-007", "Distributori", "Distributore piccoli prodotti, gettoniera meccanica (1 fila 1 € + 1 fila 50 cent)", "distributori-di-prodotti/distributore-di-piccoli-prodotti-con-gettoniera-meccanica-1-fila-a-1-euro-e-1-fila-a-50-cent"],
  ["DIS-008", "Distributori", "Distributore piccoli prodotti, gettoniera meccanica (2 file a 1 €)", "distributori-di-prodotti/distributore-di-piccoli-prodotti-con-gettoniera-meccanica-2-file-a-1-euro"],
  ["DIS-009", "Distributori", "Distributore piccoli prodotti, gettoniera meccanica (2 file a 50 cent)", "distributori-di-prodotti/distributore-di-piccoli-prodotti-con-gettoniera-meccanica-2-file-a-50-cent"],
  ["SPE-001", "Speciali", "2 DISPOSITIVI elettrici + SW – Gestione remota e ricarica tessere a distanza", "gettoniere-speciali-vedi-sottocategorie/2-dispositivi-elettrici-sw-per-gestione-in-remoto-e-ricarica-tessere-a-distanza"],
  ["SPE-002", "Speciali", "2 DISPOSITIVI elettrici – Gestione remota e ricarica tessere a distanza", "gettoniere-speciali-vedi-sottocategorie/2-dispositivi-elettrici-per-gestione-in-remoto-e-ricarica-tessere-a-distanza"],
  ["SPE-003", "Speciali", "4 DISPOSITIVI elettrici + SW – Gestione remota e ricarica tessere a distanza", "gettoniere-speciali-vedi-sottocategorie/4-dispositivi-elettrici-con-gestione-in-remoto-e-ricarica-tessere-a-distanza"],
  ["SPE-004", "Speciali", "4 DISPOSITIVI elettrici – Gestione remota e ricarica tessere a distanza", "gettoniere-speciali-vedi-sottocategorie/4-dispositivi-elettrici-per-gestione-in-remoto-e-ricarica-tessere-a-distanza"],
  ["SPE-005", "Speciali", "Generatore OZONO 10 g/h (130 m²)", "gettoniere-speciali-vedi-sottocategorie/generatore-ozono-produzione-10g-h-sanifica-un-locale-di-130m2-h-pronta-consegna"],
  ["SPE-006", "Speciali", "Generatore OZONO 20 g/h (260 m²)", "gettoniere-speciali-vedi-sottocategorie/generatore-ozono-produzione-20g-h-sanifica-un-locale-di-260m2-60-min"],
  ["SPE-007", "Speciali", "Generatore OZONO 5 g/h (67 m²)", "gettoniere-speciali-vedi-sottocategorie/generatore-ozono-produzione-5g-h-67m2-h"],
  ["SPE-008", "Speciali", "Generatore OZONO 5 g/h (67 m²) con timer digitale", "gettoniere-speciali-vedi-sottocategorie/generatore-ozono-produzione-5g-h-67m2-h-timer-digitale"],
  ["GET-001", "Gettoni e Tessere", "Braccialetti RFID 13,56 MHz regolabili ARANCIONE (50 pz)", "lettori-di-carte-e-braccialetti/braccialetti-rfid-13-56-mhz-m1-con-cinturino-regolabile-50-pz-colore-arancione"],
  ["GET-002", "Gettoni e Tessere", "Braccialetti RFID 13,56 MHz regolabili BLU (20 pz)", "gettoni-tessere-bracciali-rfid/copia-di-braccialetti-rfid-13-56-mhz-m1-con-cinturino-regolabile-20-pz-colore-blu"],
  ["GET-003", "Gettoni e Tessere", "Braccialetti RFID 13,56 MHz regolabili BLU (50 pz)", "gettoni-tessere-bracciali-rfid/braccialetti-rfid-13-56-mhz-m1-con-cinturino-regolabile-50-pz-colore-blu"],
  ["GET-004", "Gettoni e Tessere", "Gettoni in acciaio mod. PAY39 (100 pz)", "gettoni-tessere-bracciali-rfid/gettone-in-acciaio-mod-pay39"],
  ["GET-005", "Gettoni e Tessere", "Gettoni in acciaio mod. PAY39 (50 pz)", "gettoni-tessere-bracciali-rfid/gettone-in-acciaio-mod-pay39-50pz"],
  ["GET-006", "Gettoni e Tessere", "Gettoni in acciaio mod. Shoppy (100 pz)", "gettoni-tessere-bracciali-rfid/gettone-in-acciaio-mod-shoppy-100pz"],
  ["GET-007", "Gettoni e Tessere", "Gettoni in acciaio mod. Shoppy (20 pz)", "gettoni-tessere-bracciali-rfid/copia-di-gettone-in-acciaio-mod-shoppy-20pz-nuovo-modello"],
  ["GET-008", "Gettoni e Tessere", "Gettoni in acciaio mod. Shoppy (50 pz)", "gettoni-tessere-bracciali-rfid/gettone-in-acciaio-mod-shoppy-50pz"],
  ["GET-009", "Gettoni e Tessere", "Portachiavi RFID 125 KHz (50 pz)", "gettoni-tessere-bracciali-rfid/portachiavi-ciondolo-rfid-125-khz-mhz-50-pz"],
  ["GET-010", "Gettoni e Tessere", "Portachiavi RFID 13,56 MHz M1 1K (100 pz)", "gettoni-tessere-bracciali-rfid/portachiavi-ciondolo-rfid-13-56-mhz-100-pz-m1-1k"],
  ["GET-011", "Gettoni e Tessere", "Portachiavi RFID 13,56 MHz M1 1K (20 pz)", "gettoni-tessere-bracciali-rfid/portachiavi-ciondolo-rfid-13-56-mhz-20-pz-m1"],
  ["GET-012", "Gettoni e Tessere", "Portachiavi RFID 13,56 MHz M1 1K (50 pz)", "gettoni-tessere-bracciali-rfid/portachiavi-ciondolo-rfid-1356-mhz-50-pz-m1-1k"],
  ["GET-013", "Gettoni e Tessere", "Tessere RFID 125 KHz (100 pz)", "gettoni-tessere-bracciali-rfid/tessere-rfid-125-khz-100-pz"],
  ["GET-014", "Gettoni e Tessere", "Tessere RFID 125 KHz (50 pz)", "gettoni-tessere-bracciali-rfid/tessere-rfid-125-khz-50-pz"],
  ["GET-015", "Gettoni e Tessere", "Tessere RFID 13,56 MHz MIFARE 1K (100 pz)", "gettoni-tessere-bracciali-rfid/carte-rfid-1356-mhz"],
  ["GET-016", "Gettoni e Tessere", "Tessere RFID 13,56 MHz MIFARE 1K (20 pz)", "gettoni-tessere-bracciali-rfid/tessere-rfid-13-56-mhz-mifare-1k-confezione-20-pz"],
  ["GET-017", "Gettoni e Tessere", "Tessere RFID 13,56 MHz MIFARE 1K (50 pz)", "gettoni-tessere-bracciali-rfid/carte-rfid-13-56-mhz-50-pz-1k-14443-a-iso"],
  ["GET-018", "Gettoni e Tessere", "Tessere RFID 13,56 MHz PERSONALIZZATE due lati (200 pz)", "gettoni-tessere-bracciali-rfid/tessere-rfid-1356-mhz-personalizzate-50-pz-due-lati"],
  ["GET-019", "Gettoni e Tessere", "Tessere RFID 13,56 MHz PERSONALIZZATE un lato (200 pz)", "gettoni-tessere-bracciali-rfid/carte-rfid-13-56-mhz-200-pz-1k-14443-a-iso"],
  ["GET-020", "Gettoni e Tessere", "Tessere RFID 13,56 MHz PERSONALIZZATE un lato (50 pz)", "gettoni-tessere-bracciali-rfid/tessere-rfid-1356-mhz-personalizzate-50-pz-un-lato"],
  ["SER-001", "Servizi", "Abbonamento 1 anno servizio cloud (KEY39 e PAY39)", "tele-assistenza/abbonamento-1-anno-al-servizio-cloud-key39"],
  ["SER-002", "Servizi", "Abbonamento annuale server (apriporta e gestionali palestre)", "tele-assistenza/abbonamento-annuale-server-per-key39-e-qrpay"],
  ["SER-003", "Servizi", "App corrispettivi EASY 1 – una gettoniera, 12 mesi", "app-per-invio-corrispettivi/app-corrispettivi-easy-1-per-una-gettoniera-abbonamento-12-mesi"],
  ["SER-004", "Servizi", "App corrispettivi EASY 2 – due gettoniere, 12 mesi", "app-per-invio-corrispettivi/app-corrispettivi-easy-2-per-due-gettoniere-abbonamento-12-mesi"],
  ["SER-005", "Servizi", "App corrispettivi EASY Light – gettoniere illimitate, 12 mesi", "app-per-invio-corrispettivi/app-corrispettivi-easy-light-per-gettoniere-illimitate-abbonamento-12-mesi"],
  ["SER-006", "Servizi", "Caricamento database su nostri SW gestionali", "tele-assistenza/caricamento-data-base-su-nostri-gestionali"],
  ["SER-007", "Servizi", "Caricamento software centralina pagamento QR (teleassistenza)", "tele-assistenza/caricamento-software-centralina-di-pagamento-qr-ultima-release-in-teleassistenza"],
  ["SER-008", "Servizi", "Duplicato istruzioni / documentazione tecnica", "tele-assistenza/duplicato-istruzioni-documentazione-tecnica"],
  ["SER-009", "Servizi", "Montaggio e riparazione (1 ora)", "tele-assistenza/montaggio-e-riparazione-1h"],
  ["SER-010", "Servizi", "Rinnovo abbonamento SW gestionali cloud", "tele-assistenza/rinnovo-abbonamento-sw-gestionali-mantieni-attivi-i-tuoi-servizi-cloud"],
  ["SER-011", "Servizi", "Ritiro merce presso vostra sede", "tele-assistenza/ritiro-merce-sede-cliente"],
  ["SER-012", "Servizi", "SW gestione abbonati centri sportivi con avvisi scadenze", "codici-qr-applicazioni-nuovo/gestione-abbonati-per-centri-sportivi-con-avvisi-scadenze"],
  ["SER-013", "Servizi", "Teleassistenza 15 min – programmazione nuovi parametri", "tele-assistenza/15-min-tele-assistenza-per-programmazione-nuovi-parametri"],
  ["SER-014", "Servizi", "Trasporto andata e ritorno", "tele-assistenza/trasporto-presso-nostra-sede"],
  ["RIC-001", "Ricambi", "Alimentatore 12Vcc 2A (24W) da parete", "parti-di-ricambio/alimentatore-12vcc-2a-24w-da-parete"],
  ["RIC-002", "Ricambi", "Alimentatore 12Vcc 5A (60W) con cavo 1,4 m", "parti-di-ricambio/alimentatore-12vcc-5a-con-cavo-di-alimentazione"],
  ["RIC-003", "Ricambi", "Alimentatore 12Vcc 5A (60W) da quadro", "parti-di-ricambio/alimentatore-12vcc-5a-60w-da-quadro"],
  ["RIC-004", "Ricambi", "Alimentatore 230/12Vcc 2,5A in cassetta stagna", "parti-di-ricambio/alimentatore-230-12vcc-2-5a-in-cassetta-stagna"],
  ["RIC-005", "Ricambi", "Alimentatore 230/12Vcc 5A in cassetta stagna", "parti-di-ricambio/alimentatore-23012vcc-5a-in-cassetta-stagna"],
  ["RIC-006", "Ricambi", "Box per KIT gettoniera con cassetto portamonete e serratura", "parti-di-ricambio/box-per-kit-gettoniera-con-cassetto-portamonete-e-serratura"],
  ["RIC-007", "Ricambi", "Cassetta ABS per montaggio KIT gettoniera + mascherina plexi", "parti-di-ricambio/cassetta-in-abs-per-montaggio-kit-gettoniera-mascherina-in-plexi"],
  ["RIC-008", "Ricambi", "Cavi per pulsanti (schede da 2 a 12 uscite)", "parti-di-ricambio/cavi-per-pulsanti-per-schede-a-2-3-4-uscite"],
  ["RIC-009", "Ricambi", "Cavo display", "parti-di-ricambio/cavo-display"],
  ["RIC-010", "Ricambi", "Cavo per elettrovalvola 12Vcc con diodo di protezione (2 pz)", "parti-di-ricambio/cavo-per-elettrovalvola-a-12vcc-con-diodo-di-protezione"],
  ["RIC-011", "Ricambi", "Chiave per BOX in lamiera", "parti-di-ricambio/chiave-per-box-in-lamiera"],
  ["RIC-012", "Ricambi", "Contamonete digitale", "parti-di-ricambio/contamonete-digitale"],
  ["RIC-013", "Ricambi", "Contatore acqua 3/4\" con uscita ad impulsi (1/10 L)", "parti-di-ricambio/contatore-acqua-con-attacchi-da-34-uscita-ad-impulsi-110l"],
  ["RIC-014", "Ricambi", "Contattore bipolare 25A, bobina 12Vcc", "parti-di-ricambio/contattore-bipolare-da-25a-bobina-a-12vcc"],
  ["RIC-015", "Ricambi", "Contattore bipolare 25A, bobina 230Vac", "parti-di-ricambio/contattore-bipolare-da-25a-bobina-a-230vac"],
  ["RIC-016", "Ricambi", "COVER per gettoniera", "parti-di-ricambio/cover-per-gettoniera"],
  ["RIC-017", "Ricambi", "COVER per gettoniera con cerniera – mod. A", "parti-di-ricambio/cover-per-gettoniera-con-cerniera-mod-a"],
  ["RIC-018", "Ricambi", "COVER per gettoniera con cerniera – mod. B", "parti-di-ricambio/cover-per-gettoniera-con-cerniera-mod-b"],
  ["RIC-019", "Ricambi", "Display LCD 2 righe seriale 16x2", "parti-di-ricambio/display-lcd-a-2-line-seriale-16x2"],
  ["RIC-020", "Ricambi", "Display per scheda 230Vac / 12Vcc", "parti-di-ricambio/display-per-scheda-230vac-12vcc"],
  ["RIC-021", "Ricambi", "Elettrovalvola H2O ad impulsi in ottone 4,5Vcc, attacchi 1/2\"", "parti-di-ricambio/elettrovalvola-h2o-ad-impulsi"],
  ["RIC-022", "Ricambi", "Elettrovalvola H2O con bobina 12Vcc, attacchi 1/2\"", "parti-di-ricambio/elettrovalvola-h2o-con-bobina-a-12vcc-attacchi-da-12"],
  ["RIC-023", "Ricambi", "Elettrovalvola H2O in ottone con bobina 12Vcc, attacchi 1/2\"", "parti-di-ricambio/elettrovalvola-h2o-in-ottone-con-bobina-a-12vcc-attacchi-da-1-2"],
  ["RIC-024", "Ricambi", "Gettoniera monomoneta a comparazione", "parti-di-ricambio/gettoniera-monomoneta-a-comparazione"],
  ["RIC-025", "Ricambi", "Gettoniera monomoneta con microinterruttore", "parti-di-ricambio/gettoniera-monomoneta-con-micro"],
  ["RIC-026", "Ricambi", "Gettoniera multimoneta Alberici AL66S (Pulse/CCtalk)", "parti-di-ricambio/gettoniera-multimoneta-alberici-mod-al66s-euro-pulse-cctalk"],
  ["RIC-027", "Ricambi", "Gettoniera multimoneta mod. 600F", "parti-di-ricambio/gettoniera-multimoneta-euro-0-1-0-2-0-5-1-2-mod-600f"],
  ["RIC-028", "Ricambi", "Gettoniera multimoneta mod. 926", "parti-di-ricambio/gettoniera-multimoneta-euro-0-1-0-2-0-5-1-2-mod-926"],
  ["RIC-029", "Ricambi", "Gettoniera multimoneta mod. CL-168 (5 monete, alta precisione)", "parti-di-ricambio/gettoniera-multimoneta-euro-0-1-0-2-0-5-1-2-mod-cl-168-legge-5-monete"],
  ["RIC-030", "Ricambi", "Inserto moneta 1 € per distributori capsule", "parti-di-ricambio/inserto-per-moneta-da-1-euro-per-distributori-di-capsule-caffe"],
  ["RIC-031", "Ricambi", "Inserto moneta 50 cent per distributori capsule", "parti-di-ricambio/inserto-per-moneta-da-50-cent-per-distributori-di-capsule-caffe"],
  ["RIC-032", "Ricambi", "KIT pulsante + elettrovalvola + set di cavi + assistenza", "parti-di-ricambio/kit-pulsante-elettrovalvola-set-di-cavi-assistenza"],
  ["RIC-033", "Ricambi", "Lettore banconote 5-10-20-50 € uscita ad impulsi", "parti-di-ricambio/lettore-di-banconote-da-5-10-20-euro-uscita-ad-impulsi"],
  ["RIC-034", "Ricambi", "Lettore banconote 5-10-20-50 € uscita ad impulsi + dima fissaggio", "parti-di-ricambio/lettore-di-banconote-da-5-10-20-euro-dima-fissaggio-uscita-ad-impulsi"],
  ["RIC-035", "Ricambi", "Modulo PLC Siemens 6ED1052-2MD08-0BA1 (12/24 Vcc)", "schede-timer/siemens-6ed1052-2md08-0ba1-modulo-di-controllo-plc-12-v-dc-24-v-dc"],
  ["RIC-036", "Ricambi", "Modulo relè bipolare 25A, 230Vac", "parti-di-ricambio/modulo-rele-bipolare-da-25a-230vac"],
  ["RIC-037", "Ricambi", "Modulo relè bipolare 25A, bobina 12Vcc", "parti-di-ricambio/modulo-rele-bipolare-da-25a-bobina-a-12vcc"],
  ["RIC-038", "Ricambi", "Mostrina + cover trasparente per display LCD", "parti-di-ricambio/mostrina-cover-trasparente-per-display-lcd"],
  ["RIC-039", "Ricambi", "Mostrina copri errori per gettoniera", "parti-di-ricambio/mostrina-copri-errori-per-gettoniera"],
  ["RIC-040", "Ricambi", "Mostrina copri errori per gettoniera e display", "parti-di-ricambio/mostrina-copri-errori-per-gettoniera-e-display"],
  ["RIC-041", "Ricambi", "Mostrina fronte e retro per gettoniera e fissaggio display", "parti-di-ricambio/mostrina-fronte-e-retro-per-gettoniera-e-fissaggio-display"],
  ["RIC-042", "Ricambi", "Mostrina per gettoniera CL168", "parti-di-ricambio/mostrina-per-gettoniera-cl168"],
  ["RIC-043", "Ricambi", "Mostrina per gettoniera DG600F", "parti-di-ricambio/mostrina-per-gettoniera-dg600f"],
  ["RIC-044", "Ricambi", "Presa elettrica impermeabile IP66 10/16A 2P+T", "parti-di-ricambio/presa-elettriche-impermeabileip66-1016a-2pt"],
  ["RIC-045", "Ricambi", "Presa per PHON 230Vac", "parti-di-ricambio/presa-per-phon-con-alimentazione-a-230vac"],
  ["RIC-046", "Ricambi", "Presa per PHON 230Vac (gettoniera con uscita 12Vcc)", "parti-di-ricambio/presa-per-phon-altri-dispositivi-a-230vac-per-gettoniera-con-uscita-a-12vcc"],
  ["RIC-047", "Ricambi", "Presa SCHUKO con cavo guainato F3G2,5", "parti-di-ricambio/presa-shuko-con-cavo-sguainato"],
  ["RIC-048", "Ricambi", "Protezione parasole plexiglas MAXI (41 x 30 cm)", "parti-di-ricambio/protezione-parasole-in-plexiglas-per-gettoniere-mod-maxi-41-x-30-cm"],
  ["RIC-049", "Ricambi", "Protezione parasole plexiglas MINI (32 x 30 cm)", "parti-di-ricambio/protezione-parasole-in-plexiglas-per-gettoniere"],
  ["RIC-050", "Ricambi", "Pulsante con micro retroilluminato LED 5Vcc BIANCO", "parti-di-ricambio/pulsante-con-micro-colore-bianco-retroilluminato-con-led-5vcc-1-pezzo"],
  ["RIC-051", "Ricambi", "Pulsante con micro retroilluminato LED 5Vcc BLU", "parti-di-ricambio/pulsante-con-micro-colore-blu-retroilluminato-con-led-5vcc-1-pezzo"],
  ["RIC-052", "Ricambi", "Pulsante con micro retroilluminato LED 5Vcc GIALLO", "parti-di-ricambio/pulsante-con-micro-colore-giallo-retroilluminato-con-led-5vcc-1-pezzo"],
  ["RIC-053", "Ricambi", "Pulsante con micro retroilluminato LED 5Vcc ROSSO", "parti-di-ricambio/pulsante-con-micro-colore-rosso-retroilluminato-con-led-5vcc-1-pezzo"],
  ["RIC-054", "Ricambi", "Pulsante con micro retroilluminato LED 5Vcc VERDE", "parti-di-ricambio/pulsante-con-micro-colore-verde-retroilluminato-con-led-5vcc-1-pezzo"],
  ["RIC-055", "Ricambi", "Pulsante di pausa con contenitore stagno IP56", "parti-di-ricambio/pulsante-di-pausa-con-contenitore-a-tenuta-stagna-ip56"],
  ["RIC-056", "Ricambi", "Pulsante MINI retroilluminato LED 5Vcc BIANCO", "parti-di-ricambio/pulsante-mod-mini-colore-bianco-retroilluminato-con-led-5vcc-1-pezzo"],
  ["RIC-057", "Ricambi", "Pulsante MINI retroilluminato LED 5Vcc GIALLO", "parti-di-ricambio/pulsante-mod-mini-colore-giallo-retroilluminato-con-led-5vcc-1-pezzo"],
  ["RIC-058", "Ricambi", "Pulsante MINI retroilluminato LED 5Vcc ROSSO", "parti-di-ricambio/pulsante-mod-mini-colore-rosso-retroilluminato-con-led-5vcc-1-pezzo"],
  ["RIC-059", "Ricambi", "Pulsante MINI retroilluminato LED 5Vcc VERDE", "parti-di-ricambio/pulsante-mod-mini-colore-verde-retroilluminato-con-led-5vcc-1-pezzo"],
  ["RIC-060", "Ricambi", "Pulsanti colorati con microswitch retroilluminati (set 4 pz)", "parti-di-ricambio/pulsanti-colorati-con-microswitch-retroilluminati-con-led-5vcc-set-di-4-pezzi"],
  ["RIC-061", "Ricambi", "Pulsanti colorati con microswitch retroilluminati (set 5 pz)", "parti-di-ricambio/pulsanti-colorati-con-microswitch-retroilluminati-con-led-5vcc-set-di-5-pezzi"],
  ["RIC-062", "Ricambi", "Pulsanti colorati retroilluminati LED 5Vcc (set 4 pz)", "parti-di-ricambio/pulsanti-colorati-retroilluminati-con-led-5vcc-set-di-4-pezzi"],
  ["RIC-063", "Ricambi", "Pulsantiera con 2 pulsanti LED", "parti-di-ricambio/pulsantiera-con-2-pulsanti-con-led"],
  ["RIC-064", "Ricambi", "Pulsantiera con 3 pulsanti LED", "parti-di-ricambio/pulsantiera-con-3-pulsanti-con-led"],
  ["RIC-065", "Ricambi", "Pulsantiera con 3 pulsanti LED – box giallo", "parti-di-ricambio/pulsantiera-con-3-pulsanti-con-led-box-giallo"],
  ["RIC-066", "Ricambi", "Pulsantiera con 4 pulsanti LED", "parti-di-ricambio/pulsantiera-con-4-pulsanti-con-led"],
  ["RIC-067", "Ricambi", "Pulsantiera per 2 pulsanti", "parti-di-ricambio/pulsantiera-per-2-pulsanti"],
  ["RIC-068", "Ricambi", "Pulsantiera per 3 pulsanti", "parti-di-ricambio/pulsantiera-per-3-pulsanti"],
  ["RIC-069", "Ricambi", "Pulsantiera per 4 pulsanti", "parti-di-ricambio/pulsantiera-per-4-pulsanti"],
  ["RIC-070", "Ricambi", "Scheda timer per gettoniera con 4 uscite", "parti-di-ricambio/scheda-timer-per-gettoniera-con-4-uscite"],
  ["RIC-071", "Ricambi", "Scheda timer per gettoniera IN/OUT 230V 10A (lavatrici, luci)", "parti-di-ricambio/scheda-timer-per-gettoniera-in-out-220v-10a-lavatrici-luci"],
  ["RIC-072", "Ricambi", "Serratura con chiave in plastica diam. 23 mm (5 set)", "parti-di-ricambio/serratura-con-chiave-in-plastica-5-set"],
  ["RIC-073", "Ricambi", "Serratura di sicurezza con 2 chiavi – mod. A", "parti-di-ricambio/serratura-di-sicurezza-con-2-chiavi-moda"],
  ["RIC-074", "Ricambi", "Serratura di sicurezza con 2 chiavi – mod. B", "parti-di-ricambio/serratura-con-2-chiavi-modb"],
  ["RIC-075", "Ricambi", "Set 4 staffe di fissaggio a parete per gettoniera (alluminio nero)", "parti-di-ricambio/staffa-per-fissaggio-a-parete-gettoniera-per-lavatrice"],
  ["RIC-076", "Ricambi", "Timer per gettoniera IN 12Vcc / uscita contatto aperto", "parti-di-ricambio/timer-per-gettoniera-in-out-12vcc"],
  ["RIC-077", "Ricambi", "Timer per gettoniera IN/OUT 12Vcc", "parti-di-ricambio/timer-per-gettoniera-in-e-out-12vcc"],
  ["RIC-078", "Ricambi", "Timer per gettoniera IN/OUT 230V 6A", "parti-di-ricambio/timer-per-gettoniera-inout-220v-6a"],
  ["RIC-079", "Ricambi", "Trasformatore 220/9Vac 12VA (5 pz)", "parti-di-ricambio/trasformatore-220v9v-ac-5-pezzi"],
  ["RIC-080", "Ricambi", "Trasformatore 220/9Vac 889mA 8VA", "parti-di-ricambio/trasformatore-220-9vac-889ma"],
  ["RIC-081", "Ricambi", "VENDING – Convogliatore a nastro motore 24Vcc (42 cm)", "parti-di-ricambio/convogliatore-di-prodotti-a-nastro-con-motore-passo-passo-a-24vcc-lunghezza-utile-42cm"],
  ["RIC-082", "Ricambi", "VENDING – Distributore a nastro motore 24Vcc (40 cm)", "parti-di-ricambio/distributore-prodotti-a-nastro-con-motore-passo-passo-a-24vcc-lunghezza-utile-40cm"],
  ["RIC-083", "Ricambi", "VENDING – Doppio convogliatore a nastro motore 24Vcc (42 cm)", "parti-di-ricambio/doppio-convogliatore-di-prodotti-a-nastro-con-motore-passo-passo-a-24vcc-lunghezza-utile-42cm"],
  ["RIC-084", "Ricambi", "VENDING – Elettroserratura 5Vcc con feedback", "parti-di-ricambio/elettroserratura-per-distributore-vending-a-5vcc-con-feedback"],
  ["RIC-085", "Ricambi", "VENDING – Guida per molla diam. 40 mm (45 cm)", "parti-di-ricambio/guida-per-molla-per-distributore-di-prodotti-lunghezza-utile-45cm"],
  ["RIC-086", "Ricambi", "VENDING – Molla in acciaio L=50 cm, passo 4 cm, diam. 4 cm", "parti-di-ricambio/molle-in-acciaio-per-distributore-automatico-l50cm-passo4cm-dia4cm"],
  ["RIC-087", "Ricambi", "VENDING – Motore passo passo singolo 24Vcc", "parti-di-ricambio/motore-passo-passo-per-macchina-vending-24vcc"],
  ["RIC-088", "Ricambi", "VENDING – Scheda a infrarossi rilevamento caduta prodotti", "parti-di-ricambio/scheda-a-radiazione-infrarossa-che-rileva-la-caduta-dei-prodotti"],
  ["RIC-089", "Ricambi", "VENDING – Spingi prodotti con motore passo passo 24Vcc (45 cm)", "parti-di-ricambio/spingi-prodotti-con-motore-passo-passo-a-24vcc-lunghezza-utile-45cm"],
  ["RIC-090", "Ricambi", "Vite + dado M3 inox L=20 mm (set 4 bulloni)", "parti-di-ricambio/vite-dado-m3-in-acciaio-inox-vite-l20mm-set-di-4-bulloni"],
];

export const CATALOGO = CATALOGO_RAW.map(([code, category, name, link]) => ({ code, category, name, link: SITO + link }));
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

// ─── ABBINAMENTO AUTOMATICO ───────────────────────────────────────────────────
const radice = (w) => {
  if (/^\d+$/.test(w)) return w;
  if (w.startsWith("docc")) return "docc";
  if (w.startsWith("port") || w.startsWith("aprip")) return "port";
  if (w.startsWith("lavatr")) return "lavatr";
  if (w.startsWith("asciug")) return "asciug";
  if (w.startsWith("lettor")) return "lettor";
  if (w.startsWith("tesser") || w.startsWith("cart")) return "tesser";
  return w.slice(0, 5);
};
const VUOTE = new Set(["per", "con", "di", "da", "e", "o", "la", "il", "a", "in", "gettoniera", "max", "cada", "cad", "fino", "sino", "12vcc", "12", "vcc", "pz"]);
const firma = (s) => {
  const ws = parole(s).filter(w => !VUOTE.has(w));
  return { nums: ws.filter(w => /^\d+$/.test(w)), set: new Set(ws.map(radice)) };
};
const DOMINI = ["docc", "port", "lavatr", "asciug", "luci", "impia", "phon", "sauna", "caval", "gettoni", "tesser", "bracc", "portac", "elettr", "pulsa", "alime", "cambi", "distr", "ozono"];
const OPZIONI = ["pos", "rfid", "lettor", "pausa", "pause", "smart", "progr", "tandem", "selet", "qr", "cashl", "key39"];
const punteggio = (a, b) => {
  let comuni = 0;
  a.set.forEach(w => { if (b.set.has(w)) comuni++; });
  let s = (2 * comuni) / (a.set.size + b.set.size);
  const na = a.nums[0], nb = b.nums[0];
  if (na && nb) s += na === nb ? 0.3 : -0.8;
  if (!na && nb) s -= 0.03 * Math.min(Number(nb), 12);
  DOMINI.forEach(d => { if (a.set.has(d) && !b.set.has(d)) s -= 1; if (b.set.has(d) && !a.set.has(d)) s -= 0.2; });
  OPZIONI.forEach(o => { if (b.set.has(o) && !a.set.has(o)) s -= 0.15; if (a.set.has(o) && !b.set.has(o)) s -= 0.3; });
  return s;
};
export const suggerisci = (vecchio) => {
  const f = firma(`${vecchio.name} ${vecchio.category || ""}`);
  let best = null, bestS = 0;
  for (const c of CATALOGO) {
    const s = punteggio(f, firma(`${c.name} ${c.category}`));
    if (s > bestS) { bestS = s; best = c; }
  }
  return bestS >= 0.35 ? best.code : "";
};

// ─── IMPORTA CATALOGO ─────────────────────────────────────────────────────────
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

export function ImportaCatalogo({ products, orders, categories, onFatto }) {
  const codiciCatalogo = useMemo(() => new Set(CATALOGO.map(c => c.code)), []);
  const vecchi = useMemo(() => prodottiVisibili(products).filter(p => !p.catalogCode && !codiciCatalogo.has(p.id)), [products, codiciCatalogo]);
  const giaImportati = useMemo(() => products.filter(p => p && p.catalogCode).length, [products]);
  const usi = useMemo(() => {
    const m = {};
    orders.forEach(o => (o.items && o.items.length ? o.items : [{ productId: o.productId }]).forEach(it => { if (it.productId) m[it.productId] = (m[it.productId] || 0) + 1; }));
    return m;
  }, [orders]);
  const [scelte, setScelte] = useState(() => {
    const s = {};
    vecchi.forEach(p => { s[p.id] = suggerisci(p) || "__nascondi__"; });
    return s;
  });
  const [auto] = useState(() => { const a = {}; vecchi.forEach(p => { a[p.id] = !!suggerisci(p); }); return a; });
  const [fase, setFase] = useState("scegli"); // scegli | conferma | lavoro | fatto | errore
  const [esito, setEsito] = useState(null);

  const itemsCatalogo = useMemo(() => CATALOGO.map(c => ({ id: c.code, label: c.name, code: c.code, group: c.category })), []);
  const extra = [
    { id: "__nascondi__", label: "🚫 Non serve più (nascondilo)", colore: "#B91C1C" },
    { id: "__tieni__", label: "📌 Tienilo così com'è", colore: "#1D4ED8" },
  ];

  const presenti = new Set(products.filter(p => p && p.catalogCode).map(p => p.catalogCode));
  const riepilogo = useMemo(() => {
    const abbinati = vecchi.filter(p => codiciCatalogo.has(scelte[p.id])).length;
    const nascosti = vecchi.filter(p => scelte[p.id] === "__nascondi__").length;
    const tenuti = vecchi.filter(p => scelte[p.id] === "__tieni__").length;
    const usati = new Set(vecchi.map(p => scelte[p.id]).filter(c => codiciCatalogo.has(c)));
    const nuovi = CATALOGO.filter(c => !usati.has(c.code) && !presenti.has(c.code)).length;
    return { abbinati, nascosti, tenuti, nuovi };
  }, [vecchi, scelte, codiciCatalogo, presenti]);

  const nascostiUsati = vecchi.filter(p => scelte[p.id] === "__nascondi__" && usi[p.id]).length;

  const applica = async () => {
    setFase("lavoro");
    try {
      const mappa = Object.fromEntries(CATALOGO.map(c => [c.code, c]));
      const daSalvare = [];
      const primoPerCodice = {};
      vecchi.forEach(p => {
        const s = scelte[p.id];
        if (s === "__tieni__") return;
        if (s === "__nascondi__") { daSalvare.push({ ...p, hidden: true }); return; }
        const c = mappa[s];
        const doppione = !!primoPerCodice[s];
        if (!doppione) primoPerCodice[s] = p.id;
        daSalvare.push({ ...p, name: c.name, code: c.code, category: c.category, link: c.link, catalogCode: c.code, oldName: p.oldName || p.name, oldCode: p.oldCode || p.code || "", hidden: doppione });
      });
      CATALOGO.forEach(c => {
        if (primoPerCodice[c.code] || presenti.has(c.code)) return;
        daSalvare.push({ id: c.code, name: c.name, code: c.code, category: c.category, notes: "", link: c.link, catalogCode: c.code });
      });
      await upsertProdotti(daSalvare);
      const tenuteCat = vecchi.filter(p => scelte[p.id] === "__tieni__").map(p => p.category).filter(Boolean);
      const nuoveCat = [...new Set([...CATEGORIE_CATALOGO, ...tenuteCat])];
      await onFatto(nuoveCat);
      setEsito({ salvati: daSalvare.length });
      setFase("fatto");
    } catch (e) {
      setFase("errore");
    }
  };

  const card = { background: "#fff", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: "16px 18px" };
  const btnP = { background: "#1E293B", color: "#fff", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };
  const btnS = { background: "#fff", color: "#475569", border: "1.5px solid #E2E8F0", borderRadius: 8, padding: "12px 20px", fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };

  if (fase === "fatto") return (
    <div style={{ ...card, borderLeft: "4px solid #22C55E", maxWidth: 640 }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>✅ Catalogo importato</h2>
      <p style={{ margin: 0, color: "#475569" }}>Ho aggiornato {esito.salvati} prodotti. Gli ordini vecchi restano collegati: se un nome è cambiato, negli ordini vedi il nome nuovo. I nomi di prima sono conservati dentro ogni prodotto.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 820 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1E293B", margin: "0 0 6px" }}>Importa catalogo dal sito</h1>
      <p style={{ color: "#64748B", margin: "0 0 18px", maxWidth: 640 }}>
        Il catalogo ha {CATALOGO.length} prodotti in {CATEGORIE_CATALOGO.length} categorie. Per ogni prodotto che avevi già, scegli a quale prodotto del catalogo corrisponde: così gli ordini vecchi restano collegati. Nessun prodotto viene cancellato.
      </p>

      {giaImportati > 0 && (
        <div style={{ ...card, background: "#EFF6FF", borderColor: "#BFDBFE", marginBottom: 16 }}>
          Il catalogo è già stato importato ({giaImportati} prodotti). Qui sotto trovi solo i prodotti non ancora abbinati.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginBottom: 18 }}>
        {[["Abbinati", riepilogo.abbinati, "#166534"], ["Da nascondere", riepilogo.nascosti, "#B91C1C"], ["Tenuti così", riepilogo.tenuti, "#1D4ED8"], ["Prodotti nuovi", riepilogo.nuovi, "#1E293B"]].map(([l, n, c]) => (
          <div key={l} style={{ ...card, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>{l}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{n}</div>
          </div>
        ))}
      </div>

      {vecchi.length > 0 && <h2 style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: ".07em", color: "#64748B", margin: "0 0 10px" }}>I tuoi prodotti di prima ({vecchi.length})</h2>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {vecchi.map(p => {
          const s = scelte[p.id];
          const bordo = s === "__nascondi__" ? "#FECACA" : s === "__tieni__" ? "#BFDBFE" : "#BBF7D0";
          return (
            <div key={p.id} style={{ ...card, borderLeft: `4px solid ${bordo}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: "#1E293B" }}>{p.name}{p.code && <span style={ST.codice}>{p.code}</span>}</div>
                  <div style={{ fontSize: 12.5, color: "#64748B" }}>{p.category || "senza categoria"} · {usi[p.id] ? `usato in ${usi[p.id]} ordini` : "mai usato negli ordini"}</div>
                </div>
                {auto[p.id] && codiciCatalogo.has(s) && <span style={{ fontSize: 11, fontWeight: 700, color: "#B45309", background: "#FFFBEB", borderRadius: 99, padding: "3px 9px", alignSelf: "flex-start" }}>SUGGERITO · CONTROLLA</span>}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 5 }}>Corrisponde a:</div>
              <SceltaConRicerca items={itemsCatalogo} value={s} extra={extra}
                onChange={(v) => { setScelte(prev => ({ ...prev, [p.id]: v })); }}
                etichettaScelta={(x) => s === "__nascondi__" ? "🚫 Non serve più (verrà nascosto)" : s === "__tieni__" ? "📌 Lo tengo così com'è" : (x ? x.label : "—")} />
            </div>
          );
        })}
        {!vecchi.length && <div style={card}>Non ci sono prodotti vecchi da abbinare.</div>}
      </div>

      {nascostiUsati > 0 && (
        <p style={{ fontSize: 13, color: "#B45309", maxWidth: 640 }}>
          {nascostiUsati} prodotti da nascondere compaiono in ordini vecchi: negli ordini continueranno a vedersi col loro nome, semplicemente non li troverai più quando crei un ordine nuovo.
        </p>
      )}

      {fase === "scegli" && <button style={btnP} onClick={() => setFase("conferma")}>Importa il catalogo</button>}
      {fase === "conferma" && (
        <div style={{ ...card, borderLeft: "4px solid #F59E0B", maxWidth: 640 }}>
          <p style={{ margin: "0 0 12px", color: "#1E293B" }}>
            Confermi? Abbino {riepilogo.abbinati} prodotti, ne nascondo {riepilogo.nascosti}, ne lascio {riepilogo.tenuti} così come sono e aggiungo {riepilogo.nuovi} prodotti nuovi. Le categorie diventano quelle del sito.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={btnP} onClick={applica}>Sì, importa</button>
            <button style={btnS} onClick={() => setFase("scegli")}>Annulla</button>
          </div>
        </div>
      )}
      {fase === "lavoro" && <p style={{ color: "#1D4ED8", fontWeight: 600 }}>Importazione in corso… non chiudere la pagina.</p>}
      {fase === "errore" && (
        <div style={{ ...card, borderLeft: "4px solid #EF4444", maxWidth: 640 }}>
          <p style={{ margin: "0 0 12px" }}>L'importazione si è interrotta, probabilmente per la connessione. Puoi riprovare: i prodotti già salvati non vengono duplicati.</p>
          <button style={btnP} onClick={applica}>Riprova</button>
        </div>
      )}
    </div>
  );
}
