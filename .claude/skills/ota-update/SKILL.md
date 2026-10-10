---
name: ota-update
description: Publish an over-the-air (EAS Update) JS update of Hourfolio to staging and/or production, then say how to check it reached the phone. Use when asked to ship, publish or roll out an update without a new build ("зроби ОТА", "оновлення на стейдж/прод", "OTA update"), usually right after a PR is merged to main.
---

# Ship an OTA update

An OTA update replaces the JS bundle in builds that are already installed. No new build, no App Review. Publishing to production is visible to every user, so only do it when the user asked for it. Say which channels you will publish to if the request is vague ("зроби ОТА" means staging and production only when they say both; otherwise ask).

## 1. Start from an up-to-date, clean main

```bash
git fetch -q
git branch --show-current                  # must be main
git status --short                         # tracked changes: stop. Untracked files outside src/ (e.g. docs/app-store/) are fine, mention them
git rev-list --left-right --count HEAD...origin/main   # must be "0 0"; behind means git pull --ff-only first, ahead means unpushed commits: stop
```

Stop and tell the user if any of these fail. Never publish from a feature branch or with uncommitted tracked changes: the update would not match what was reviewed.

## 2. Is an OTA enough? Compare fingerprints

An update only reaches builds with the same runtime version (the `fingerprint` of the native code), and it does so silently: an update whose runtime version matches no installed build is published and then reaches nobody. So check this before publishing, per channel and platform:

```bash
for platform in ios android; do
  mise exec -- bunx eas-cli fingerprint:generate -p $platform --build-profile <staging|production> --json --non-interactive 2>/dev/null \
    | python3 -c "import json,sys; print('$platform local   ', json.load(sys.stdin)['hash'])"
done
mise exec -- bunx eas-cli update:list --branch <staging|production> --limit 2 --json --non-interactive 2>/dev/null \
  | python3 -c "import json,sys; [print(u['platforms'], 'published', u['runtimeVersion']) for u in json.load(sys.stdin)['currentPage']]"
```

- Local hash equals the published runtime version for that platform: nothing native changed since the last OTA. Go on.
- They differ: something native changed (a package, `app.json`, `app.config.ts`, a plugin, or a fingerprint-relevant file). Do not publish. Tell the user a new build is needed, and why if you can see it (`git diff <last published commit>..HEAD --stat -- package.json bun.lock app.json app.config.ts plugins`). If a build for the new hash already exists and is installed, `mise exec -- bunx eas-cli fingerprint:compare --build-id <id> --non-interactive` against the newest build tells you; then the update is fine.
- No update has been published on the branch yet, or the commands fail: say so and ask, do not guess.
- If `bunx eas-cli` fails with `Cannot find module`, its cache in `$TMPDIR/bunx-*-eas-cli@latest` is broken. Delete that folder and run again (it only holds a downloaded copy).

## 3. Publish

```bash
mise exec -- bun run typecheck && mise exec -- bun run lint && mise exec -- bun run test
mise exec -- bun run update:staging
mise exec -- bun run update:production      # only if the user asked for production
```

- Always use these scripts, never a bare `eas update`. They set `APP_VARIANT`, which `app.config.ts` bakes into the update. A bare `eas update` publishes `variant: development` and shows "Load sample data" in production.
- Staging first, then production, unless the user asked for production only. Do not publish to production if staging failed or its fingerprint check did not pass.
- One command publishes two update groups (iOS and Android), each with its own runtime version. That is expected.
- The commit in the output shows a `*` when the tree has uncommitted files. Untracked files outside `src/` don't end up in the bundle, but say so.
- If a command fails (not logged in, network), report the error and stop. Do not retry blindly or switch to another command.

## 4. Report back

Give, for each channel: the iOS and Android update group IDs and the EAS Dashboard link (`https://expo.dev/accounts/mszorro/projects/hourfolio/updates/<group id>`), and the commit. Then tell the user how the update reaches the phone:
- It downloads on one launch and applies on the next, so they must fully close the app and open it twice, waiting a few seconds between.
- Builds made before `expo-updates` was added (staging build 3) never receive updates.
- A build only receives an update with the same runtime version. If nothing changes after two launches, compare the build's runtime version with the published group (`mise exec -- bunx eas-cli update:list --branch <staging|production>`, `build:list`). A mismatch means a new build is needed.

You cannot see the phone, so never say it "has updated". Say it was published.

## Rollback

`mise exec -- bunx eas-cli update:republish --group <previous group id>` republishes an earlier group to the same branch. Do this only when the user asks, and name the group you will republish.
