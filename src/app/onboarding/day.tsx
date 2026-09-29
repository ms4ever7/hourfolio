import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DayTimes } from '@/components/day-form';
import { UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { BackButton, Group, LanguageButton, PrimaryButton, Screen, SwitchRow } from '@/components/ui';
import { allowNotifications } from '@/lib/notifications';
import { useOnboardingStore } from '@/store/onboarding-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useSettingsStore } from '@/store/settings-store';

/** Last onboarding step: when the day starts and ends, so reminders come at a good moment. */
export default function DayStep() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const drafts = useOnboardingStore((s) => s.drafts);
  const setUpPortfolio = usePortfolioStore((s) => s.setUpPortfolio);
  const checkIn = useSettingsStore((s) => s.eveningCheckIn);
  const setCheckIn = useSettingsStore((s) => s.setEveningCheckIn);
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);

  const finish = async () => {
    // Permission is asked only here, right after the user chose to get the check-in.
    if (checkIn && !(await allowNotifications())) setCheckIn(false);
    setUpPortfolio(drafts);
    setOnboarded(true);
    router.replace('/(tabs)');
  };

  return (
    <Screen
      footer={
        <Box paddingHorizontal="l" style={{ paddingBottom: insets.bottom + 8 }}>
          <PrimaryButton label={t('day.open')} icon={UI_PATHS.arrowRight} onPress={() => void finish()} />
        </Box>
      }
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <BackButton onPress={() => router.back()} />
        <LanguageButton />
      </Box>
      <Box gap="s">
        <Text variant="title" accessibilityRole="header">
          {t('day.title')}
        </Text>
        <Text variant="body">{t('day.sub')}</Text>
      </Box>
      <DayTimes />
      <Group>
        <SwitchRow title={t('day.checkIn')} sub={t('day.checkInSub')} value={checkIn} onChange={setCheckIn} last />
      </Group>
      <Text variant="small">{t('day.change')}</Text>
    </Screen>
  );
}
