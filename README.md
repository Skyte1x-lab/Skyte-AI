# Skyte AI 🟠

Dein persönlicher KI-Assistent im Jarvis-Stil — mit Claude-inspiriertem Interface, Sprachein- und -ausgabe und einem Dashboard für deine Ziele und Pläne.

![Modus](https://img.shields.io/badge/Modus-Demo%20%2B%20Claude--API-D97757)

## Funktionen

- 💬 **Chat** — schreibe oder **sprich** mit Skyte AI (Mikrofon-Button), inkl. animiertem Skyte-Orb
- 🔊 **Sprachausgabe** — Antworten werden auf Wunsch vorgelesen
- 🎯 **Ziele** — sag einfach „Mein Ziel ist …" und es landet im Dashboard
- 🗂️ **Plan-Board** — Pläne mit Status *Geplant / In Arbeit / Fertig*, **Priorität** (Niedrig/Mittel/Hoch) und optionalem **Fälligkeitsdatum** — überfällige Pläne werden rot markiert
- 📝 **Notizen** — freie Notizen per Chat („Notiere: …") oder manuell im Dashboard
- ⏰ **Erinnerungen** — mit Datum/Uhrzeit, chronologisch sortiert, überfällige rot markiert
- ⏱️ **Fokus-Timer** — Pomodoro-Stil mit Presets, Signalton und optionaler Sprachansage bei Ablauf
- 🧠 **KI-Übersicht** — Kennzahlen-Kacheln im Dashboard (Ziele, Pläne, Notizen, Erinnerungen, Timer-Status)
- 🌗 **Hell-/Dunkelmodus** — manuell umschaltbar (Kopfzeile), Einstellung bleibt gespeichert
- 🌐 **Deutsch ⇄ Englisch** umschaltbar (Kopfzeile oder Einstellungen)
- 🧠 **Demo-Modus ohne Kosten** — funktioniert sofort ohne API-Key; mit Anthropic API-Key antwortet der echte Claude und verwaltet dein gesamtes Dashboard selbstständig
- 💾 Alle Daten bleiben **lokal in deinem Browser** (localStorage)

## Als Website öffnen (GitHub Pages)

Diese App lässt sich als echte Website hosten — ganz ohne eigenen Server, funktioniert auf PC und Handy:

1. Im GitHub-Repo einmalig: **Settings → Pages → Build and deployment → Source: „GitHub Actions"** auswählen.
2. Jeder Push auf den Branch `claude/skyté-ai-jarvis-interface-3bvwjo` baut die App automatisch (`.github/workflows/deploy-pages.yml`) und veröffentlicht sie unter `https://<dein-github-nutzername>.github.io/Skyte-AI/`.
3. Die URL einfach auf dem Handy oder PC im Browser öffnen — kein `npm run dev`, kein Terminal nötig. Zum Startbildschirm hinzufügen ("Zum Home-Bildschirm") funktioniert wie eine App.

Auf der gehosteten Seite funktionieren Mikrofon (Chrome/Edge, HTTPS) und ein eigener Claude-API-Key vollständig — anders als in eingebetteten Vorschau-Frames.

## Lokale Entwicklung

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
| „Plane Einkaufen, hohe Priorität, bis Montag" | legt einen Plan mit Priorität + Fälligkeitsdatum an |
| „Einkaufen ist fertig" | setzt den Plan auf „Fertig" |
| „Notiere: Milch kaufen" | legt eine Notiz an |
| „Erinnere mich an den Zahnarzttermin morgen um 15:00" | legt eine Erinnerung an |
| „Starte einen Timer für 25 Minuten" / „Stoppe den Timer" | steuert den Fokus-Timer |
| „Was ist geplant?" / „Meine Ziele" | zeigt eine Übersicht |
| „Hilfe" | zeigt alle Befehle |

> Die Datums-/Zeiterkennung im Demo-Modus ist bewusst einfach gehalten (Wochentage, „morgen"/„übermorgen", feste Uhrzeit-Syntax). Mit einem echten Claude-Key funktioniert freie Formulierung deutlich zuverlässiger.

## Technik

Vite + React 18 + TypeScript · zustand (State + localStorage-Persistenz) · Web Speech API (STT/TTS) · @anthropic-ai/sdk. Keine Datenbank, kein Backend — eine einzige lokale App.

---

## English

**Skyte AI** is a personal Jarvis-style AI assistant with a Claude-inspired interface, voice input/output, and a dashboard for your goals and plans.

**Quick start:** requires Node.js 18+. Run `npm install && npm run dev`, then open http://localhost:5173. Voice input requires Chrome or Edge.

**Demo mode** works without any API key. To connect the real Claude, create an API key at [console.anthropic.com](https://console.anthropic.com) and paste it under *Settings → AI Connection*. The key is stored only in your browser's localStorage and sent directly to the Anthropic API — never host this app publicly with a key configured.

Try: "My goal is to read every day" · "Plan grocery shopping high priority by tomorrow" · "Grocery shopping is done" · "Note: buy milk" · "Remind me to call the dentist tomorrow at 15:00" · "Start a timer for 25 minutes" · "What's planned?" — switch the UI language and light/dark theme with the toggles in the header.
