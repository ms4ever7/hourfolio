# Plan: Personal "many-hobbies" momentum app + learning AI tooling by building it

## Context
People with many parallel pursuits (music, sport, coding, learning, collecting…) have no tool that shows momentum across all of them without punishing breadth the way streaks do. Hourfolio treats time as capital, counts rest as a positive activity, and is built first for its author and then for anyone with the same problem. Target device: iPhone; the author's wearable is a **Fitbit Air, which syncs to Google Health (not Apple Health)**. There's no backend in v1. The project is also a hands-on way to learn Claude and the wider AI tooling world (models, MCP, skills, subagents, hooks) by using each piece while building.

## Name: **Hourfolio** (renamed 2026-09-28)
- The concept moved from an island world to a time portfolio, so the name changed from Questisle to Hourfolio. Bundle id: `com.ms4ever7.hourfolio`. Folder: `~/Documents/hourfolio/`.
- hourfolio.com was unregistered and the App Store had no exact match on 2026-09-28. Still check hourfolio.app, the App Store Connect name reservation and a trademark search before release.

### Earlier name: Questisle (quest + isle), kept for history
- App Store listing: "Questisle: Grow Every Hobby". Bundle id: `com.roman.questisle`. Folder: `~/Documents/questisle/`.
- A web search found no app or brand with this name. Before any public release, check the App Store Connect name reservation and a trademark search.
- **Rejected:** Sidequest (5+ apps, 2 in the same concept); Tend, Grove, Facets, Lagoon, Everbloom and Hobbyland (same space); Tidepool, Myriad and Wayfarer (big brands); Atoll (noisy: a Mac app, a coral app, RF software).
- **Market lesson:** "one plant per habit, rest without death" is already crowded (Tend, Grove, Nurture, Habit Plant). We differentiate on **many hobbies/identities + energy-type balance + readiness-aware rest + an expanding island world**. The name points to the island format. Each hobby is a quest-isle.

## Growth model: two layers per hobby (so everything can keep growing)
- **Mastery** is cumulative and never decreases. It drives level and visual evolution (sprout → tree → blossoming, or tent → cabin → studio), with no ceiling.
- **Momentum** is recent activity. It drives how "alive" a hobby looks (bloom, lights on). It fades slowly toward a calm resting state and never becomes a punishment.
- **Rest** is a logged activity. It boosts the whole world (rain or sun on the garden, a campfire on the island).

