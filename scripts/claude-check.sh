#!/usr/bin/env bash
# Claude Code PostToolUse hook: after an edit to a TS/TSX file under src/, lint that file and
# typecheck the project. Exit 2 sends the errors back to Claude so it fixes them right away.
set -uo pipefail

file=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')
root="$(cd "$(dirname "$0")/.." && pwd)"

case "$file" in
  "$root"/src/*.ts | "$root"/src/*.tsx) ;;
  *) exit 0 ;;
esac

cd "$root" || exit 0
out=$(mise exec -- bunx eslint "$file" 2>&1)
lint=$?
types=$(mise exec -- bunx tsc --noEmit 2>&1)
tsc=$?

if [ $lint -ne 0 ] || [ $tsc -ne 0 ]; then
  {
    [ $lint -ne 0 ] && printf 'eslint %s:\n%s\n' "${file#"$root"/}" "$out"
    [ $tsc -ne 0 ] && printf 'tsc:\n%s\n' "$types"
  } >&2
  exit 2
fi
exit 0
