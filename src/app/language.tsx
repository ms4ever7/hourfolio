import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { OptionButton } from '@/components/ui';
import { APP_LANGUAGES, LANGUAGE_BADGE } from '@/i18n/resources';
import { useSettingsStore } from '@/store/settings-store';
import { useAppTheme } from '@/theme/theme';

/** A small sheet with the three languages. Picking one applies it and closes the sheet. */
export default function LanguageSheet() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <Box padding="l" gap="s" style={{ paddingTop: 28, paddingBottom: insets.bottom + 16 }} accessibilityRole="radiogroup" accessibilityLabel={t('profile.language')}>
      <Text variant="heading" accessibilityRole="header" style={{ marginBottom: 4 }}>
        {t('profile.language')}
      </Text>
      {APP_LANGUAGES.map((code) => {
        const on = code === language;
        return (
          <OptionButton
            key={code}
            selected={on}
            onPress={() => {
              setLanguage(code);
              router.back();
            }}
          >
            <Box flexDirection="row" alignItems="center" gap="sm">
              <Text variant="monoSmall" style={{ width: 30 }}>
                {LANGUAGE_BADGE[code]}
              </Text>
              <Text variant="label" style={{ flex: 1, fontSize: 15 }}>
                {t(`languages.${code}`)}
              </Text>
              {on ? <Glyph d={UI_PATHS.check} size={18} color={colors.accentInk} strokeWidth={2.4} /> : null}
            </Box>
          </OptionButton>
        );
      })}
    </Box>
  );
}
