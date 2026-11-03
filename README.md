# Owly

**Never miss an expiry.** Owly watches your passports, licenses, visas and insurance —
and nudges you *before* they expire. No spreadsheets, no panic.

Your documents never leave your phone. Local-first, encrypted, private by design.

## Status

🚧 **Milestone 2** — Home + Mission Control + tab navigation. Home is the action
list, Summary is the overview — no more duplicated document lists.

## Screens

| Welcome | Home | Summary |
|---|---|---|
| ![Welcome](docs/screens/welcome.png) | ![Home](docs/screens/home.png) | ![Summary](docs/screens/summary.png) |

*Screenshots are refreshed every milestone. PNGs live in `docs/screens/`.*

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Repo + scaffold — app shell, theme, Owly mascot, welcome screen | ✅ |
| 2 | Home + Summary + tab navigation — de-duplicated screens, search, filters | ✅ |
| 3 | Detail screen — countdown, "Expiry date" + did-you-renew flow, renewal history, dedicated Nudges screen, partner links | ⬜ |
| 4 | Add/edit flow — 3-step form reusing the Nudges screen, per-nudge times, delete | ⬜ |
| 5 | Profile / People / Security + PIN / Notifications / nudge inbox | ⬜ |
| 6 | Polish + v1.0 — real app icon, splash, final README, store assets | ⬜ |

## Tech

- **Expo** + **React Native** (JavaScript) — one codebase, iPhone + Android
- **Expo Router** — file-based navigation (`src/app/`)
- **react-native-svg** — Owly the mascot, drawn in code
- No backend. Data lives on-device (AsyncStorage, encrypted).

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (iOS / Android) to run it on your phone.

## Project layout

```
src/
  app/               # screens — every file is a route (Expo Router)
    _layout.js       # root layout: fonts + navigator
    index.js         # welcome screen
    (tabs)/
      _layout.js     # bottom tabs: Home | + | Summary
      home.js        # action list: hero, search, filters, doc sections
      summary.js     # overview: week strip, urgency hero, health, stats
  components/        # reusable UI (Owly, DocRow, DocIcon, TopBar, …)
  data/              # seed data, categories, partner links
  lib/               # date + nudge + text helpers
  store.js           # tiny in-memory store (persistence lands later)
  theme.js           # brand tokens: colors, fonts, radii
```

## Privacy

Owly is local-first. Documents, reminders and comments are stored encrypted on the
device. There is no server, no account, and nothing to leak.
