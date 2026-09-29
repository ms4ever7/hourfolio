<p align="center">
  <img src="docs/screenshots/icon.png" width="96" alt="Hourfolio app icon: a portfolio donut that is also a clock face">
</p>

<h1 align="center">Hourfolio</h1>

<p align="center">
  <b>Your time, invested.</b><br>
  A time portfolio for people with many hobbies. Every hobby is an asset, hours are the currency, and rest counts as an investment too.<br>
  <sub>iOS · English, Українська, Polski · local-first, no account</sub>
</p>

<p align="center">
  <img src="docs/screenshots/today.png" width="240" alt="Today: hours invested today by asset, one-tap log tiles, this week's goals as growing trees">
  <img src="docs/screenshots/goal-met.gif" width="240" alt="Logging a session completes a weekly goal: the congrats screen with confetti and a share card">
  <img src="docs/screenshots/today-dark.png" width="240" alt="The same screen in dark mode with a violet accent and a wave pattern">
</p>

## Why

Most habit apps reward one thing done every day and punish breaks with broken streaks. People with a guitar, a gym routine, a side project and a stack of books to read end up feeling behind on all of them.

Hourfolio does the opposite. It shows how your time is spread across everything you care about, and it never makes you feel guilty about it:

- No streaks, and no red numbers.
- A hobby on a break is **resting**, not failing.
- Rest is an asset in every portfolio.
- Reminders only ever say "you're nearly there" or "rest counts too". They never say "you missed".

## How it works

| | |
|---|---|
| **Capital** | Every hour you have put into a hobby, including the years before the app. It never goes down. |
| **Momentum** | Recent activity on a 0–100 scale. It fades during a break but never drops below 20, and it decays at each hobby's own rhythm (daily, a few times a week, weekly, whenever). |
| **Recovery** | In every portfolio. Rest days show up as their own thing, not as gaps. |
| **Energy balance** | Your time split into body, creative, mind and recovery. |
| **Weekly goals** | Optional. Progress is drawn as a small scene, like a tree growing or a dog running to its bone, and it only ever moves forward. |

## A tour

### Today and this week
The first screen shows today and this week, not a chart. It has what you did today, a row of one-tap tiles for what you usually do, this week's goals, and every asset with its capital. On an empty morning it asks "What are you investing in today?" instead of showing a zero.

<p align="center">
  <img src="docs/screenshots/today.png" width="200" alt="Today screen">
  <img src="docs/screenshots/goals.png" width="200" alt="Goals: weekly scenes, scene picker and milestones">
  <img src="docs/screenshots/asset.png" width="200" alt="Asset detail: capital, momentum, hours per week">
</p>

### Analytics
The charts live one tab over:
- hours for the week, month, year or all time, against the previous period;
- time allocation;
- per-asset trends;
- energy balance and a monthly calendar where recovery days have their own color.

<p align="center">
  <img src="docs/screenshots/analytics.png" width="200" alt="Analytics: cumulative hours against last month and time allocation">
</p>

### Goals you want to share
Finishing a weekly goal opens a congrats screen with confetti and a share card, rendered as a PNG for Telegram, Threads, Instagram or anywhere else. There's also a "My week" card.

<p align="center">
  <img src="docs/screenshots/goal-met.gif" width="200" alt="Congrats animation">
  <img src="docs/screenshots/share-week.png" width="200" alt="Share my week card">
</p>

### Make it yours
- **Profile:** a preset character or your own photo as your picture.
- **Appearance:**
  - light, dark or system mode;
  - any accent color from the full iOS color picker;
  - any page color, with text and cards adjusting to stay readable;
  - eight background patterns.
- **Assets:** each one can show an icon, an emoji (a full picker with search in all three languages) or a photo of your own guitar.
- **Units:** hours, minutes and days keep their colors whatever you pick.

<p align="center">
  <img src="docs/screenshots/profile.png" width="200" alt="Profile">
  <img src="docs/screenshots/appearance-dark.png" width="200" alt="Appearance: mode, page color, accent, patterns">
</p>

