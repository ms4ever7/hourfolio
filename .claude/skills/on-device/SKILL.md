---
name: on-device
description: Build, install and launch Hourfolio on the user's physical iPhone, with Metro running so code changes reach the phone. Use when asked to run, test or try the app on the phone or device ("запусти на девайс", "на реальний тел"), after adding a native module or changing app.json/plugins, or when the phone app shows "Cannot find native module".
---

# Run Hourfolio on the iPhone

The user tests on a real iPhone, not the simulator. The simulator is only for your own screenshots, because Maestro can't screenshot a physical iOS device.

## 1. Find the phone

```bash
xcrun devicectl list devices
```

Use the row that says `physical` and `connected`. The usual one is "iPhone Roman" (iPhone 14 Pro, UDID `00008120-001678AC3E60201E`). If it shows `available (paired)` or isn't listed, ask the user to unlock it and plug it in.

## 2. Decide whether a native rebuild is needed

Rebuild when any of these changed since the last install: `package.json` dependencies with native code, `app.json`, or `plugins/`. Also rebuild when the app says `Cannot find native module …`. A JS-only change doesn't need a rebuild; skip to step 4.

```bash
CI=1 mise exec -- bunx expo prebuild --platform ios          # regenerate ios/ from app.json and plugins
CI=1 mise exec -- bunx expo run:ios --device <UDID> --no-bundler
```

Never edit `ios/` by hand: it is generated. Only use `prebuild --clean` when a plugin's output looks stale.

Signing uses the free personal team (`ios.appleTeamId` 2RMJ37733D in app.json), so:
- An install expires after 7 days. When the app stops opening, run the build again.
- Capabilities the free team can't sign make the build fail with "Provisioning Profile … does not support …". Push notifications are one example. Strip the entitlement with a config plugin, as `plugins/without-push-entitlement.js` does, rather than adding the capability.

## 3. Start Metro (watching files)

Check it first: `curl -s localhost:8081/status` prints `packager-status:running` when it's up.

If it isn't running, start it in the background with the Bash tool's `run_in_background`:

```bash
mise exec -- bunx expo start --dev-client
```

Don't use `CI=1` for Metro. In CI mode it stops watching files, and the phone keeps getting stale code.

## 4. Launch the app pointed at Metro

The phone and the Mac must be on the same Wi-Fi. Get the Mac's address with `ipconfig getifaddr en0` (it was 192.168.0.64).

```bash
xcrun devicectl device process launch --device <UDID> --terminate-existing \
  --payload-url "exp+hourfolio://expo-development-client/?url=http%3A%2F%2F<MAC_IP>%3A8081" \
  com.ms4ever7.hourfolio
```

Relaunching keeps the user's data, because MMKV survives restarts.

## 5. Confirm it loaded

- `curl -s localhost:8081/json/list` should list a target with `"deviceName":"iPhone"` and appId `com.ms4ever7.hourfolio`.
- The Metro output should show `iOS Bundled …` after the launch.
- Check that Metro printed no `ERROR` lines after that. Metro logs from every connected client, so check `json/list` to see which device an error came from. The simulator still has an old `com.roman.hourfolio` build that throws native-module errors; ignore those.

Tell the user what is on the phone now and what to try. You can't see the phone's screen, so say what you verified (installed, bundled without errors) and what they should check by hand.
