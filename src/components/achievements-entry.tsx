import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { historySummary, parseBadge, type EarnedBadge, type WeekRecord } from '@/domain/achievements';
import { useDurationText } from '@/lib/labels';
import { useAppTheme } from '@/theme/theme';
import { BadgeIcon } from './badge-icon';
import { Glyph, UI_PATHS } from './icons';
import { Box, Text } from './primitives';

/** The way into Achievements from Goals: the latest badges and one line of numbers. */
export function AchievementsEntry({ history, earned }: { history: WeekRecord[]; earned: EarnedBadge[] }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const time = useDurationText();
  const summary = historySummary(history);
  const latest = earned.slice(0, 3).map((b) => parseBadge(b.id)).filter((d) => d !== null);
  const parts = [
    earned.length > 0 ? t('achievements.badgesCount', { count: earned.length }) : null,
    summary.fullWeeks > 0 ? t('achievements.fullWeeks', { count: summary.fullWeeks }) : null,
    summary.weeks > 0 ? t('achievements.inWeeks', { time: time(summary.total), count: summary.weeks }) : null,
  ].filter((p) => p !== null);
  return (
    <Pressable
      testID="goals-achievements"
      accessibilityRole="button"
      accessibilityLabel={t('achievements.title')}
      onPress={() => router.push('/achievements')}
      style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.8 : 1 })}
    >
      <Box flexDirection="row" alignItems="center">
        {latest.length > 0 ? (
          latest.map((def, i) => (
            <Box key={def.id} borderRadius="s" style={{ marginLeft: i === 0 ? 0 : -10, borderWidth: 2, borderColor: colors.card, borderRadius: 13 }}>
              <BadgeIcon def={def} size={32} />
            </Box>
          ))
        ) : (
          <Box width={36} height={36} borderRadius="s" backgroundColor="accentSoft" alignItems="center" justifyContent="center">
            <Text style={{ fontSize: 18, lineHeight: 24 }} allowFontScaling={false}>
              🏆
            </Text>
          </Box>
        )}
      </Box>
      <Box flex={1} gap="xs">
        <Text variant="bodyStrong">{t('achievements.title')}</Text>
        {parts.length > 0 ? (
          <Text variant="small" numberOfLines={2}>
            {parts.join(' · ')}
          </Text>
        ) : null}
      </Box>
      <Glyph d={UI_PATHS.chevronRight} size={18} color={colors.muted} strokeWidth={2} />
    </Pressable>
  );
}
