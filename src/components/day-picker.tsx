import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { addDays, dayKey, daysInMonth, parseDay, startOfMonth, weekdayMonFirst } from '@/domain/dates';
import { useAppTheme } from '@/theme/theme';

/** A month calendar in a bottom sheet. Days after `max` can't be picked. All JS, so it ships over the air. */
export function DayPicker({ visible, value, max, onPick, onClose }: { visible: boolean; value: string; max: string; onPick: (day: string) => void; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(() => startOfMonth(parseDay(value)));

  const maxMonth = startOfMonth(parseDay(max));
  const atMax = month.getTime() >= maxMonth.getTime();
  const shift = (by: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + by, 1));
  const lead = weekdayMonFirst(month);
  const cells = [...Array<null>(lead).fill(null), ...Array.from({ length: daysInMonth(month) }, (_, i) => dayKey(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  // Weekday names from a known Monday.
  const monday = addDays(new Date(2024, 0, 1), 0);
  const names = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(addDays(monday, i)));
  const title = new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric' }).format(month);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={() => setMonth(startOfMonth(parseDay(value)))}>
      <Pressable accessibilityLabel={t('common.cancel')} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} />
      <Box backgroundColor="ground" style={{ padding: 20, paddingBottom: insets.bottom + 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12 }}>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <Pressable accessibilityRole="button" accessibilityLabel={t('dayPicker.prevMonth')} onPress={() => shift(-1)} hitSlop={10} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Box style={{ transform: [{ rotate: '180deg' }] }}>
              <Glyph d={UI_PATHS.chevronRight} size={20} color={colors.ink} strokeWidth={2.4} />
            </Box>
          </Pressable>
          <Text variant="heading" accessibilityRole="header" style={{ textTransform: 'capitalize' }}>
            {title}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel={t('dayPicker.nextMonth')} disabled={atMax} onPress={() => shift(1)} hitSlop={10} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: atMax ? 0.3 : 1 }}>
            <Glyph d={UI_PATHS.chevronRight} size={20} color={colors.ink} strokeWidth={2.4} />
          </Pressable>
        </Box>
        <Box flexDirection="row">
          {names.map((n, i) => (
            <Box key={i} style={{ width: `${100 / 7}%` }} alignItems="center">
              <Text variant="small">{n}</Text>
            </Box>
          ))}
        </Box>
        <Box flexDirection="row" flexWrap="wrap">
          {cells.map((d, i) => {
            if (!d) return <Box key={`b${i}`} style={{ width: `${100 / 7}%`, height: 46 }} />;
            const on = d === value;
            const off = d > max;
            return (
              <Box key={d} style={{ width: `${100 / 7}%`, height: 46 }} alignItems="center" justifyContent="center">
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: on, disabled: off }}
                  accessibilityLabel={new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }).format(parseDay(d))}
                  disabled={off}
                  onPress={() => onPick(d)}
                  style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.inverse : 'transparent', borderWidth: d === max && !on ? 1 : 0, borderColor: colors.border, opacity: off ? 0.3 : 1 }}
                >
                  <Text variant="label" color={on ? 'onInverse' : 'ink'} style={{ fontFamily: 'Inter_600SemiBold' }}>
                    {Number(d.slice(8))}
                  </Text>
                </Pressable>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Modal>
  );
}
