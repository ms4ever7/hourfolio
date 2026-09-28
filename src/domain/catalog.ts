import type { EnergyType, IconKey, PaletteKey, Rhythm } from './types';

export interface CatalogItem {
  /** Also the translation key under `catalog.` */
  id: string;
  icon: IconKey;
  color: PaletteKey;
  energy: EnergyType;
  rhythm: Rhythm;
  /** Extra words (any language) that match this item in search and custom suggestions. */
  keywords: string[];
}

const item = (
  id: string,
  icon: IconKey,
  color: PaletteKey,
  energy: EnergyType,
  rhythm: Rhythm,
  keywords: string[] = [],
): CatalogItem => ({ id, icon, color, energy, rhythm, keywords });

/** Presets for onboarding. Works offline; each comes with a sensible setup. */
export const CATALOG: CatalogItem[] = [
  item('guitar', 'guitar', 'magenta', 'creative', 'fewPerWeek', ['гітара', 'gitara', 'bass']),
  item('piano', 'keys', 'magenta', 'creative', 'fewPerWeek', ['піаніно', 'pianino', 'keyboard']),
  item('drums', 'wave', 'magenta', 'creative', 'fewPerWeek', ['барабани', 'perkusja']),
  item('singing', 'mic', 'magenta', 'creative', 'fewPerWeek', ['вокал', 'śpiew', 'vocal']),
  item('djing', 'headphones', 'olive', 'creative', 'fewPerWeek', ['dj', 'діджей']),
  item('musicProduction', 'wave', 'olive', 'creative', 'fewPerWeek', ['продакшн', 'produkcja', 'beats', 'ableton']),
  item('drawing', 'pencil', 'magenta', 'creative', 'fewPerWeek', ['малювання', 'rysowanie', 'sketch']),
  item('painting', 'pencil', 'vermilion', 'creative', 'weekly', ['живопис', 'malarstwo']),
  item('photography', 'camera', 'slate', 'creative', 'weekly', ['фото', 'zdjęcia']),
  item('writing', 'pencil', 'violet', 'creative', 'fewPerWeek', ['письмо', 'pisanie', 'blog']),
  item('pottery', 'vase', 'vermilion', 'creative', 'weekly', ['кераміка', 'ceramika', 'clay']),
  item('crossfit', 'dumbbell', 'vermilion', 'body', 'fewPerWeek', ['кросфіт', 'wod']),
  item('gym', 'dumbbell', 'vermilion', 'body', 'fewPerWeek', ['спортзал', 'siłownia', 'weights']),
  item('running', 'route', 'vermilion', 'body', 'fewPerWeek', ['біг', 'bieganie', 'run']),
  item('cycling', 'route', 'olive', 'body', 'weekly', ['велосипед', 'rower', 'bike']),
  item('swimming', 'wave', 'sky', 'body', 'weekly', ['плавання', 'pływanie', 'swim']),
  item('yoga', 'leaf', 'olive', 'body', 'fewPerWeek', ['йога', 'joga']),
  item('climbing', 'mountain', 'brown', 'body', 'weekly', ['скелелазіння', 'wspinaczka', 'boulder']),
  item('martialArts', 'dumbbell', 'slate', 'body', 'fewPerWeek', ['бокс', 'boks', 'bjj', 'judo']),
  item('football', 'ball', 'olive', 'body', 'weekly', ['футбол', 'piłka', 'soccer']),
  item('coding', 'code', 'violet', 'mind', 'fewPerWeek', ['програмування', 'programowanie', 'code']),
  item('aiLearning', 'ai', 'violet', 'mind', 'fewPerWeek', ['ai', 'штучний інтелект', 'ml']),
  item('reading', 'book', 'violet', 'mind', 'fewPerWeek', ['читання', 'czytanie', 'books']),
  item('languages', 'speech', 'sky', 'mind', 'daily', ['мови', 'języki', 'english', 'duolingo']),
  item('chess', 'pawn', 'slate', 'mind', 'weekly', ['шахи', 'szachy']),
  item('cryptoStrategies', 'candles', 'slate', 'mind', 'weekly', ['крипто', 'krypto', 'crypto', 'trading']),
  item('investing', 'candles', 'olive', 'mind', 'weekly', ['інвестиції', 'inwestowanie', 'stocks']),
  item('cardCollecting', 'cards', 'brown', 'creative', 'whenever', ['карти', 'karty', 'one piece', 'tcg', 'pokemon']),
  item('boardGames', 'pawn', 'brown', 'mind', 'whenever', ['настільні ігри', 'planszówki']),
  item('cooking', 'pot', 'vermilion', 'creative', 'weekly', ['кулінарія', 'gotowanie']),
  item('gardening', 'leaf', 'olive', 'recovery', 'weekly', ['сад', 'ogród']),
  item('anime', 'tv', 'grey', 'recovery', 'whenever', ['аніме', 'manga']),
  item('gaming', 'gamepad', 'grey', 'recovery', 'whenever', ['ігри', 'gry', 'games']),
  item('meditation', 'leaf', 'sky', 'recovery', 'daily', ['медитація', 'medytacja']),
  item('walking', 'route', 'sky', 'recovery', 'fewPerWeek', ['прогулянки', 'spacery', 'walk']),
];

export function findCatalogItem(id: string): CatalogItem | undefined {
  return CATALOG.find((c) => c.id === id);
}
