# App assets

Drop these three PNGs here (via the GitHub web UI — binary uploads):

- `icon.png` — 1024×1024, the owl on the coral→purple gradient
- `adaptive-icon.png` — 1024×1024 foreground (owl with padding; bg color is `#f2668b` in app.json)
- `splash.png` — 1284×2778, coral background with the owl

Ready-made files are waiting in the design folder — just upload them with these exact names.

> Until these land, `npx expo-doctor` shows 1 expected failure
> (`cannot access file at './assets/adaptive-icon.png'`). It clears
> the moment the PNGs are in place — everything else already passes.
