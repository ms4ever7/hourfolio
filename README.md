# Hourfolio

**Your time, invested.** A time portfolio for people with many hobbies: every hobby is an asset, hours are the currency, and rest counts as an investment too.

Most habit apps reward one thing done every day and punish breaks with broken streaks. Hourfolio does the opposite. It shows how your time is spread across everything you care about, and it never makes you feel guilty about it.

## How it works

- **Capital:** every hour you have put into a hobby, including the years before the app. It never goes down.
- **Momentum:** recent activity on a 0–100 scale. It fades during a break but never drops below 20, and it decays at the pace of each hobby's own rhythm (daily, a few times a week, weekly, whenever).
- **Recovery** is in every portfolio. Rest days show up in the calendar as their own thing, not as gaps.
- **Energy balance** splits your time into body, creative, mind and recovery.
- **Goals** are optional and weekly. Missing one changes nothing.

No red numbers, no streaks. A decline is grey, and a hobby on a break is simply "paused".

## Features

- Onboarding: pick from 35 preset activities or add your own, then set up each one (color, energy type, rhythm, starting capital, weekly goal)
- Portfolio: hours this week, month, year or all time; a cumulative chart against the previous period; allocation donut; holdings with sparklines
- Asset detail: capital, momentum, 12-week chart, session stats, next milestone, history
- Analytics: energy balance, a monthly heatmap, insights
- Goals: weekly progress and capital milestones with an ETA at your current pace
- English, Ukrainian and Polish, with correct plural forms and locale number formats
- Local-first: data lives on the device, no account, no backend

## Stack

Expo SDK 57 · React Native 0.86 · expo-router · TypeScript (strict) · Restyle · zustand + MMKV · i18next · react-native-svg · Jest · Maestro

```
src/
  domain/      pure logic: growth (capital, momentum, milestones), stats, catalog. Unit-tested.
  store/       zustand stores persisted to MMKV
  i18n/        EN / UK / PL resources, checked for missing keys and plural forms
  theme/       Restyle theme; hours, minutes and days each have their own color
  components/  UI primitives and SVG charts
  app/         expo-router screens
plugins/       config plugins (UIScene adoption for the iOS 27 SDK)
e2e/           Maestro flows
```

## Run it

Requires [mise](https://mise.jdx.dev) (Node 22 and bun are pinned), Xcode and an iOS simulator. MMKV needs native code, so this runs as a dev build, not in Expo Go.

```sh
mise install
mise exec -- bun install
mise exec -- bun run ios        # build and launch on the simulator
mise exec -- bun run test       # unit tests
mise exec -- bun run typecheck
mise exec -- bun run lint
```

To try it with data: Settings → Load sample data.

## Built with AI

This app is also a hands-on way to learn AI-assisted development with Claude Code: project memory (`CLAUDE.md`), skills and plugins, MCP servers (Maestro, Expo), hooks that lint and typecheck every edit, and design mockups made as Artifacts. The plan and decisions are in [`docs/PLAN.md`](docs/PLAN.md).
