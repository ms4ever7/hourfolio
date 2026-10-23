import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AchievementsEntry } from '@/components/achievements-entry';
import { AssetIcon, Glyph, UI_PATHS } from '@/components/icons';
import { WeekPlanCard } from '@/components/plan-card';
import { Box, Text } from '@/components/primitives';
import { PaceBar, PaceDays } from '@/components/pace-bar';
import { ActionButton, Card, Duration, PrimaryButton, RoundButton, Screen, SectionHeader } from '@/components/ui';
import { weekHistory } from '@/domain/achievements';
import { addDays, dayKey, startOfWeek, weekdayMonFirst } from '@/domain/dates';
import { sumMinutes } from '@/domain/stats';
import { useBadges } from '@/lib/badges';
import { useAssetName } from '@/lib/labels';
import { usePortfolio, useToday } from '@/lib/usePortfolio';
import { useAppTheme } from '@/theme/theme';

export default function Goals() {
  const { t } = useTranslation();
  const { colors, palette } = useAppTheme();
  const assetName = useAssetName();
  const today = useToday();
  const { assets, logs } = usePortfolio();

  const week = useMemo(() => {
    const from = startOfWeek(today);
    const range = { from: dayKey(from), to: dayKey(addDays(from, 6)) };
    return assets
      .filter((a) => a.weeklyGoalMinutes)
      .map((a) => ({ asset: a, done: sumMinutes(logs, range, a.id), goal: a.weeklyGoalMinutes! }))
      .sort((x, y) => y.done / y.goal - x.done / x.goal);
  }, [assets, logs, today]);

  const daysLeft = 7 - weekdayMonFirst(today);
  // The way into Achievements, once there is a finished week or a badge to show.
  const history = useMemo(() => weekHistory(assets, logs, today), [assets, logs, today]);
  const { earned } = useBadges();

  return (
    <Screen>
      <Box flexDirection="row" alignItems="center" gap="s">
        <Text variant="title" style={{ flex: 1 }} accessibilityRole="header">
          {t('goals.title')}
        </Text>
        {logs.length > 0 ? (
          <RoundButton accessibilityLabel={t('goals.shareWeek')} onPress={() => router.push('/share-week')}>
            <Glyph d={UI_PATHS.share} size={16} color={colors.ink} />
            <Text variant="label" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
              {t('share.button')}
            </Text>
          </RoundButton>
        ) : null}
      </Box>
      <Text variant="label" color="muted" style={{ marginTop: -12 }}>
        {t('goals.sub')}
      </Text>

      <Card gap="sm">
        <SectionHeader title={t('goals.weekly')} right={<Text variant="small">{t('goals.daysLeft', { count: daysLeft })}</Text>} />
        {week.length === 0 ? (
          <>
            <Text variant="body">{t('goals.noGoals')}</Text>
            <PrimaryButton label={t('goals.set')} onPress={() => router.push('/goals-edit')} />
          </>
        ) : (
          <>
            {week.map(({ asset, done, goal }) => {
              const p = palette[asset.color];
              const met = done >= goal;
              return (
                <Box key={asset.id} gap="s" paddingVertical="xs">
                  <Box flexDirection="row" alignItems="center" gap="sm">
                    <AssetIcon icon={asset.icon} color={asset.color} face={asset.face} size={36} />
                    <Box flex={1} gap="xs">
                      <Text variant="label" style={{ fontFamily: 'Inter_600SemiBold' }} numberOfLines={1}>
                        {assetName(asset)}
                      </Text>
                      <Box flexDirection="row" alignItems="baseline" gap="xs">
                        <Duration minutes={done} size={13} highlight={p.main} />
                        <Text variant="small">/</Text>
                        <Duration minutes={goal} size={13} quiet />
                      </Box>
                    </Box>
                    {met ? (
                      <Box flexDirection="row" alignItems="center" gap="xs" backgroundColor="daysSoft" borderRadius="pill" paddingHorizontal="s" style={{ paddingVertical: 3 }}>
                        <Glyph d={UI_PATHS.check} size={12} color={colors.days} strokeWidth={3} />
                        <Text variant="tiny" color="days" style={{ fontFamily: 'Inter_600SemiBold' }}>
                          {t('goals.met')}
                        </Text>
                      </Box>
                    ) : null}
                  </Box>
                  <PaceBar progress={done / goal} color={met ? colors.days : p.main} tint={met ? colors.daysSoft : p.tint} today={today} accessibilityLabel={assetName(asset)} />
                </Box>
              );
            })}
            <PaceDays today={today} />
            <Box flexDirection="row">
              <ActionButton label={t('goals.edit')} icon={UI_PATHS.pencil} tone="outline" onPress={() => router.push('/goals-edit')} />
            </Box>
          </>
        )}
      </Card>

      {history.length > 0 || earned.length > 0 ? <AchievementsEntry history={history} earned={earned} /> : null}

      {week.length > 0 ? <WeekPlanCard /> : null}
    </Screen>
  );
}
