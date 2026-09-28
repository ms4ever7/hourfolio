import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AssetIcon, Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { Card, Duration, Hours, LanguageButton, PrimaryButton, Screen, SectionHeader, TextButton } from '@/components/ui';
import { addDays, dayKey, startOfWeek, weekdayMonFirst } from '@/domain/dates';
import { capitalMinutes, nextMilestone, weeksTo } from '@/domain/growth';
import { sumMinutes, weeklyMinutes } from '@/domain/stats';
import { useAssetName } from '@/lib/labels';
import { usePortfolio, useToday } from '@/lib/usePortfolio';
import { assetPalette, useAppTheme } from '@/theme/theme';

function Bar({ progress, color, tint }: { progress: number; color: string; tint: string }) {
  const pct = Math.round(Math.min(1, progress) * 100);
  return (
    <Box height={8} borderRadius="pill" style={{ backgroundColor: tint }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <Box height={8} borderRadius="pill" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }} />
    </Box>
  );
}

export default function Goals() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
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

  const milestones = useMemo(
    () =>
      assets
        .map((a) => {
          const m = nextMilestone(capitalMinutes(a, logs));
          const pace = weeklyMinutes(logs, a.id, 12, today).reduce((s, v) => s + v, 0) / 12;
          return { asset: a, ...m, weeks: weeksTo(m.toGoMinutes, pace) };
        })
        .sort((x, y) => y.progress - x.progress),
    [assets, logs, today],
  );

  const daysLeft = 7 - weekdayMonFirst(today);

  return (
    <Screen>
      <Box flexDirection="row" alignItems="center" gap="s">
        <Text variant="title" style={{ flex: 1 }} accessibilityRole="header">
          {t('goals.title')}
        </Text>
        <LanguageButton />
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
              const p = assetPalette[asset.color];
              const met = done >= goal;
              return (
                <Box key={asset.id} gap="s" paddingVertical="xs">
                  <Box flexDirection="row" alignItems="center" gap="sm">
                    <AssetIcon icon={asset.icon} color={asset.color} size={36} />
                    <Box flex={1} gap="xs">
                      <Text variant="label" style={{ fontFamily: 'Onest_600SemiBold' }} numberOfLines={1}>
                        {assetName(asset)}
                      </Text>
                      <Box flexDirection="row" alignItems="baseline" gap="xs">
                        <Duration minutes={done} size={13} />
                        <Text variant="small">/</Text>
                        <Duration minutes={goal} size={13} />
                      </Box>
                    </Box>
                    {met ? (
                      <Box flexDirection="row" alignItems="center" gap="xs" backgroundColor="daysSoft" borderRadius="pill" paddingHorizontal="s" style={{ paddingVertical: 3 }}>
                        <Glyph d={UI_PATHS.check} size={12} color={colors.days} strokeWidth={3} />
                        <Text variant="tiny" color="days" style={{ fontFamily: 'Onest_600SemiBold' }}>
                          {t('goals.met')}
                        </Text>
                      </Box>
                    ) : null}
                  </Box>
                  <Bar progress={done / goal} color={met ? colors.days : p.main} tint={met ? colors.daysSoft : p.tint} />
                </Box>
              );
            })}
            <TextButton label={t('goals.edit')} onPress={() => router.push('/goals-edit')} />
          </>
        )}
      </Card>

      <Box gap="sm">
        <SectionHeader title={t('goals.milestones')} />
        <Box backgroundColor="card" borderRadius="xl" paddingVertical="xs">
          {milestones.map((m, i) => {
            const p = assetPalette[m.asset.color];
            return (
              <Box key={m.asset.id} gap="s" paddingVertical="sm" paddingHorizontal="m" borderBottomWidth={i === milestones.length - 1 ? 0 : 1} borderColor="line">
                <Box flexDirection="row" alignItems="center" gap="sm">
                  <AssetIcon icon={m.asset.icon} color={m.asset.color} size={36} />
                  <Box flex={1} gap="xs">
                    <Text variant="label" style={{ fontFamily: 'Onest_600SemiBold' }} numberOfLines={1}>
                      {assetName(m.asset)}
                    </Text>
                    {m.weeks !== null ? <Text variant="small">{t('asset.milestoneEta', { count: m.weeks })}</Text> : null}
                  </Box>
                  <Hours minutes={m.next * 60} variant="bodyStrong" />
                </Box>
                <Bar progress={m.progress} color={p.main} tint={p.tint} />
              </Box>
            );
          })}
        </Box>
      </Box>
    </Screen>
  );
}
