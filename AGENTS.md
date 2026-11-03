This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Lessons learned

- **Custom tab bar navigation (SDK 58):** the `navigation` prop passed to a custom
  `tabBar` was `undefined` when pressed (`Cannot read properties of undefined
  (reading 'navigate')`). For tab switching, use the global `router.push('/home')`
  from `expo-router` instead — with a `state.index` guard so tapping the active
  tab is a no-op.
- **Headless screenshots:** `npx expo export --platform web` → serve `dist/` with
  `python3 -m http.server` → screenshot with Playwright (`pip install
  --break-system-packages playwright` + `playwright install chromium
  --only-shell`; the bundled `/opt/meta-chromium/chrome` will NOT start from CLI —
  it needs the browser-daemon policy). Static export is a SPA: deep-link routes
  404 on a plain file server, so navigate in-page (click through) before
  screenshotting. Viewport 430x930 @2x for phone framing.
- **GitHub push limits:** the MCP `push_files`/`create_or_update_file` tools are
  **text-only** (no binary assets) and a single CLI arg caps around ~128KB —
  `package-lock.json` (276KB) cannot be pushed; it regenerates via `npm install`.

## Lessons
5. expo-linear-gradient crashes hard (`t.map` on undefined) when `colors` is undefined — e.g. a typo'd key like `gradients.purple` (real one is `gradients.brandPurple`). The minified stack points at `normalizeColor` inside a `useMemo`; check every `colors=` prop. Prefer a tiny helper that falls back to `gradients.brand` when the key is missing.
6. React Native Web's `Alert.alert()` is a no-op (`static alert() {}`) — any flow behind an Alert is untestable headless and invisible on web. User-facing confirmations and choices use the custom `OptionSheet` instead; keep `Alert` only for temporary "coming soon" placeholders.
7. SVG gradient IDs must be unique per icon instance (use React `useId`). DocIcon used `docg-<type>` — duplicate IDs across same-type icons on one screen made ALL of them render blank on web.
8. expo-secure-store is a no-op on web (native module is `{}`) — `setItemAsync` throws. `src/lib/pin.js` falls back to AsyncStorage when `isAvailableAsync()` is false, so the PIN feature works in the web demo too (less secure there; keychain on real phones).
