import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeChip } from '@/components/badge-icon';
import { Confetti } from '@/components/confetti';
import { AssetIcon, UI_PATHS } from '@/components/icons';
import { PaceBar } from '@/components/pace-bar';
import { Box, Text } from '@/components/primitives';
import { Duration, PrimaryButton, TextButton, footerPad } from '@/components/ui';
import { addDays, parseDay } from '@/domain/dates';
import { durationParts } from '@/domain/format';
import { usePortfolio, useToday } from '@/lib/usePortfolio';
import { shortDate, useAssetName } from '@/lib/labels';
import { weekSummary } from '@/domain/week';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAppTheme } from '@/theme/theme';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Box backgroundColor="card" borderRadius="l" padding="sm" gap="xs" style={{ width: '48.5%', flexGrow: 1 }}>
      <Text variant="bodyStrong" style={{ fontSize: 17 }}>
        {value}
      </Text>
      <Text variant="small">{label}</Text>
    </Box>
  );
}

/**
 * A week in numbers. `celebrate` (set when logging completes the last goal) turns it into
 * the "week complete" moment; otherwise it is a calm recap, softer when few goals were met.
 */
export default function Week() {
  const { t, i18n } = useTranslation();
  const { colors, palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const assetName = useAssetName();
  const today = useToday();
  const { week, celebrate } = useLocalSearchParams<{ week: string; celebrate?: string }>();
  const { assets, logs } = usePortfolio();
  const plans = usePortfolioStore((s) => s.plans);
  const badges = usePortfolioStore((s) => s.badges);
  const earnedHere = badges.filter((b) => b.weekFrom === week);
  const s = useMemo(() => weekSummary(assets, logs, plans.find((p) => p.weekFrom === week), week), [assets, logs, plans, week]);
  const complete = celebrate === '1' && s.allMet;

  useEffect(() => {
    if (complete) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [complete]);

  const time = (minutes: number) =>
    durationParts(minutes)
      .map((p) => `${p.value}${t(`units.${p.unit}`)}`)
      .join(' ');
  const from = parseDay(week);
  const label = `${shortDate(i18n.language, from)} – ${shortDate(i18n.language, addDays(from, 6))}`;
  const more = s.total - s.previousTotal;
  const sub = complete ? t('congrats.all') : s.light ? t('week.light') : more > 0 && s.previousTotal > 0 ? t('week.moreThan', { time: time(more) }) : null;

  return (
    <Box flex={1} backgroundColor="ground">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingTop: 28, gap: 16 }}>
        <Box gap="xs" alignItems={complete ? 'center' : 'flex-start'}>
          {complete ? (
            <Box width={84} height={84} borderRadius="xl" backgroundColor="daysSoft" alignItems="center" justifyContent="center" style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 40, lineHeight: 48 }}>🏆</Text>
            </Box>
          ) : null}
          <Text variant="label" color="muted" style={{ fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {label}
          </Text>
          <Text variant="title" accessibilityRole="header" textAlign={complete ? 'center' : 'left'}>
            {complete ? t('week.completeTitle') : t('week.invested', { time: time(s.total) })}
          </Text>
          {sub ? (
            <Text variant="body" textAlign={complete ? 'center' : 'left'}>
              {sub}
            </Text>
          ) : null}
          {complete ? (
            <Box style={{ marginTop: 8 }}>
              <Duration minutes={s.total} size={36} />
            </Box>
          ) : null}
        </Box>

        <Box flexDirection="row" flexWrap="wrap" gap="s">
          {s.goals.length > 0 ? <Stat value={t('week.ofCount', { done: s.goalsMet, total: s.goals.length })} label={t('week.goalsMet')} /> : null}
          {s.sessionsPlanned > 0 ? <Stat value={t('week.ofCount', { done: s.sessionsDone, total: s.sessionsPlanned })} label={t('week.sessionsDone')} /> : null}
          {s.top ? <Stat value={`${assetName(s.top.asset)} · ${time(s.top.minutes)}`} label={t('week.mostTime')} /> : null}
          {s.restDays > 0 ? <Stat value={t('week.days', { count: s.restDays })} label={t('week.rest')} /> : null}
          {s.light ? <Stat value={`+${time(s.total)}`} label={t('week.added')} /> : null}
        </Box>

        {earnedHere.length > 0 ? (
          <Box backgroundColor="accentSoft" borderRadius="l" padding="sm" gap="s">
            <Text variant="tiny" color="accentInk" style={{ fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('achievements.earnedThisWeek')}
            </Text>
            <Box flexDirection="row" flexWrap="wrap" gap="xs">
              {earnedHere.map((b) => (
                <BadgeChip key={b.id} id={b.id} />
              ))}
            </Box>
          </Box>
        ) : null}

        {s.goals.length > 0 ? (
          <Box backgroundColor="card" borderRadius="xl" padding="m" gap="sm">
            {s.goals.map(({ asset, done, goal, met }) => {
              const p = palette[asset.color];
              return (
                <Box key={asset.id} gap="s">
                  <Box flexDirection="row" alignItems="center" gap="sm">
                    <AssetIcon icon={asset.icon} color={asset.color} face={asset.face} size={28} />
                    <Text variant="label" numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter_600SemiBold' }}>
                      {assetName(asset)}
                    </Text>
                    <Duration minutes={done} size={13} highlight={p.main} />
                    <Text variant="small">/</Text>
                    <Duration minutes={goal} size={13} quiet />
                  </Box>
                  <PaceBar progress={done / goal} color={met ? colors.days : p.main} tint={met ? colors.daysSoft : p.tint} today={today} marker={false} accessibilityLabel={assetName(asset)} />
                </Box>
              );
            })}
          </Box>
        ) : null}
      </ScrollView>
      <Box paddingHorizontal="l" gap="xs" style={{ paddingBottom: footerPad(insets.bottom), paddingTop: 8 }}>
        <PrimaryButton icon={UI_PATHS.share} label={t('share.title')} onPress={() => router.push({ pathname: '/share-week', params: { week } })} />
        <TextButton label={t('congrats.done')} onPress={() => router.back()} />
      </Box>
      {complete ? <Confetti colors={[colors.accent, colors.hours, colors.minutes, colors.days]} /> : null}
    </Box>
  );
}
