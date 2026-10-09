---
name: ota-update
description: Publish an over-the-air (EAS Update) JS update of Hourfolio to staging and/or production, then say how to check it reached the phone. Use when asked to ship, publish or roll out an update without a new build ("зроби ОТА", "оновлення на стейдж/прод", "OTA update"), usually right after a PR is merged to main.
---

# Ship an OTA update

An OTA update replaces the JS bundle in builds that are already installed. No new build, no App Review. Publishing to production is visible to every user, so only do it when the user asked for it. Say which channels you will publish to if the request is vague ("зроби ОТА" means staging and production only when they say both; otherwise ask).

## 1. Is an OTA enough?

OTA only carries JS and assets. It reaches a build only when the build has the same runtime version (the `fingerprint` of the native code). So stop and tell the user a new build is needed when the changes include:
- a new or upgraded Expo or native package (`package.json`, `bun.lock`)
- an `app.json` / `app.config.ts` change, or a change under `plugins/`

Check with `git diff <last published commit>..HEAD --stat -- package.json bun.lock app.json app.config.ts plugins`. If unsure, say so rather than publishing.

## 2. Publish from an up-to-date main

```bash
git switch main && git pull --ff-only
git status --short            # only unrelated untracked files may be left (for example docs/app-store/)
mise exec -- bun run typecheck && mise exec -- bun run lint && mise exec -- bun run test
mise exec -- bun run update:staging
mise exec -- bun run update:production      # only if the user asked for production
```

- Publish from `main` after the merge, not from a feature branch, so the update matches what was reviewed. The commit in the output shows a `*` when the tree has uncommitted files; untracked files outside `src/` don't end up in the bundle, but say so.
- Always use these scripts, never a bare `eas update`. They set `APP_VARIANT`, which `app.config.ts` bakes into the update. A bare `eas update` publishes `variant: development` and shows "Load sample data" in production.
- Staging first, then production, unless the user asked for production only. Do not publish to production if staging failed.
- One command publishes two update groups (iOS and Android), each with its own runtime version. That is expected.
- If a command fails (not logged in, network), report the error and stop. Do not retry blindly or switch to another command.

## 3. Report back

Give, for each channel: the iOS and Android update group IDs and the EAS Dashboard link (`https://expo.dev/accounts/mszorro/projects/hourfolio/updates/<group id>`), and the commit. Then tell the user how the update reaches the phone:
- It downloads on one launch and applies on the next, so they must fully close the app and open it twice, waiting a few seconds between.
- Builds made before `expo-updates` was added (staging build 3) never receive updates.
- A build only receives an update with the same runtime version. If nothing changes after two launches, compare the build's runtime version with the published group (`mise exec -- bunx eas-cli update:list --branch <staging|production>`, `build:list`). A mismatch means a new build is needed.

You cannot see the phone, so never say it "has updated". Say it was published.

## Rollback

`mise exec -- bunx eas-cli update:republish --group <previous group id>` republishes an earlier group to the same branch. Do this only when the user asks, and name the group you will republish.
