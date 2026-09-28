import { CATALOG } from '@/domain/catalog';
import { en } from './locales/en';
import { pl } from './locales/pl';
import { uk } from './locales/uk';

type Tree = { [k: string]: string | Tree };

function leaves(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([k, v]) => (typeof v === 'string' ? [prefix + k] : leaves(v, `${prefix}${k}.`)));
}

const baseKey = (k: string) => k.replace(/_(zero|one|two|few|many|other)$/, '');

describe.each([
  ['uk', uk],
  ['pl', pl],
])('%s translations', (lang, locale) => {
  const keys = new Set(leaves(locale as unknown as Tree));

  it('has every English key', () => {
    const missing = leaves(en as unknown as Tree).filter((k) => !keys.has(k));
    expect(missing).toEqual([]);
  });

  it('has every plural form the language needs', () => {
    const categories = new Intl.PluralRules(lang).resolvedOptions().pluralCategories;
    const plurals = new Set(leaves(en as unknown as Tree).filter((k) => /_(one|other)$/.test(k)).map(baseKey));
    const missing = [...plurals].flatMap((k) => categories.filter((c) => !keys.has(`${k}_${c}`)).map((c) => `${k}_${c}`));
    expect(missing).toEqual([]);
  });
});

it('names every catalog item', () => {
  for (const c of CATALOG) expect(en.catalog).toHaveProperty(c.id);
});
