---
name: new-screen
description: Add or rebuild a screen in Hourfolio (a tab, a pushed screen, a modal or a sheet) the way this project does it. Covers the expo-router file, the shared building blocks, theme tokens, copy in EN/UK/PL, the no-guilt rules and how to check the result. Use for any new or redesigned screen, including the home screen.
---

# Adding a screen to Hourfolio

## 1. Pick the kind of screen and where its file goes

Every file in `src/app/` is a route. Keep everything else out of it. Components go in `src/components/`, logic in `src/domain/`, hooks in `src/lib/`, and **tests never go in `src/app/`**: a test file there breaks the Metro bundle with "console could not be found".

| Kind | File | Also register |
|---|---|---|
| Tab | `src/app/(tabs)/<name>.tsx` | A `Tabs.Screen` and an icon in `TAB_ICONS` in `src/app/(tabs)/_layout.tsx`, plus `tabs.<name>` copy |
| Pushed screen (has a back button) | `src/app/<name>.tsx` | Nothing |
| Modal | `src/app/<name>.tsx` | `<Stack.Screen name="<name>" options={{ presentation: 'modal' }} />` in `src/app/_layout.tsx` |
| Small sheet | `src/app/<name>.tsx` | `presentation: 'formSheet', sheetAllowedDetents: 'fitToContents', sheetGrabberVisible: true` |
| Onboarding step | `src/app/onboarding/<name>.tsx` | Link to it from the previous step |

Navigate with `router.push('/<name>')` or `router.push({ pathname: '/asset/[id]', params: { id } })`. Before relying on an expo-router, Expo UI or React Native API you haven't used in this repo, read the matching docs page first (SDK 57, see AGENTS.md).

## 2. Build it from the shared pieces

From `@/components/ui`:
- **Layout:** `Screen` (safe area, scroll, backdrop pattern, optional `footer`), `Card`, `Group` with `ListRow` and `SwitchRow` (iOS Settings-style lists), `SectionHeader`.
- **Buttons:** `PrimaryButton` (the accent; `dark` gives the inverse style), `TextButton`, `RoundButton`, `BackButton`.
- **Inputs:** `Segmented`, `OptionButton`.
- **Values:** `Hours` and `Duration` (units keep their fixed colors), `TrendChip`.

Elsewhere: `AssetIcon` from `@/components/icons` (always pass `face={asset.face}`), `GoalScene` from `@/components/scenes`, and `Box` and `Text` from `@/components/primitives` with the theme's text variants (`title`, `heading`, `bodyStrong`, `body`, `label`, `caption`, `small`, `tiny`, `mono`, `display`).

Shapes that already work here:

```tsx
// Pushed screen
export default function Thing() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Box flexDirection="row" alignItems="center" gap="sm">
        <BackButton onPress={() => router.back()} />
        <Text variant="title" style={{ fontSize: 24 }} accessibilityRole="header">{t('thing.title')}</Text>
      </Box>
      …
    </Screen>
  );
}

// Modal: its own ground, a scroll area, and the main action pinned at the bottom
<Box flex={1} backgroundColor="ground">
  <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 28, gap: 22 }}>…</ScrollView>
  <Box paddingHorizontal="l" style={{ paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
    <PrimaryButton label={t('thing.done')} onPress={() => router.back()} />
  </Box>
</Box>
```

## 3. Colors: tokens only, never hex

The theme is built at runtime from the user's mode, accent, page color and holiday, so a literal color breaks some combination of them.
- Get colors with `const { colors, palette } = useAppTheme()`, or use a Restyle prop such as `backgroundColor="card"`.
- UI chrome uses `accent`, `onAccent` (text on accent), `accentInk` (accent-colored text) and `accentSoft`.
- `hours`, `minutes` and `days` are only for those units.
- Asset colors come from `palette[asset.color]` (`main`, `tint`, `soft`). For text or icons on `palette.x.main`, use `colors.card`.
- Neutrals: `ground`, `card`, `ink`, `body`, `muted`, `faint`, `line`, `border`, `track`, `dashed`, `inverse`/`onInverse`.
- If a token is missing, add it to both `LIGHT` and `DARK` in `src/theme/theme.ts` (and to `aroundPage` if it depends on the page color). Don't use a literal.

## 4. Copy in three languages

- Every string goes through `t()`. Add keys to `src/i18n/locales/en.ts` first, then `uk.ts` and `pl.ts`.
- Plurals: English needs `_one` and `_other`. Ukrainian and Polish also need `_few` and `_many`. `i18n.test.ts` fails when any key or plural form is missing.
- Avoid gendered forms in Ukrainian and Polish. Address the user in the second person, or use impersonal forms ("Ціль досягнуто", "Cel osiągnięty").
- Tone: no guilt. Never "you missed" or "you didn't log", no red for a decline, no streaks. Assets on a break are "resting" or "paused". Rest counts as an investment.
- Dev-only screens and controls can stay in English, but must not ship in a PR.

## 5. Logic and state

- Calculations belong in `src/domain/` as pure functions, each with a `*.test.ts` next to it.
- Persistent state belongs in `src/store/settings-store.ts` or `portfolio-store.ts` (zustand plus MMKV). New fields need a default; old saved state merges in without a migration.

## 6. Accessibility

- The title gets `accessibilityRole="header"`.
- Choices use `radio` or `checkbox` roles with `accessibilityState`.
- Icon-only buttons get an `accessibilityLabel`.
- Touch targets are at least 44 pt.

## 7. Check it

1. `mise exec -- bun run typecheck`, `lint` and `test`. The edit hook already runs eslint and tsc after every change.
2. Look at the screen on the iOS 27 simulator with Maestro (`iPhone 18 Pro`, `2DA51517-2AFE-43B1-AF08-034651A388CA`). Flows live in `e2e/`. Start each one with `- runFlow: connect.yaml`, which connects the dev client to Metro. Give controls that flows must find a `testID` (for example `tab-profile` or `profile-name`) rather than tapping by coordinates. If the screen shows up in the README, update `e2e/tour.yaml` and refresh `docs/screenshots/`.
   - Start the right app with `xcrun simctl launch <sim> com.ms4ever7.hourfolio`, then connect to `http://127.0.0.1:8081`. The old `com.roman.hourfolio` build grabs deep links.
   - The dev-tools gear floats top right and swallows taps there. Hide it on the simulator with `xcrun simctl spawn <sim> defaults write com.ms4ever7.hourfolio EXDevMenuShowFloatingActionButton -bool NO`, then relaunch the app.
   - Tab screens keep their scroll position. Scroll up to a marker at the top of the screen before a screenshot.
   - Check light, dark and one page color, and switch the language to Ukrainian once: longer words overflow first.
3. Put it on the user's phone with the `on-device` skill.
