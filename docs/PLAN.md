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
> **Status 2026-09-28:** the island concept was dropped as too gamified. The app is now a time portfolio (mockup: https://claude.ai/artifact/8uH2ApkHj2GWH68YArfqh5). Phase 1 is built: onboarding (EN/UK/PL), portfolio, asset detail, analytics, goals, log, settings. Phase 2 below describes the old 3D island and is kept for history; its charts part is done with react-native-svg.

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

## Ideas backlog (not scheduled, decide later)
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
