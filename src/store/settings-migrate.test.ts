import { DEFAULT_ACCENT } from '@/theme/theme';
import { migrateSettings } from './settings-migrate';

describe('migrateSettings', () => {
  it('moves the old default blue to the new default, whatever the case', () => {
    expect(migrateSettings({ accent: '#2747D6', name: 'Roman' }, 0)).toEqual({ accent: DEFAULT_ACCENT, name: 'Roman', seasonal: false });
    expect(migrateSettings({ accent: '#2747d6' }, 0)).toEqual({ accent: DEFAULT_ACCENT, seasonal: false });
  });

  it('keeps any other accent', () => {
    expect(migrateSettings({ accent: '#C2388A' }, 0)).toEqual({ accent: '#C2388A', seasonal: false });
  });

  it('switches the holiday theme off for version 1, which had it on for everyone', () => {
    expect(migrateSettings({ accent: '#2747D6', seasonal: true }, 1)).toEqual({ accent: '#2747D6', seasonal: false });
  });

  it('leaves current-version settings alone', () => {
    expect(migrateSettings({ accent: '#2747D6', seasonal: true }, 2)).toEqual({ accent: '#2747D6', seasonal: true });
  });

  it('copes with missing or empty state', () => {
    expect(migrateSettings(undefined, 2)).toEqual({});
    expect(migrateSettings({}, 2)).toEqual({});
  });
});
