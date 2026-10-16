import { useTranslation } from 'react-i18next';
import { Box, Text } from '@/components/primitives';
import { addDays, startOfWeek, weekdayMonFirst } from '@/domain/dates';
import { useAppTheme } from '@/theme/theme';

const DAYS = [0, 1, 2, 3, 4, 5, 6];

/**
 * A weekly goal as seven day-sized segments that fill from the left, with a thin
 * neutral marker where an even pace would be today. Ahead or behind shows without
 * any red: the marker is only a reference.
 */
export function PaceBar({ progress, color, tint, today, accessibilityLabel }: { progress: number; color: string; tint: string; today: Date; accessibilityLabel?: string }) {
  const { colors } = useAppTheme();
  const clamped = Math.min(1, Math.max(0, progress));
  const pace = (weekdayMonFirst(today) + 1) / 7;
  const pct = Math.round(clamped * 100);
  return (
    <Box accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel} accessibilityValue={{ min: 0, max: 100, now: pct }} style={{ height: 12, justifyContent: 'center' }}>
      <Box flexDirection="row" style={{ gap: 4, height: 12 }}>
        {DAYS.map((i) => {
          const fill = Math.min(1, Math.max(0, clamped * 7 - i));
          return (
            <Box key={i} flex={1} borderRadius="s" style={{ backgroundColor: tint, overflow: 'hidden' }}>
              <Box style={{ width: `${fill * 100}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
            </Box>
          );
        })}
      </Box>
      <Box pointerEvents="none" style={{ position: 'absolute', top: -4, bottom: -4, left: `${pace * 100}%`, width: 2, marginLeft: -1, borderRadius: 1, backgroundColor: colors.ink, opacity: 0.5 }} />
    </Box>
  );
}

/** The seven day letters under a column of pace bars, today in the accent color. */
export function PaceDays({ today }: { today: Date }) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const monday = startOfWeek(today);
  const now = weekdayMonFirst(today);
  return (
    <Box gap="sm">
      <Box flexDirection="row" style={{ gap: 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {DAYS.map((i) => (
          <Box key={i} flex={1} alignItems="center">
            <Text variant="tiny" color={i === now ? 'accentInk' : 'muted'} style={{ fontFamily: i === now ? 'Inter_700Bold' : 'Inter_500Medium', textTransform: 'uppercase' }}>
              {new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(addDays(monday, i))}
            </Text>
          </Box>
        ))}
      </Box>
      <Box flexDirection="row" alignItems="center" style={{ gap: 8, marginTop: 4 }}>
        <Box style={{ width: 2, height: 14, borderRadius: 1, backgroundColor: colors.ink, opacity: 0.5 }} />
        <Text variant="tiny" color="muted" style={{ flex: 1 }}>
          {t('goals.paceHint')}
        </Text>
      </Box>
    </Box>
  );
}
