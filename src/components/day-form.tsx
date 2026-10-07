import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/store/settings-store';
import { Box, Text } from './primitives';
import { TimeField } from './time-field';

function TimeRow({ label, minutes, onChange, last }: { label: string; minutes: number; onChange: (m: number) => void; last?: boolean }) {
  return (
    <Box flexDirection="row" alignItems="center" gap="sm" paddingVertical="s" paddingHorizontal="m" borderBottomWidth={last ? 0 : 1} borderColor="line" style={{ minHeight: 56 }}>
      <Text variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </Text>
      <TimeField label={label} minutes={minutes} onChange={onChange} />
    </Box>
  );
}

/** Wake-up and bed times, used to time reminders. */
export function DayTimes() {
  const { t } = useTranslation();
  const wake = useSettingsStore((s) => s.wakeTime);
  const bed = useSettingsStore((s) => s.bedTime);
  const setDay = useSettingsStore((s) => s.setDay);
  return (
    <Box backgroundColor="card" borderRadius="xl" overflow="hidden">
      <TimeRow label={t('day.wake')} minutes={wake} onChange={(wakeTime) => setDay({ wakeTime })} />
      <TimeRow label={t('day.bed')} minutes={bed} onChange={(bedTime) => setDay({ bedTime })} last />
    </Box>
  );
}
