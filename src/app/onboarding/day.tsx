import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DayTimes } from '@/components/day-form';
import { UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { BackButton, Group, LanguageButton, OnboardingFooter, PrimaryButton, Screen, SwitchRow } from '@/components/ui';
import { allowNotifications } from '@/lib/notifications';
import { useSettingsStore } from '@/store/settings-store';

/** Last onboarding step: when the day starts and ends, so reminders come at a good moment. */
export default function DayStep() {
  const { t } = useTranslation();
  const checkIn = useSettingsStore((s) => s.eveningCheckIn);
  const setCheckIn = useSettingsStore((s) => s.setEveningCheckIn);
  const nudges = useSettingsStore((s) => s.nudges);
  const setNudges = useSettingsStore((s) => s.setNudges);

  const next = async () => {
    // iOS asks for permission once, here, and only if a reminder was chosen.
    if ((checkIn || nudges) && !(await allowNotifications())) {
      setCheckIn(false);
      setNudges(false);
    }
    router.push('/onboarding/you');
  };

  return (
    <Screen
      footer={
        <OnboardingFooter primary={<PrimaryButton label={t('common.continue')} icon={UI_PATHS.arrowRight} onPress={() => void next()} />} />
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
        <SwitchRow title={t('day.checkIn')} sub={t('day.checkInSub')} value={checkIn} onChange={setCheckIn} />
        <SwitchRow title={t('profile.nudges')} sub={t('profile.nudgesSub')} value={nudges} onChange={setNudges} last />
      </Group>
      <Text variant="small">{t('day.change')}</Text>
    </Screen>
  );
}
