@AGENTS.md

# Hourfolio

A time portfolio: every hobby is an asset, hours are the currency. Local-only v1 (no backend).
Plan and history: `docs/PLAN.md`. Mockup: https://claude.ai/artifact/8uH2ApkHj2GWH68YArfqh5

## Commands
Run through mise so Node 22 and bun 1.3.14 are used:
- `mise exec -- bun run typecheck` / `lint` / `test`
- `mise exec -- bunx expo run:ios` (dev build; MMKV needs native code, so no Expo Go)
- Real iPhone: `mise exec -- bunx expo run:ios --device <udid>` (UDID from `xcrun devicectl list devices`), then launch it pointed at Metro. Signed with the free personal team, so installs expire after 7 days.
- Add Expo packages with `mise exec -- bunx expo install <pkg>`

## Project skills
- `.claude/skills/new-screen`: how to add or rebuild a screen (routes, building blocks, tokens, copy, checks).
- `.claude/skills/on-device`: build, install and launch on the real iPhone with Metro.

## Layout
- `src/domain/`: pure logic, fully unit-tested. `growth.ts` (capital never decreases; momentum decays toward a floor of 20, half-life set by the asset's rhythm), `stats.ts` (periods, allocation, energy balance, heatmap), `catalog.ts` (onboarding presets).
- `src/store/`: zustand persisted to MMKV (`portfolio-store`, `settings-store`); `onboarding-store` is in-memory.
- `src/i18n/`: EN/UK/PL as typed TS objects. `en.ts` is the source; other locales must have every key plus the plural forms their language needs (`i18n.test.ts` enforces both).
- `src/theme/theme.ts`: `buildTheme({ mode, accent, page })` builds the Restyle theme at runtime (`src/lib/appearance.ts` feeds it from settings and the holiday season). Use tokens, never hex: `accent`/`onAccent`/`accentInk`/`accentSoft` for UI chrome, `palette` for asset colors. Units of time keep fixed colors whatever the accent: hours `hours` (blue), minutes `minutes` (amber), days `days` (teal).
- `src/app/`: expo-router screens: `onboarding/*`, `(tabs)/*` (portfolio, analytics, goals, profile), `asset/[id]`, and the modals `log`, `asset-edit`, `avatar`, `language` (sheet), `congrats`, `share-week`, plus the pushed `appearance` screen.

## Rules
- No guilt: never show a loss in red, no streaks. Declines are grey; paused assets say "paused".
- Recovery (`RECOVERY_ID`) is in every portfolio and counts as an investment.
- All user-facing copy goes through i18n in all three languages. Avoid gendered forms in Ukrainian and Polish copy.
- `plugins/with-scene-lifecycle.js` makes the app adopt UIScene; without it, builds from the iOS 27 SDK crash at launch. Keep it until the Expo template does this itself.
- `plugins/without-push-entitlement.js` strips the push entitlement expo-notifications adds; the free team can't sign it and local reminders don't need it. Remove it only when server push (and a paid account) arrives.
- Test on an iOS 27 simulator (e.g. iPhone 18 Pro). Xcode 27's DeviceHub doesn't pass mouse clicks to old runtimes such as iOS 17.5.