## Stack: a production-style Expo setup, minus the backend pieces
- Expo SDK 57, expo-router, RN 0.86, React 19, strict TypeScript, bun pinned via mise (Node 22)
- Restyle theme plus Box/HStack/VStack/Text primitives, reanimated 4, skia (growth visuals), victory-native (charts)
- zustand persisted to **react-native-mmkv**, with react-hook-form and zod for forms
- jest-expo with @testing-library/react-native, Maestro for end-to-end tests, ESLint flat config
- EAS dev-client build (HealthKit won't run in Expo Go)
- **Dropped:** TanStack Query, MSW, Firebase, Sentry, Braze, i18n (add later)
- Location: a new folder `~/Documents/<app-name>/` with its own `git init`
- Project skills to write: `new-screen`, `new-component`, `add-store`, `add-form`

## Core domain model
- `Hobby { id, name, icon, color, energyType, cadence, worldObject }`, where `worldObject` is the plant, building or zone id plus its evolution stages
  - `energyType`: creative | physical | career | financial | collecting-leisure
  - `cadence`: a target like "2x/week", "weekly" or "whenever" (anime and cards count as "whenever", so they never nag)
- `LogEntry { id, hobbyId | 'rest', date, durationMin?, intensity 1–3, mood?, note? }`. Rest is a first-class entry.
- `HealthDay { date, sleepMin, restingHr, hrv?, steps, readiness? }`, pulled from the health source
- **Mastery math:** cumulative weighted sessions (duration × intensity) mapped to levels on a gentle curve with no cap.
- **Momentum math:** jumps when you log the hobby, then decays exponentially with a half-life scaled to its cadence. It has a floor of about 20%, so a hobby never dies, it just rests. A weekly "balance" view shows the spread across energy types, and rest days on low-readiness days get highlighted as good choices.
- Gentle copy engine: plain rules like "3 creative sessions this week 🎸" or "Low sleep, rest was the right call." No guilt language.

## Phases
> **Status 2026-09-28:** the island concept was dropped as too gamified. The app is now a time portfolio (mockup: https://claude.ai/artifact/8uH2ApkHj2GWH68YArfqh5). Phase 1 is built: onboarding (EN/UK/PL), portfolio, asset detail, analytics, goals, log, settings. Phase 2 below describes the old 3D island and is kept for history; its charts part is done with react-native-svg. Next up: MVP 2 (see below).

**Phase 0: Decide the look (about 1–2 days)**
- Build 3 clickable HTML mockups of the home screen, all using Roman's real hobbies, published as one private Artifact with a switcher between them:
  - (a) **garden**: each hobby is a plant
  - (b) **island with buildings**: an original island, not One Piece themed
  - (c) **island-garden hybrid**, which could have a small character as a later add-on
- Each mockup shows both layers: a mastery level and a momentum bloom. Pick one after seeing them.
- Spike: check how to get Fitbit Air data onto an iPhone (see Risks).

**Phase 1: Skeleton, local only**
- Scaffold the Expo app, theme, tabs (Today · Growth · Log · Settings) and the MMKV-persisted stores (`hobbies`, `logs`).
- **Onboarding** (what makes it "built for others"):
  1. Pick hobbies from a preset catalog of about 40 (guitar, drums, reading, crossfit, DJ, coding, card collecting…), or type a custom one.
  2. Each preset comes with a pre-made mapping: energy type, cadence, and the plant, building or zone it becomes in the chosen world. The catalog lives as a local JSON file, so it works offline and costs nothing.
  3. For a custom hobby, AI suggests the mapping, e.g. "Pottery → creative, weekly, clay-pot flower / kiln workshop", and the user confirms or tweaks it. v1 uses on-device **Apple Foundation Models** (iOS 26+, free, no backend). The fallback is a manual picker (energy type → a list of matching plants or buildings). A Claude Haiku call through a tiny proxy can come later, in Phase 4.
- Quick-log sheet (TrueSheet): hobby, duration, intensity, with "Rest" as a big friendly button.
- Unit tests for the vitality and decay math.

**Phase 2: Visualization (decided 2026-09-26: 3D archipelago)**
- The home screen is a 3D ocean built with **@react-three/fiber/native, expo-gl and three**. It ports the v2 mockup (https://claude.ai/artifact/NyTn1EkF6ZyoPfuBxw3afK): wave-displaced low-poly sea with lagoon colouring, one island per hobby, a camera flight to the tapped island, and a bottom sheet with Log, Prev and Next.
- Each hobby has its own landmark with 5 stages (lighthouse → grand beacon, and so on). Mastery drives island radius, tree count and landmark stage. Momentum drives the glow ring, sparkles, lit windows and a sleepy cloud. Rest turns the world to night and calms the sea.
- Art path: primitives now, then Kenney CC0 GLB kits or custom low-poly models (AI-generated references → Blender or Meshy). Load them with `useGLTF` and expo-asset.
- Skia and victory-native are still used for the flat charts (weekly balance, heatmap).
- Risk: R3F on RN is fine for about 10 low-poly islands but needs testing on a real device early (FPS, battery). Fallback: pre-rendered sprites per stage.
- Weekly balance chart (victory-native) and a history heatmap per hobby.
- Copy engine for encouraging messages.

**Phase 3: Health data**
- iOS HealthKit via `@kingstinct/react-native-healthkit` (a config plugin that works with Expo), reading sleep, HR, HRV, steps and workouts. This catches anything the Fitbit/Google Health app or Apple Fitness writes into HealthKit.
- Fitbit/Google Health API directly (OAuth PKCE from the app, tokens in expo-secure-store), if the spike shows HealthKit doesn't get the data.
- Auto-suggest a "crossfit" log when a workout shows up, and nudge toward rest when readiness is low.

**Phase 4 (optional): Share and AI**
- TestFlight for friends.
- Optional weekly "reflection" summary written by an LLM (Claude Haiku is cheap, or on-device Apple Foundation Models). This is the first point where a small backend or proxy might be needed, to keep API keys off the device.

## MVP 2: make it personal and shareable (planned 2026-09-28)

> **Status 2026-09-28 (built, PR #1 `mvp2-personal-and-shareable`):** 2.1–2.5 are built and running on a real iPhone 14 Pro. What was built:
> - Profile tab: preset emoji-character or photo avatar, name, and language as a sheet.
> - Appearance: system, light or dark; any accent (native color picker); any page color, where text and cards adapt; 8 accent-colored patterns.
> - Asset faces: icon, emoji or photo, plus a rename.
> - Goal scenes: dog, tree, rocket, cat or bar.
> - A congrats screen with confetti and share cards (goal and week).
> - The Sunday nearly-there reminder, confirmed arriving on the device.
> - Halloween and winter themes with the Pumpkin and Winter (wreath) icons.
>
> Still to check on the device: switching the app icon, and picking photos. Session notes:
> - The winter icon is a wreath rather than a tree, to keep the ring-clock brand mark. Redraw it if a tree is wanted.
> - Device builds are signed with the free personal team (`ios.appleTeamId` 2RMJ37733D), so an install lasts 7 days. `plugins/without-push-entitlement.js` strips `aps-environment`, which expo-notifications adds by itself.
> - The photo permission text in `app.json` is English only.
> - A 10-second test reminder button was used to verify notifications, then removed from the PR on purpose.

### Where MVP 1 left off
- Tabs: Portfolio · Analytics · (+ Log) · Goals · Settings. Onboarding, asset detail and the goals editor are separate screens.
- Settings is a whole tab, and most of it is the language picker (EN/UK/PL), plus custom asset, demo data and reset.
- Assets show one of 25 built-in line icons (`IconKey`) in one of 8 palette colors (`PaletteKey`).
- Weekly goals on the Goals tab are plain progress bars with a small "met" badge. No celebration, nothing to share.
- Light theme only. The accent is fixed to the `hours` blue.

### 2.1 Profile tab (replaces Settings)
- Rename the Settings tab to **Profile**. At the top: avatar, name and a short summary (total capital, number of assets, weeks active).
- **Avatar:** pick a ready-made picture from a grid, like choosing a profile on Netflix or PlayStation: animals, a few original characters, maybe themed sets (music, sport, space). Or use your own photo.
  - The art must be ours or CC0/licensed. We can't use characters from real TV shows or films (copyright). Images ship in the app bundle, so it stays offline.
- **Appearance**, like Telegram's chat settings: a live preview at the top, then
  - accent color from a set of presets, or **any color from the full gamut** (the native iOS color picker: grid, spectrum, sliders). It replaces the `hours` blue in buttons, the tab bar and highlights. A picked color is adjusted for contrast, so text on it and in it stays readable.
  - light / dark / system
  - **page backgrounds** (added 2026-09-28): plain, glow, sunrise, dots, grid, waves, clocks, bubbles. All drawn faintly in the accent color behind every screen, so the whole app changes, not just the buttons.
- **Language** becomes one row ("Language · Українська ›") that opens a small sheet, not a whole page.
- The rest stays as rows: add custom asset, demo data, reset.
- Tech: `settings-store` gains `profile { name, avatar }` and `appearance { accent, mode }`. The Restyle theme becomes a function of those, with a dark variant of every token. Photo avatars use `expo-image-picker` and are copied into the app's document directory (check the SDK 57 docs for `expo-file-system`).
- Decided: the unit colors (hours blue, minutes amber, days teal) stay fixed when the accent changes. The accent only colors the UI chrome.

### 2.2 A face for every asset: photo or emoji
- In the asset editor, choose one of: built-in icon (as now), **emoji** (the iOS emoji keyboard or a picker), or **your own photo** (your guitar, your bike).
- Photos are cropped to a circle or rounded square, stored locally and shown everywhere `AssetIcon` is used today, with the palette color as a ring or tint.
- Tech: `Asset.icon` becomes a union: `{ kind: 'icon', key } | { kind: 'emoji', char } | { kind: 'photo', uri }`, plus an MMKV migration for existing portfolios. `AssetIcon` renders all three.
- Related backlog idea: photos per session ("memories"). Keep that separate, but reuse the same image storage.

### 2.3 Weekly goals come alive, with a congrats and a share card
- Replace the flat bars on the Goals tab with a small scene that fills up as the week's goal gets closer, for example:
  - a dog running toward a bone
  - a tree growing from a seed to full leaf
  - a cup filling up, a mountain climber near the top
  - the user picks a scene per asset or for all of them
- It only moves forward. If you log less, the scene stays where it is and resets calmly on Monday: no wilting and nothing sad (the no-guilt rule).
- **Congrats** when a weekly goal is met: a full-screen moment with the finished scene, a haptic and some confetti, shown once per goal per week. There's a softer one when *all* weekly goals are met.
- **Share:** a nicely designed card (the scene, the asset, hours this week, the Hourfolio mark) rendered to an image and shared through the iOS share sheet to Telegram, Threads, Instagram Stories and so on. Also a "My week" card from Analytics.
- Tech: scenes in `react-native-svg` or Skia plus reanimated, driven by one `progress` 0..1 value. Share via `react-native-view-shot` (or Skia's snapshot) plus `expo-sharing`. Instagram Stories has its own URL scheme for a sticker background, so treat that as a follow-up. Congrats state ("shown for goal X in week Y") lives in the store.

### 2.4 Nearly-there reminder (added 2026-09-28)
- One local notification on Sunday at 17:00 when a weekly goal is nearly met: at most 30% and at most 2 h left. For example "Guitar is almost there: 25 min more and this week's goal is met. Only if it feels right."
- Off by default, switched on in Profile → Notifications. Never about goals that are far from done or missed (the no-guilt rule).
- Tech: `expo-notifications`, local only. The reminder is rescheduled whenever sessions change, so its text is current. The expo-notifications config plugin is left out on purpose: it adds the push entitlement, which the free Apple team can't sign and local notifications don't need. Real push from a server would need a backend and a paid developer account.

### 2.5 Seasonal themes and app icons
- For holidays and occasions (Halloween, Christmas and New Year, Easter, maybe Ukrainian and Polish holidays), offer a **seasonal theme**: accent colors, a small decoration on the Portfolio header, seasonal scenes for 2.3 (a pumpkin instead of a bone).
- **Alternate app icons:** a pumpkin icon, a Christmas tree icon and so on, chosen in Profile → Appearance.
  - iOS doesn't let an app change its icon silently: every change shows a system alert. So the app *suggests* the seasonal icon ("It's October, try the pumpkin icon?") and the user taps to switch, rather than switching on its own.
- Tech: the icons are set at build time through a config plugin (check what fits SDK 57; don't edit `ios/` by hand). Seasonal dates live in a small local calendar in `src/domain/`, so it works offline.

### 2.6 Finishing MVP 2 (added 2026-09-29)
- **Emoji picker** (done): the whole iOS-style emoji set in keyboard groups, recent picks, and search in the app language or English. Data comes from emojibase-data (MIT) via `scripts/build-emoji.mjs`, limited to Emoji 15.1 so nothing renders as an empty box.
- **Your day + evening check-in** (done): onboarding ends with wake and bed times (defaults 07:00 and 23:00). An opt-in note comes an hour before bed, only on days with nothing logged yet: "Anything to add for today? Rest counts too." Every other evening it names the asset that has rested longest. It never says "you didn't log". Tapping it opens the log sheet. The wake time is kept for the morning suggestion later.
- **Home research**: looked at Oura, Whoop, Headspace, Toggl, Duolingo, Rise, Finch and 100hours. Three directions are in https://claude.ai/artifact/GoBZpBxtyJZuaiyP9EKiAf, B (week first) was recommended, and the user chose A (today first).
- **New home** (done, direction A): today first, then one-tap log chips, this week's goal scenes, a grey note when an asset is paused, and the assets with their capital. The charts moved to Analytics.
- **Onboarding shows the new features** (done): a scene picker with a live preview in the goal step (the tree is the default), both reminders in "Your day", and an optional "Make it yours" step (name, picture, color). Sharing is found at the first congrats, and holiday themes through the Profile banner.
- **README** (done): screenshots and a congrats GIF, taken by the Maestro flows in `e2e/` (`onboarding.yaml`, `tour.yaml`, `goal-met.yaml`).
- **Later (MVP 3):** a morning suggestion from Apple Health / Google Health readiness, falling back to the asset that has rested longest; product analytics (PostHog or Aptabase, opt-in, no hobby names or notes).

### Order and scope
1. 2.1 Profile + language row + accent and dark mode. This is the base for everything visual.
2. 2.2 Emoji and photo for assets.
3. 2.3 Goal scenes, congrats, share card.
4. 2.4 Nearly-there reminder.
5. 2.5 Seasonal themes and icons (time the first one for Halloween or Christmas 2026).
- Money invested was moved to the backlog on 2026-09-28 (not in MVP 2).
- Each step: i18n in EN/UK/PL (no gendered forms), unit tests for new domain logic, a Maestro flow for the new screen, typecheck + lint + test.

## Ideas backlog (not scheduled, decide later)
- **Money invested** (taken out of MVP 2 on 2026-09-28): log money put into an asset (gear, lessons, subscriptions) next to hours; show total and cost per hour; maybe a saving goal. Needs a `MoneyEntry` type, a currency setting and stats helpers.
- **Live session timer:** start a session ("playing guitar now"), stop it and the duration is logged. It could also show up as a Live Activity on the lock screen.
- **Photo and note memories:** attach a photo to a session and build a gallery per asset, so the numbers have moments next to them.
- **Health auto-logging:** already Phase 3. The competitor below shows people value it.
- **Real on-device AI for custom assets:** swap `suggestSetup` for Apple Foundation Models, keeping the same signature.

## Competitors
- **100hours – Track What You Love** (App Store id6748762146, launched July 2025, no US ratings yet as of 2026-09-28). A calm hobby diary: HealthKit and Apple Watch auto-logging, a photo "memories wall", 140+ templates, 7 goal types, a timer, iCloud sync. The free tier is limited to 3 hobbies and analytics is "coming soon".
- **Where Hourfolio differs:** unlimited assets as the core idea, not an upsell. The portfolio metaphor: capital never goes down, allocation, change vs the last period. Momentum with a floor instead of "you haven't done X" nudges. Recovery counts as an asset. Energy balance across body, creative, mind and recovery.
- **App Store naming:** keep the brand short and put descriptive words in the name suffix and subtitle, e.g. "Hourfolio: Invest in Yourself" / "Track time across all hobbies".

## AI-learning track (one new concept per phase)
| Phase | Concept to learn by doing |
|---|---|
| 0 | **Plan mode** and **Artifacts** (mockups). Compare image models (GPT Image, Gemini/Imagen, FLUX) for the app icon and illustrations. |
| 1 | **CLAUDE.md** (project memory), **skills** (project-specific), **auto-memory** |
| 2 | **Subagents** (a UI-evaluator agent), `/code-review`, `/simplify` |
| 3 | **MCP**: add Maestro MCP (done, see `.mcp.json`) to drive e2e tests on the simulator. Try the Expo MCP too. |
| 3 | **Hooks**: auto-run `tsc` and ESLint after edits, in `.claude/settings.json` |
| 4 | **Claude API / Agent SDK**: build the reflection feature, then compare Haiku, Sonnet and Opus, plus a local model via Ollama, on cost, speed and quality |
| Ongoing | A short personal doc on when to use which model (Opus for planning and hard bugs, Sonnet for bulk coding, Haiku for cheap automation, Gemini for long context, GPT or FLUX for images) |

## Risks
- **Fitbit on iPhone:** Fitbit has historically *not* written to Apple Health, and the Google Health rebrand may or may not have changed that. The Phase 0 spike checks what shows up in HealthKit. Fallback: the Google/Fitbit Web API, which is cloud OAuth. It works without our own backend, but readiness scores may need Premium.
- **HealthKit needs a dev build and an Apple Developer account** ($99/yr) to install on a real phone for longer than a week.
- Scope creep. The first milestone is logging plus vitality, used daily for 2 weeks, before anything fancy.

## Verification
- `bunx tsc --noEmit`, `bun test` (vitality math, stores) and `bunx eslint .` all pass. `expo-doctor` is clean.
- Maestro flow: onboarding, then add 3 hobbies, log a guitar session, log rest, and check the Growth screen shows vitality changes.
- Manual: a dev build on his iPhone shows real HealthKit data (Phase 3), and 2 weeks of real personal use gives a feel for the decay tuning.
