import { router } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';
import { BadgeChip, BadgeIcon } from '@/components/badge-icon';
import { Box, Text } from '@/components/primitives';
import { BackButton, Duration, Screen } from '@/components/ui';
import { historySummary, parseBadge, weekHistory, type BadgeDef, type EarnedBadge, type WeekRecord } from '@/domain/achievements';
import { addDays, parseDay } from '@/domain/dates';
import { useBadgeName, useBadges } from '@/lib/badges';
import { capitalize, monthName, shortDate } from '@/lib/labels';
import { usePortfolio, useToday } from '@/lib/usePortfolio';
import { useAppTheme } from '@/theme/theme';

/** A small uppercase heading with something on the right, the way the Weekly Wins recap labels its parts. */
function Label({ title, right }: { title: string; right?: string }) {
  const style = { fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase' as const, letterSpacing: 0.5 };
  return (
    <Box flexDirection="row" justifyContent="space-between" alignItems="baseline" paddingHorizontal="xs">
      <Text variant="tiny" accessibilityRole="header" style={style}>
        {title}
      </Text>
      {right ? (
        <Text variant="tiny" style={style}>
          {right}
        </Text>
      ) : null}
    </Box>
  );
}

function Chip({ value, label }: { value: ReactNode; label: string }) {
  return (
    <Box flex={1} backgroundColor="card" borderRadius="l" padding="sm" gap="xs">
      {typeof value === 'string' ? (
        <Text variant="bodyStrong" style={{ fontSize: 17 }}>
          {value}
        </Text>
      ) : (
        value
      )}
      <Text variant="small">{label}</Text>
    </Box>
  );
}

function BadgeTile({ def, quiet }: { def: BadgeDef; quiet?: boolean }) {
  const name = useBadgeName();
  const label = name(def);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push({ pathname: '/badge', params: { id: def.id } })}
      style={({ pressed }) => ({ width: 80, alignItems: 'center', gap: 6, opacity: pressed ? 0.7 : 1 })}
    >
      <BadgeIcon def={def} size={52} quiet={quiet} />
      <Text variant="tiny" color={quiet ? 'muted' : 'ink'} textAlign="center" numberOfLines={3} style={{ fontFamily: quiet ? 'Inter_500Medium' : 'Inter_600SemiBold', lineHeight: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

function WeekRow({ record, badges, first }: { record: WeekRecord; badges: EarnedBadge[]; first: boolean }) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const from = parseDay(record.weekFrom);
  const label = `${shortDate(i18n.language, from)} – ${shortDate(i18n.language, addDays(from, 6))}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push({ pathname: '/week', params: { week: record.weekFrom } })}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: first ? 0 : 1, borderTopColor: colors.line, opacity: pressed ? 0.7 : 1 })}
    >
      <Box flex={1} gap="xs">
        <Text variant="label" style={{ fontFamily: 'Inter_600SemiBold' }}>
          {label}
        </Text>
        <Box flexDirection="row" alignItems="baseline" gap="xs">
          <Duration minutes={record.total} size={12} />
          {record.best ? <Text variant="small">· {t('achievements.bestWeek')}</Text> : null}
        </Box>
        {badges.length > 0 ? (
          <Box flexDirection="row" flexWrap="wrap" gap="xs" style={{ marginTop: 2 }}>
            {badges.map((b) => (
              <BadgeChip key={b.id} id={b.id} />
            ))}
          </Box>
        ) : null}
      </Box>
      {record.goalsTotal > 0 ? (
        <Box alignItems="flex-end" gap="xs">
          <Box borderRadius="pill" paddingHorizontal="s" style={{ paddingVertical: 3, backgroundColor: record.allMet ? colors.daysSoft : colors.track }}>
            <Text variant="tiny" style={{ fontFamily: 'Inter_600SemiBold', color: record.allMet ? colors.days : colors.muted }}>
              {record.allMet ? t('achievements.allGoals') : t('week.ofCount', { done: record.goalsMet, total: record.goalsTotal })}
            </Text>
          </Box>
          <Box flexDirection="row" gap="xs">
            {Array.from({ length: Math.min(record.goalsTotal, 8) }, (_, i) => (
              <Box key={i} width={9} height={9} borderRadius="pill" style={{ backgroundColor: i < record.goalsMet ? colors.accent : colors.track }} />
            ))}
          </Box>
        </Box>
      ) : null}
    </Pressable>
  );
}

/** Every finished week and every badge: the collection on top, the history below, each week opening its recap. */
export default function Achievements() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const today = useToday();
  const { assets, logs } = usePortfolio();
  const { earned, ahead } = useBadges();
  const history = useMemo(() => weekHistory(assets, logs, today), [assets, logs, today]);
  const summary = historySummary(history);
  const total = earned.length + ahead.length;
  const earnedDefs = earned.map((b) => parseBadge(b.id)).filter((d) => d !== null);

  // Weeks grouped by the month their Monday falls in, newest first.
  const months = useMemo(() => {
    const groups: { key: string; title: string; weeks: WeekRecord[] }[] = [];
    for (const record of history) {
      const key = record.weekFrom.slice(0, 7);
      let group = groups.find((g) => g.key === key);
      if (!group) {
        const date = parseDay(record.weekFrom);
        const title = capitalize(monthName(i18n.language, date)) + (date.getFullYear() === today.getFullYear() ? '' : ` ${date.getFullYear()}`);
        group = { key, title, weeks: [] };
        groups.push(group);
      }
      group.weeks.push(record);
    }
    return groups;
  }, [history, i18n.language, today]);

  return (
    <Screen>
      <Box flexDirection="row" alignItems="center" gap="sm">
        <BackButton onPress={() => router.back()} />
        <Text variant="title" style={{ fontSize: 24 }} accessibilityRole="header">
          {t('achievements.title')}
        </Text>
      </Box>

      <Box gap="xs" paddingHorizontal="xs">
        <Box flexDirection="row" alignItems="baseline" gap="s" flexWrap="wrap">
          <Duration minutes={summary.total} size={36} />
          <Text variant="heading" color="muted">
            {t('achievements.heroIn', { count: summary.weeks })}
          </Text>
        </Box>
        <Text variant="caption">{t('achievements.heroLine')}</Text>
      </Box>

      <Box flexDirection="row" gap="s">
        <Chip value={String(summary.fullWeeks)} label={t('achievements.fullWeeksLabel')} />
        <Chip value={<Duration minutes={summary.best} size={17} />} label={t('achievements.biggest')} />
        <Chip value={t('achievements.ofTotal', { earned: earned.length, total })} label={t('achievements.badgesEarned')} />
      </Box>

      <Box gap="sm">
        <Label title={t('achievements.badges')} right={t('achievements.ofTotal', { earned: earned.length, total })} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={{ paddingHorizontal: 24, gap: 8, alignItems: 'flex-start' }}>
          {earnedDefs.map((def) => (
            <BadgeTile key={def.id} def={def} />
          ))}
          {earnedDefs.length > 0 && ahead.length > 0 ? <Box width={1} alignSelf="stretch" style={{ backgroundColor: colors.border, marginVertical: 8, marginHorizontal: 4 }} /> : null}
          {ahead.map((def) => (
            <BadgeTile key={def.id} def={def} quiet />
          ))}
        </ScrollView>
      </Box>

      <Box gap="sm">
        <Label title={t('achievements.weeks')} right={history.length > 0 ? t('achievements.soFar', { count: history.length }) : undefined} />
        <Box backgroundColor="card" borderRadius="xl" paddingHorizontal="m" paddingVertical="xs">
          {history.length === 0 ? (
            <Text variant="body" paddingVertical="sm">
              {t('achievements.empty')}
            </Text>
          ) : (
            months.map((group) => (
              <Box key={group.key}>
                <Text variant="small" style={{ fontFamily: 'Inter_600SemiBold', paddingTop: 12, paddingBottom: 2 }}>
                  {group.title}
                </Text>
                {group.weeks.map((record, i) => (
                  <WeekRow key={record.weekFrom} record={record} first={i === 0} badges={earned.filter((b) => b.weekFrom === record.weekFrom)} />
                ))}
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Screen>
  );
}
