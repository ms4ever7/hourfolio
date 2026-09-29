import { DatePicker, Host } from '@expo/ui/swift-ui';
import { useTranslation } from 'react-i18next';
import { atMinutes } from '@/domain/day';
import { useSettingsStore } from '@/store/settings-store';
import { useAppTheme } from '@/theme/theme';
import { Box, Text } from './primitives';

function TimeRow({ label, minutes, onChange, last }: { label: string; minutes: number; onChange: (m: number) => void; last?: boolean }) {
  const { mode } = useAppTheme();
  return (
    <Box flexDirection="row" alignItems="center" gap="sm" paddingVertical="s" paddingHorizontal="m" borderBottomWidth={last ? 0 : 1} borderColor="line" style={{ minHeight: 56 }}>
      <Text variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </Text>
      <Host matchContents colorScheme={mode}>
        <DatePicker
          displayedComponents={['hourAndMinute']}
          selection={atMinutes(new Date(), minutes)}
          onDateChange={(d) => onChange(d.getHours() * 60 + d.getMinutes())}
        />
      </Host>
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