Holidays dress the app up. From mid-October the accent turns pumpkin, the scenes get holiday props, and you can switch to a holiday app icon, or have it switch by itself.

<p align="center">
  <img src="docs/screenshots/icon.png" width="64" alt="Classic icon">
  <img src="docs/screenshots/icon-pumpkin.png" width="64" alt="Pumpkin icon for Halloween">
  <img src="docs/screenshots/icon-winter.png" width="64" alt="Winter wreath icon for the winter holidays">
</p>

### Onboarding and gentle reminders
1. Pick from 35 activities or add your own.
2. Tune each one: color, rhythm, starting capital and an optional weekly goal, with a live preview of its scene.
3. Tell the app when your day starts and ends.
4. Add a name, picture and color (optional).

There are two reminders, both off until you turn them on:
- **Evening check-in:** one note an hour before bed, only on days with nothing logged yet.
- **Nearly-there reminder:** one note on Sunday when a weekly goal is almost met.

<p align="center">
  <img src="docs/screenshots/welcome.png" width="180" alt="Welcome">
  <img src="docs/screenshots/setup-goal.png" width="180" alt="Setting a weekly goal and choosing the tree scene">
  <img src="docs/screenshots/day.png" width="180" alt="Your day: wake and bed times, reminders">
  <img src="docs/screenshots/you.png" width="180" alt="Make it yours: name, picture, color">
</p>

## Stack

Expo SDK 57 · React Native 0.86 · expo-router · TypeScript (strict) · Restyle (theme built at runtime) · zustand + MMKV · i18next · react-native-svg + Reanimated · @expo/ui (native color and time pickers) · expo-notifications (local only) · Jest · Maestro

```
src/
  domain/      pure logic, unit-tested: growth (capital, momentum), stats, goals and scenes,
               the day and reminders, seasons, colors and contrast, emoji search
  store/       zustand stores persisted to MMKV
  i18n/        EN / UK / PL, checked for missing keys and plural forms
  theme/       buildTheme({ mode, accent, page }); fixed colors for hours, minutes and days
  components/  UI building blocks, charts, goal scenes, share cards, confetti
  app/         expo-router screens
  data/        emoji data built from emojibase (scripts/build-emoji.mjs)
plugins/       config plugins: UIScene for the iOS 27 SDK, no push entitlement
e2e/           Maestro flows, which also take the screenshots in this README
```

## Run it

You need [mise](https://mise.jdx.dev) (it pins Node 22 and bun), Xcode and an iOS simulator. MMKV needs native code, so this runs as a dev build, not in Expo Go.

```sh
mise install
mise exec -- bun install
mise exec -- bun run ios        # build and launch on the simulator
mise exec -- bun run test       # unit tests
mise exec -- bun run typecheck
mise exec -- bun run lint
```

To try it with data, go to Profile → Load sample data.

End-to-end flows run with [Maestro](https://maestro.dev): `maestro test e2e/onboarding.yaml`, then `e2e/tour.yaml` (it loads sample data and saves screenshots to `e2e/screenshots/`).

## Built with AI

This app is also a hands-on way to learn AI-assisted development with Claude Code. Each piece is in the repo:

| Piece | Where | What it does here |
|---|---|---|
| Project memory | [`CLAUDE.md`](CLAUDE.md) | Commands, layout and product rules such as "no guilt" and "tokens, never hex" |
| Skills | [`.claude/skills/`](.claude/skills) | `new-screen` (how a screen is built in this app), `on-device` (build and run on a real iPhone) and `create-pr` (checks and PR description) |
| Hooks | [`.claude/settings.json`](.claude/settings.json) | Lint and typecheck after every edit, so mistakes come back straight away |
| MCP | [`.mcp.json`](.mcp.json) | Maestro, so Claude can drive the simulator, check screens and take these screenshots |
| Subagents | in the session | Research on how other apps design their first screen, run in the background |
| Artifacts | claude.ai | Mockups of three home screen directions, to pick one before building |

The plan and the reasoning behind decisions are in [`docs/PLAN.md`](docs/PLAN.md).
