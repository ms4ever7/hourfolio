import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PresetTile, ProfileAvatar } from '@/components/avatar';
import { Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { BackButton, LanguageButton, PrimaryButton, Screen, TextButton } from '@/components/ui';
import { AVATAR_PRESETS } from '@/domain/avatars';
import { useOnboardingStore } from '@/store/onboarding-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useSettingsStore } from '@/store/settings-store';
import { DEFAULT_ACCENT, useAppTheme } from '@/theme/theme';

/** A few of each, so the step stays one screen; the full sets are in Profile. */
const AVATARS = AVATAR_PRESETS.filter((p) => ['fox', 'dog', 'cat', 'panda', 'owl', 'unicorn', 'alien', 'astronaut', 'robot', 'dragon', 'sun', 'wave'].includes(p.id));
const ACCENTS = [DEFAULT_ACCENT, '#6246EA', '#C2388A', '#E4572E', '#1F8A5B', '#1E96C8'];

/** Optional last onboarding step: a name, a picture and a color. Skipping keeps the defaults. */
export default function YouStep() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const drafts = useOnboardingStore((s) => s.drafts);
  const setUpPortfolio = usePortfolioStore((s) => s.setUpPortfolio);
  const s = useSettingsStore();

  const finish = () => {
    s.setName(s.name.trim());
    setUpPortfolio(drafts);
    s.setOnboarded(true);
    router.replace('/(tabs)');
  };

  return (
    <Screen
      footer={
        <Box paddingHorizontal="l" gap="xs" style={{ paddingBottom: insets.bottom + 8 }}>
          <PrimaryButton label={t('day.open')} icon={UI_PATHS.arrowRight} onPress={finish} />
          <TextButton label={t('you.skip')} onPress={finish} />
        </Box>
      }
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <BackButton onPress={() => router.back()} />
        <LanguageButton />
      </Box>
      <Box gap="s">
        <Text variant="title" accessibilityRole="header">
          {t('you.title')}
        </Text>
        <Text variant="body">{t('you.sub')}</Text>
      </Box>

      <Box flexDirection="row" alignItems="center" gap="m">
        <ProfileAvatar avatar={s.avatar} size={72} />
        <Box flex={1} gap="xs">
          <Text variant="label" color="muted">
            {t('you.name')}
          </Text>
          <TextInput
            value={s.name}
            onChangeText={s.setName}
            placeholder={t('profile.namePlaceholder')}
            placeholderTextColor={colors.faint}
            accessibilityLabel={t('you.name')}
            maxLength={40}
            returnKeyType="done"
            style={{ height: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, fontFamily: 'Onest_600SemiBold', fontSize: 17, color: colors.ink }}
          />
        </Box>
      </Box>

      <Box gap="s">
        <Text variant="bodyStrong">{t('you.avatar')}</Text>
        <Box flexDirection="row" flexWrap="wrap" style={{ gap: 10 }} accessibilityRole="radiogroup" accessibilityLabel={t('you.avatar')}>
          {AVATARS.map((p) => {
            const on = s.avatar.kind === 'preset' && s.avatar.id === p.id;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={p.emoji}
                onPress={() => s.setAvatar({ kind: 'preset', id: p.id })}
                style={{ padding: 2, borderRadius: 20, borderWidth: 3, borderColor: on ? colors.accent : 'transparent' }}
              >
                <PresetTile preset={p} size={52} />
              </Pressable>
            );
          })}
        </Box>
      </Box>

      <Box gap="s">
        <Text variant="bodyStrong">{t('you.accent')}</Text>
        <Box flexDirection="row" gap="s" accessibilityRole="radiogroup" accessibilityLabel={t('you.accent')}>
          {ACCENTS.map((c) => {
            const on = s.accent.toUpperCase() === c;
            return (
              <Pressable
                key={c}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={c}
                onPress={() => s.setAccent(c)}
                style={{ width: 44, height: 44, borderRadius: 22, borderWidth: on ? 2 : 0, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}
              >
                <Box width={34} height={34} borderRadius="pill" alignItems="center" justifyContent="center" style={{ backgroundColor: c }}>
                  {on ? <Glyph d={UI_PATHS.check} size={16} color="#FFFFFF" strokeWidth={3} /> : null}
                </Box>
              </Pressable>
            );
          })}
        </Box>
      </Box>
    </Screen>
  );
}
