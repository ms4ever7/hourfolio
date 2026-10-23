import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { DayTimes } from '@/components/day-form';
import { Box, Text } from '@/components/primitives';
import { BackButton, Group, Screen, SwitchRow } from '@/components/ui';
import { alertNotificationsOff, allowNotifications } from '@/lib/notifications';
import { useSettingsStore } from '@/store/settings-store';

/** Profile → Your day: the same times as in onboarding, plus the evening check-in. */
export default function DaySettings() {
  const { t } = useTranslation();
  const checkIn = useSettingsStore((s) => s.eveningCheckIn);
  const setCheckIn = useSettingsStore((s) => s.setEveningCheckIn);
  const planReminders = useSettingsStore((s) => s.planReminders);
  const setPlanReminders = useSettingsStore((s) => s.setPlanReminders);
  return (
    <Screen>
      <Box flexDirection="row" alignItems="center" gap="sm">
        <BackButton onPress={() => router.back()} />
        <Text variant="title" style={{ fontSize: 24 }} accessibilityRole="header">
          {t('day.title')}
        </Text>
      </Box>
      <Text variant="body">{t('day.sub')}</Text>
      <DayTimes />
      <Group>
        <SwitchRow
          title={t('day.checkIn')}
          sub={t('day.checkInSub')}
          value={checkIn}
          onChange={async (on) => {
            if (on && !(await allowNotifications())) {
              alertNotificationsOff(t);
              return;
            }
            setCheckIn(on);
          }}
        />
        <SwitchRow
          title={t('day.planReminders')}
          sub={t('day.planRemindersSub')}
          value={planReminders}
          onChange={async (on) => {
            if (on && !(await allowNotifications())) {
              alertNotificationsOff(t);
              return;
            }
            setPlanReminders(on);
          }}
          last
        />
      </Group>
    </Screen>
  );
}
