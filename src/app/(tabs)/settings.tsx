import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable } from 'react-native';
import { Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { Card, OptionButton, Screen } from '@/components/ui';
import { APP_LANGUAGES, LANGUAGE_BADGE } from '@/i18n/resources';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useSettingsStore } from '@/store/settings-store';
import { useAppTheme } from '@/theme/theme';

function ActionRow({ title, sub, onPress, danger }: { title: string; sub: string; onPress: () => void; danger?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, opacity: pressed ? 0.7 : 1 })}>
      <Box flex={1} gap="xs">
        <Text variant="bodyStrong" style={{ color: danger ? '#B3261E' : colors.ink }}>
          {title}
        </Text>
        <Text variant="small">{sub}</Text>
      </Box>
      <Glyph d={UI_PATHS.arrowRight} size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const loadDemo = usePortfolioStore((s) => s.loadDemo);
  const reset = usePortfolioStore((s) => s.reset);

  const confirm = (action: () => void) =>
    Alert.alert(t('settings.confirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.continue'), style: 'destructive', onPress: action },
    ]);

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t('settings.title')}
      </Text>

      <Box gap="s" accessibilityRole="radiogroup" accessibilityLabel={t('settings.language')}>
        <Text variant="bodyStrong">{t('settings.language')}</Text>
        {APP_LANGUAGES.map((code) => (
          <OptionButton key={code} selected={code === language} onPress={() => setLanguage(code)}>
            <Box flexDirection="row" alignItems="center" gap="sm">
              <Text variant="monoSmall" style={{ width: 30 }}>
                {LANGUAGE_BADGE[code]}
              </Text>
              <Text variant="label" style={{ fontSize: 15 }}>
                {t(`languages.${code}`)}
              </Text>
            </Box>
          </OptionButton>
        ))}
      </Box>

      <Card gap="xs">
        <ActionRow title={t('pick.custom')} sub={t('custom.label')} onPress={() => router.push({ pathname: '/onboarding/custom', params: { mode: 'add' } })} />
        <ActionRow title={t('settings.demo')} sub={t('settings.demoSub')} onPress={() => confirm(loadDemo)} />
        <ActionRow
          danger
          title={t('settings.reset')}
          sub={t('settings.resetSub')}
          onPress={() =>
            confirm(() => {
              reset();
              setOnboarded(false);
              router.replace('/onboarding');
            })
          }
        />
      </Card>
    </Screen>
  );
}
