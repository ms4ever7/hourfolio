import { DatePicker, Host } from '@expo/ui/swift-ui';
import { atMinutes } from '@/domain/day';
import { useAppTheme } from '@/theme/theme';

/** A time of day as minutes after midnight, with the native iOS picker. */
export function TimeField({ minutes, onChange }: { minutes: number; onChange: (m: number) => void; label?: string }) {
  const { mode } = useAppTheme();
  return (
    <Host matchContents colorScheme={mode}>
      <DatePicker
        displayedComponents={['hourAndMinute']}
        selection={atMinutes(new Date(), minutes)}
        onDateChange={(d) => onChange(d.getHours() * 60 + d.getMinutes())}
      />
    </Host>
  );
}
