# Skyte AI 🟠

Dein persönlicher KI-Assistent im Jarvis-Stil — mit Claude-inspiriertem Interface, Sprachein- und -ausgabe und einem Dashboard für deine Ziele und Pläne.

![Modus](https://img.shields.io/badge/Modus-Demo%20%2B%20Claude--API-D97757)

## Funktionen

- 💬 **Chat** — schreibe oder **sprich** mit Skyte AI (Mikrofon-Button)
- 🔊 **Sprachausgabe** — Antworten werden auf Wunsch vorgelesen
- 🎯 **Ziele** — sag einfach „Mein Ziel ist …" und es landet im Dashboard
- 🗂️ **Plan-Board** — Pläne mit Status *Geplant / In Arbeit / Fertig* („Plane Einkaufen am Samstag", „Einkaufen ist fertig")
- 🌐 **Deutsch ⇄ Englisch** umschaltbar (Kopfzeile oder Einstellungen)
- 🧠 **Demo-Modus ohne Kosten** — funktioniert sofort ohne API-Key; mit Anthropic API-Key antwortet der echte Claude und verwaltet dein Dashboard selbstständig
- 💾 Alle Daten bleiben **lokal in deinem Browser** (localStorage)

## Schnellstart

Voraussetzungen: [Node.js](https://nodejs.org) 18 oder neuer.

```bash
npm install
npm run dev
```

Dann im Browser öffnen: **http://localhost:5173**

> **Wichtig für Spracheingabe:** Die Spracherkennung (Mikrofon) funktioniert nur in **Chrome** oder **Edge**. Die Sprachausgabe funktioniert in allen gängigen Browsern.

## Echten Claude anschließen (optional)

1. Konto auf [console.anthropic.com](https://console.anthropic.com) erstellen und einen API-Key generieren (Nutzung kostet Geld pro Anfrage).
2. In Skyte AI: **Einstellungen → KI-Anbindung → Anthropic API-Key** einfügen.
3. Das Badge in der Kopfzeile wechselt von „Demo" zu „Claude" — ab jetzt antwortet der echte Claude und kann deine Ziele/Pläne selbstständig anlegen und aktualisieren.

⚠️ **Sicherheitshinweis:** Der Key wird nur im localStorage deines Browsers gespeichert und direkt von deinem Browser an die Anthropic-API gesendet. Das ist für die lokale Nutzung gedacht — **veröffentliche diese App niemals im Internet, solange ein Key eingetragen ist.**

## Befehle im Demo-Modus

| Du sagst/schreibst | Skyte AI macht |
|---|---|
| „Mein Ziel ist täglich lesen" | legt ein Ziel an |
| „Plane Einkaufen am Samstag" | legt einen Plan an |
| „Einkaufen ist fertig" | setzt den Plan auf „Fertig" |
| „Was ist geplant?" | listet alle Pläne |
| „Meine Ziele" | listet alle Ziele |
| „Hilfe" | zeigt alle Befehle |

## Technik

Vite + React 18 + TypeScript · zustand (State + localStorage-Persistenz) · Web Speech API (STT/TTS) · @anthropic-ai/sdk. Keine Datenbank, kein Backend — eine einzige lokale App.

---

## English

**Skyte AI** is a personal Jarvis-style AI assistant with a Claude-inspired interface, voice input/output, and a dashboard for your goals and plans.

**Quick start:** requires Node.js 18+. Run `npm install && npm run dev`, then open http://localhost:5173. Voice input requires Chrome or Edge.

**Demo mode** works without any API key. To connect the real Claude, create an API key at [console.anthropic.com](https://console.anthropic.com) and paste it under *Settings → AI Connection*. The key is stored only in your browser's localStorage and sent directly to the Anthropic API — never host this app publicly with a key configured.

Try: "My goal is to read every day" · "Plan grocery shopping on Saturday" · "Grocery shopping is done" · "What's planned?" — switch the UI language with the DE/EN toggle in the header.
