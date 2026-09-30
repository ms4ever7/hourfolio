import { DEFAULT_ACCENT } from '@/theme/theme';
import { migrateSettings } from './settings-migrate';

describe('migrateSettings', () => {
  it('moves the old default blue to the new default, whatever the case', () => {
    expect(migrateSettings({ accent: '#2747D6', name: 'Roman' }, 0)).toEqual({ accent: DEFAULT_ACCENT, name: 'Roman' });
    expect(migrateSettings({ accent: '#2747d6' }, 0)).toEqual({ accent: DEFAULT_ACCENT });
  });

  it('keeps any other accent', () => {
    expect(migrateSettings({ accent: '#C2388A' }, 0)).toEqual({ accent: '#C2388A' });
  });

  it('leaves current-version settings alone, even if they hold the old blue', () => {
    expect(migrateSettings({ accent: '#2747D6' }, 1)).toEqual({ accent: '#2747D6' });
  });

  it('copes with missing or empty state', () => {
    expect(migrateSettings(undefined, 0)).toEqual({});
    expect(migrateSettings({}, 0)).toEqual({});
  });
});
