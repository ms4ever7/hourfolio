import data from '@/data/emoji.json';

/** Keyboard groups, in keyboard order. Numbers are emojibase group ids. */
export const EMOJI_GROUPS = [
  { id: 0, key: 'smileys', icon: '😀' },
  { id: 1, key: 'people', icon: '👋' },
  { id: 3, key: 'animals', icon: '🐶' },
  { id: 4, key: 'food', icon: '🍎' },
  { id: 5, key: 'travel', icon: '🚲' },
  { id: 6, key: 'activities', icon: '⚽' },
  { id: 7, key: 'objects', icon: '💡' },
  { id: 8, key: 'symbols', icon: '💟' },
  { id: 9, key: 'flags', icon: '🏳️' },
] as const;

export type EmojiGroupKey = (typeof EMOJI_GROUPS)[number]['key'];

export interface EmojiData {
  emoji: string[];
  group: number[];
  /** Per locale, aligned with `emoji`: the lowercase name and keywords. */
  words: Record<string, string[]>;
}

const DATA = data as EmojiData;

export function emojiInGroup(groupId: number, d: EmojiData = DATA): string[] {
  return d.emoji.filter((_, i) => d.group[i] === groupId);
}

/**
 * Emoji whose name or keywords contain every word of the query as a word start,
 * in the app language or in English (people often type English words).
 * "гіт" finds 🎸, "red heart" finds ❤️. Results keep keyboard order.
 */
export function searchEmoji(query: string, locale: string, d: EmojiData = DATA): string[] {
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const lists = [d.words[locale], locale === 'en' ? undefined : d.words.en].filter((l): l is string[] => Boolean(l));
  const matches = (text: string) => {
    const words = text.split(/[\s:,.()'’-]+/);
    return terms.every((t) => words.some((w) => w.startsWith(t)));
  };
  return d.emoji.filter((_, i) => lists.some((l) => l[i] && matches(l[i])));
}
