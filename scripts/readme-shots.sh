#!/bin/zsh
# Retakes the README screenshots (docs/screenshots) and the congrats GIF on an iOS simulator with Maestro.
#
# Before running: a booted simulator with the dev build installed and connected to Metro, in English,
# on the welcome screen (a fresh install, or `maestro test e2e/start-over.yaml` first). ffmpeg is needed for the GIF.
#
#   scripts/readme-shots.sh <simulator udid>
set -e
UDID=${1:?simulator udid (xcrun simctl list devices booted)}
cd "$(dirname "$0")/.."
OUT=$(mktemp -d)

maestro --device "$UDID" test --test-output-dir "$OUT/onboarding" e2e/onboarding.yaml
maestro --device "$UDID" test --test-output-dir "$OUT/tour" e2e/tour.yaml

# Maestro 2 writes takeScreenshot files under the run's output dir, not next to the flow.
find "$OUT" -path '*takeScreenshot*' -name '*.png' -exec cp {} e2e/screenshots/ \;

# The README uses these, without the number prefix.
for pair in 01-welcome:welcome 00-tour-plan:tour-plan 00-tour-progress:tour-progress 00-tour-investment:tour-investment \
  03-setup:setup 03-setup-goal:setup-goal 04-day:day 05-you:you 10-today:today 11-goals:goals 12-analytics:analytics \
  13-asset:asset 15-profile:profile 16-appearance-dark:appearance-dark 17-today-dark:today-dark 18-share-week:share-week \
  19-goals-plan:goals-plan 20-plan-free:plan-free 21-plan-result:plan-result 22-today-plan:today-plan \
  23-achievements:achievements 24-week:week 25-badge:badge 26-today-modal:today-modal; do
  cp "e2e/screenshots/${pair%%:*}.png" "docs/screenshots/${pair##*:}.png"
done

# The congrats GIF: record the simulator while goal-met.yaml logs the session that completes a goal.
xcrun simctl io "$UDID" recordVideo --codec h264 --force "$OUT/goal-met.mov" &
REC=$!
sleep 2
maestro --device "$UDID" test e2e/goal-met.yaml
sleep 3
kill -INT $REC
wait $REC 2>/dev/null || true
# connect.yaml adds about 25 s of lead-in, so keep the last 12 s: a moment of Today, the sheet, the congrats.
ffmpeg -y -loglevel error -sseof -12 -i "$OUT/goal-met.mov" \
  -vf "fps=12,scale=300:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=3" \
  docs/screenshots/goal-met.gif

echo "Done: docs/screenshots/*.png and docs/screenshots/goal-met.gif (run artifacts in $OUT)"
