# Owly

**Never miss an expiry.** Owly watches your passports, licenses, visas and insurance —
and nudges you *before* they expire. No spreadsheets, no panic.

Your documents never leave your phone. Local-first, private by design.

## Status

✅ **Milestone 6** — the full v1 feature set is built: Home, Summary, Detail,
Nudges, Add/Edit (+ document scanning), Profile, People, PIN lock,
Notifications, and the nudge inbox. Remaining: upload the PNG assets
(icon, splash, screenshots) via GitHub web.

## Screens

| Welcome | Home | Detail | Add |
|---|---|---|---|
| ![Welcome](docs/screens/welcome.png) | ![Home](docs/screens/home.png) | ![Detail](docs/screens/detail.png) | ![Add](docs/screens/add.png) |

| Summary | Coverage | Profile | Inbox |
|---|---|---|---|
| ![Summary](docs/screens/summary.png) | ![Coverage](docs/screens/coverage.png) | ![Profile](docs/screens/profile.png) | ![Inbox](docs/screens/inbox.png) |

*Screenshots are refreshed every milestone. PNGs live in `docs/screens/`.*

## Milestones

| # | Milestone | Status |
|---|-----------|--------|
| 1 | Repo + scaffold — app shell, theme, Owly mascot, welcome screen | ✅ |
| 2 | Home + Summary + tab navigation — de-duplicated screens, search, filters | ✅ |
| 3 | Detail screen — countdown, "Expiry date" + did-you-renew flow, renewal history, dedicated Nudges screen, partner links | ✅ |
| 4 | Add/edit flow — 3-step form reusing the Nudges screen, per-nudge times, delete + AsyncStorage persistence | ✅ |
| 5 | Profile / People / Security + PIN / Notifications / nudge inbox | ✅ |
| 6 | Polish + v1.0 — document scanning (OCR), app icon + splash config, store listing | ✅ |

## Tech

- **Expo** + **React Native** (JavaScript) — one codebase, iPhone + Android
- **Expo Router** — file-based navigation (`src/app/`)
- **react-native-svg** — Owly the mascot, drawn in code
- **AsyncStorage** — on-device persistence (docs, people, settings)
- **expo-secure-store** — app PIN in the OS keychain (AsyncStorage fallback on web)
- **expo-audio** — notification tones, synthesized in code (no audio files)
- **expo-camera** — document scanning (photo → OCR → expiry date)
- No backend. No account. No cloud.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (iOS / Android) to run it on your phone.

> **Note:** `expo-audio` and `expo-secure-store` need native modules. Sound previews
> and the keychain-backed PIN work fully in a development build
> (`npx expo run:android` / `eas build --profile development`); in Expo Go the
> PIN falls back to on-device storage and sounds may not preview.

## Project layout

```
src/
  app/                     # screens — every file is a route (Expo Router)
    _layout.js             # root: fonts, hydration, PIN lock gate
    index.js               # welcome screen
    (tabs)/
      _layout.js           # bottom tabs: Home | + | Summary
      home.js              # action list: hero, search, filters, doc sections
      summary.js           # overview: stats, chart, categories, coverage
    add.js                 # add/edit flow (3 steps, ?edit=<id> for editing)
    coverage.js            # drill-down: per-person document coverage
    doc/[id]/
      index.js             # detail: countdown, rows, checklist, history, comments
      nudges.js            # dedicated nudge manager (never inside the edit form)
    inbox.js               # nudge inbox: upcoming + past, per-nudge delete
    people.js              # people management
    profile.js             # profile hub
    security.js            # app PIN setup / change / remove
    notifications.js       # notification preferences
  components/              # reusable UI
    Owly.js                # the mascot (animated SVG)
    DocIcon.js / DocRow.js / TopBar.js
    RowItem.js             # settings-style row
    OptionSheet.js         # bottom-sheet option picker (replaces Alert)
    CalendarSheet.js       # month calendar picker (pure JS)
    TimeSheet.js           # hour/minute/AM-PM wheel picker (pure JS)
    NudgeList.js           # nudge manager (shared by Nudges screen + add flow)
    Comments.js            # per-doc comments with @-mentions
    PinPad.js              # 4-digit PIN pad
  data/seed.js             # categories, partners, sounds, seed docs/people
  lib/                     # dates, nudges, sounds (synthesized), pin, format
  store.js                 # tiny store: docs/people/settings + AsyncStorage
  theme.js                 # brand tokens: colors, fonts, radii
```

## Privacy

Owly is local-first. Documents, reminders and comments are stored on the device
(AsyncStorage) — there is no server, no account, and nothing to leak. The optional
app PIN is kept in the OS keychain via expo-secure-store.
