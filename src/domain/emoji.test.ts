import { EMOJI_GROUPS, emojiInGroup, searchEmoji } from './emoji';

describe('emoji search', () => {
  it('finds by name in the app language and in English', () => {
    expect(searchEmoji('гітара', 'uk')).toContain('🎸');
    expect(searchEmoji('gitara', 'pl')).toContain('🎸');
    expect(searchEmoji('guitar', 'uk')).toContain('🎸');
  });

  it('matches word starts, so a few letters are enough', () => {
    expect(searchEmoji('гіт', 'uk')).toContain('🎸');
    expect(searchEmoji('ita', 'en')).not.toContain('🎸');
  });

  it('needs every word of the query', () => {
    const red = searchEmoji('red heart', 'en');
    expect(red).toContain('❤️');
    expect(red).not.toContain('💙');
  });

  it('returns nothing for an empty query', () => {
    expect(searchEmoji('  ', 'en')).toEqual([]);
  });
});

describe('emoji groups', () => {
  it('covers the keyboard groups with emoji in each', () => {
    for (const g of EMOJI_GROUPS) expect(emojiInGroup(g.id).length).toBeGreaterThan(0);
    expect(emojiInGroup(7)).toContain('🎸');
  });
});
