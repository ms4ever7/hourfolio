---
name: create-pr
description: Open a pull request to main for the current work in Hourfolio, with this repo's checks, commit style and PR description. Use when the user asks to make or open a PR ("створи ПР", "зроби бранч і PR"), or to wrap finished work into a branch with commits and a PR.
---

# Open a PR in Hourfolio

When the user asks for a PR, that is the go-ahead to commit, push the branch and open the PR. Don't ask again. Do stop and ask if a check fails and fixing it would change behavior.

## 1. Branch

- `git status` and `git branch --show-current`.
- On `main`, first run `git pull --ff-only`, then `git switch -c <branch>`. Name the branch after the work, in kebab case (for example `mvp2-daily-rhythm`).
- If `main` has moved since the branch started, rebase onto it only when the user asks. Otherwise mention it in the PR.

## 2. Make sure it's shippable

Run all of these and fix what fails:

```bash
mise exec -- bun run typecheck
mise exec -- bun run lint
mise exec -- bun run test
mise exec -- bunx expo-doctor
```

Then check the diff (`git diff main...HEAD --stat` plus anything uncommitted) for:
- **Dev-only code:** test buttons, `console.log`, English-only debug copy. None of it goes in a PR; the user asked for this explicitly once. `__DEV__` screens count too, unless the user wants them.
- **Stray files:** bun/npm init leftovers, `e2e/screenshots/` (it's gitignored), local `.env` files, files under `ios/` or `android/` (they're generated).
- **Copy:** every new string exists in EN, UK and PL. `i18n.test.ts` enforces this.
- **Docs:** `docs/PLAN.md` says what was built and what was decided. `CLAUDE.md` covers any new rule or command. If the UI in the README changed, refresh `docs/screenshots/` with `e2e/tour.yaml` (see the `new-screen` skill).

## 3. Commits

- Split the work into commits that each make sense on their own: a plan change, native deps or config, a feature, docs. Don't split so finely that a commit no longer builds.
- Message: a short imperative summary line (max ~72 characters), a blank line, then a body saying what changed and why, in plain sentences or short bullets.
- End every message with the attribution line from the current session's system instructions (right now `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`).
- Stage files by name or `git add -A` only after the checks in step 2. Never commit secrets.

## 4. Push and open the PR

```bash
git push -u origin <branch>
gh pr create --base main --title "<short title>" --body-file - <<'EOF'
…body…
EOF
```

Use this body shape:

```markdown
## Summary
What the user gets, grouped by feature, 3–8 bullets. Say what changed for the user, not which files.

## Native changes (rebuild needed)
New native modules, app.json or plugin changes. Say "None, JS only" when there are none, so the reviewer knows no rebuild is needed.

## Test plan
- [x] typecheck, lint, test (N tests), expo-doctor
- [x] What you checked on the simulator (screens, light/dark, a second language)
- [x] What the user confirmed on the iPhone
- [ ] What nobody has checked yet, stated plainly

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

End the PR description with the line the session's system instructions give for PRs (the 🤖 line above).

Only tick a box that was really done. If something was only checked on the simulator, say so. Don't claim it was checked on the device.

## 5. Report back

Give the user the PR URL, the list of commits, and anything still open (unchecked boxes, a rebase that's needed). Don't paste the whole PR body back into the chat.
