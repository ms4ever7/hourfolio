// Builds src/data/emoji.json from emojibase-data: every emoji the iOS keyboard shows,
// grouped like the keyboard, with names and keywords in English, Ukrainian and Polish
// for search. Run after updating emojibase-data: `mise exec -- bun scripts/build-emoji.mjs`.
import { readFileSync, writeFileSync } from 'node:fs';

const LOCALES = ['en', 'uk', 'pl'];
// Newer emoji than this may render as empty boxes on older iOS versions.
const MAX_VERSION = 15.1;
// Components (skin tones, hair) and regional indicators aren't picked on their own.
const SKIP_GROUPS = new Set([2, undefined]);

const load = (locale, file) => JSON.parse(readFileSync(new URL(`../node_modules/emojibase-data/${locale}/${file}`, import.meta.url)));

const base = load('en', 'data.json')
  .filter((e) => !SKIP_GROUPS.has(e.group) && e.version <= MAX_VERSION)
  .sort((a, b) => a.order - b.order);

const words = Object.fromEntries(
  LOCALES.map((locale) => {
    const byHex = new Map(load(locale, 'compact.json').map((e) => [e.hexcode, e]));
    return [locale, base.map((e) => {
      const l = byHex.get(e.hexcode);
      return l ? [l.label, ...(l.tags ?? [])].join(' ').toLowerCase() : '';
    })];
  }),
);

const groups = Object.fromEntries(LOCALES.map((locale) => [locale, Object.fromEntries(load(locale, 'messages.json').groups.map((g) => [g.order, g.message]))]));

const out = { emoji: base.map((e) => e.emoji), group: base.map((e) => e.group), words, groups };
writeFileSync(new URL('../src/data/emoji.json', import.meta.url), JSON.stringify(out));
console.log(`${base.length} emoji written`);
