# Owly

**Never miss an expiry.** Owly watches your passports, licenses, visas and insurance —
and nudges you *before* they expire. No spreadsheets, no panic.

Your documents never leave your phone. Local-first, encrypted, private by design.

## Status

🚧 **Milestone 1** — project foundation: Expo + React Native app shell, brand theme,
animated Owly mascot, welcome screen.

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Repo + scaffold — app shell, theme, Owly mascot, welcome screen | ✅ |
| 2 | Home screen — header card, alert banner, doc sections, search, Owly on duty | ⬜ |
| 3 | Mission Control — week strip, urgency hero, health score, calendar export | ⬜ |
| 4 | Add/edit flow — 3-step form, nudge picker, per-nudge times, delete | ⬜ |
| 5 | Detail screen — countdown, checklist, comments, renew flow, partner links | ⬜ |
| 6 | Profile / People / Security + PIN / Notifications | ⬜ |
| 7 | Polish + v1.0 — real app icon, final README, store assets | ⬜ |

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
  app/            # screens — every file is a route (Expo Router)
    _layout.js    # root layout: fonts + navigator
    index.js      # welcome screen
  components/     # reusable UI (Owly, …)
  data/           # seed data, categories, partner links
  lib/            # date helpers etc.
  theme.js        # brand tokens: colors, fonts, radii
```

## Privacy

Owly is local-first. Documents, reminders and comments are stored encrypted on the
device. There is no server, no account, and nothing to leak.
