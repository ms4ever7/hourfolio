import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput } from 'react-native';
import { AssetIcon, Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { BackButton, Card, LanguageButton, PrimaryButton, Screen } from '@/components/ui';
import { suggestSetup } from '@/domain/suggest';
import { en } from '@/i18n/locales/en';
import { useOnboardingStore } from '@/store/onboarding-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAppTheme } from '@/theme/theme';

/**
 * Add a custom asset. During onboarding (`mode` unset) it joins the picks;
 * from the app (`mode=add`) it goes straight into the portfolio.
 */
export default function Custom() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const params = useLocalSearchParams<{ name?: string; mode?: string }>();
  const [name, setName] = useState(params.name ?? '');
  const addDraft = useOnboardingStore((s) => s.addDraft);
  const addAsset = usePortfolioStore((s) => s.addAsset);

  const catalogNames = useMemo(
    () => Object.fromEntries(Object.keys(en.catalog).map((id) => [id, t(`catalog.${id}`)])),
    [t],
  );
  const s = suggestSetup(name, catalogNames);
  const trimmed = name.trim();

  const use = () => {
    const asset = { customName: trimmed, ...s, startingMinutes: 0 };
    if (params.mode === 'add') {
      const id = addAsset(asset);
      router.replace({ pathname: '/asset/[id]', params: { id } });
    } else {
      addDraft(asset);
      router.back();
    }
  };

  const rows: [string, string][] = [
    [t('setup.energy'), t(`energy.${s.energy}`)],
    [t('setup.rhythm'), t(`rhythm.${s.rhythm}`)],
  ];

  return (
    <Screen>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <BackButton onPress={() => router.back()} />
        <LanguageButton />
      </Box>

      <Text variant="title" accessibilityRole="header">
        {t('custom.title')}
      </Text>

      <Box gap="s">
        <Text variant="label" style={{ fontFamily: 'Onest_600SemiBold' }}>
          {t('custom.label')}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('custom.placeholder')}
          placeholderTextColor={colors.faint}
          accessibilityLabel={t('custom.label')}
          autoFocus
          style={{ height: 52, paddingHorizontal: 16, borderRadius: 14, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.card, fontFamily: 'Onest_400Regular', fontSize: 17, color: colors.ink }}
        />
      </Box>

      {trimmed ? (
        <Card>
          <Box flexDirection="row" alignItems="center" gap="s">
            <Glyph d={UI_PATHS.sparkle} size={16} color="#4B33C9" strokeWidth={2} />
            <Text variant="caption" style={{ fontFamily: 'Onest_600SemiBold', color: '#4B33C9' }}>
              {t('custom.suggested')}
            </Text>
          </Box>
          <Box flexDirection="row" alignItems="center" gap="sm">
            <AssetIcon icon={s.icon} color={s.color} size={60} />
            <Box flex={1} gap="xs">
              <Text variant="heading" style={{ fontSize: 18 }}>
                {trimmed}
              </Text>
              <Text variant="caption">{t('custom.iconNote')}</Text>
            </Box>
          </Box>
          <Box>
            {rows.map(([k, v]) => (
              <Box key={k} flexDirection="row" justifyContent="space-between" paddingVertical="s" borderTopWidth={1} borderColor="line">
                <Text variant="label" color="muted">
                  {k}
                </Text>
                <Text variant="label" style={{ fontFamily: 'Onest_600SemiBold' }}>
                  {v}
                </Text>
              </Box>
            ))}
          </Box>
          <PrimaryButton label={t('custom.use')} onPress={use} />
        </Card>
      ) : null}
    </Screen>
  );
}
