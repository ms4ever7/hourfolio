import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeIcon } from '@/components/badge-icon';
import { Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { Duration, PrimaryButton, sheetPad, TextButton } from '@/components/ui';
import { loggedMinutes, parseBadge } from '@/domain/achievements';
import { addDays, parseDay } from '@/domain/dates';
import { weekSummary } from '@/domain/week';
import { useBadgeName } from '@/lib/badges';
import { shortDate, useAssetName, useDurationText } from '@/lib/labels';
import { usePortfolio } from '@/lib/usePortfolio';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAppTheme } from '@/theme/theme';

/** One badge: what it is, how it was earned (or what earns it) and the week it belongs to. */
export default function BadgeSheet() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { assets, logs } = usePortfolio();
  const plans = usePortfolioStore((s) => s.plans);
  const badges = usePortfolioStore((s) => s.badges);
  const badgeName = useBadgeName();
  const assetName = useAssetName();
  const time = useDurationText();

  const def = parseBadge(id ?? '');
  const earned = badges.find((b) => b.id === id) ?? null;
  const asset = def?.kind === 'asset' ? assets.find((a) => a.id === def.assetId) : undefined;
  const week = useMemo(() => (earned ? weekSummary(assets, logs, plans.find((p) => p.weekFrom === earned.weekFrom), earned.weekFrom) : null), [assets, logs, plans, earned]);

  if (!def || (def.kind === 'asset' && !asset)) return null;

  let how: string;
  if (def.kind === 'fixed') how = t(`badges.${def.id}.${earned ? 'how' : 'ahead'}`);
  else {
    const name = assetName(asset!);
    const soFar = loggedMinutes(logs, def.assetId);
    how = earned ? t('badges.hours.how', { name, hours: def.hours }) : soFar > 0 ? t('badges.hours.ahead', { name, time: time(soFar) }) : t('badges.hours.aheadNone', { name });
  }
  const weekFrom = earned ? parseDay(earned.weekFrom) : null;

  return (
    <Box padding="l" gap="m" style={{ paddingTop: 20, paddingBottom: sheetPad(insets.bottom) }}>
      <Box alignItems="center" gap="s">
        <BadgeIcon def={def} size={84} quiet={!earned} />
        <Text variant="tiny" color="muted" style={{ fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 6 }}>
          {earned ? t('achievements.earnedOn', { date: shortDate(i18n.language, parseDay(earned.day)) }) : t('achievements.stillAhead')}
        </Text>
        <Text variant="title" style={{ fontSize: 22, lineHeight: 27 }} textAlign="center" accessibilityRole="header">
          {badgeName(def)}
        </Text>
        <Text variant="body" textAlign="center" style={{ maxWidth: 320 }}>
          {how}
        </Text>
      </Box>

      {earned && week && weekFrom ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/week', params: { week: earned.weekFrom } })}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, opacity: pressed ? 0.8 : 1 })}
        >
          <Box flex={1} gap="xs">
            <Text variant="label" style={{ fontFamily: 'Inter_600SemiBold' }}>
              {`${shortDate(i18n.language, weekFrom)} – ${shortDate(i18n.language, addDays(weekFrom, 6))}`}
            </Text>
            <Box flexDirection="row" alignItems="baseline" gap="xs" flexWrap="wrap">
              <Duration minutes={week.total} size={12} />
              {week.goals.length > 0 ? (
                <Text variant="small">
                  · {week.allMet ? t('achievements.allGoals') : t('week.ofCount', { done: week.goalsMet, total: week.goals.length })} {week.allMet ? '' : t('week.goalsMet')}
                </Text>
              ) : null}
            </Box>
          </Box>
          <Glyph d={UI_PATHS.chevronRight} size={18} color={colors.muted} strokeWidth={2} />
        </Pressable>
      ) : null}

      <Box gap="xs">
        {earned ? (
          <>
            <PrimaryButton label={t('achievements.openWeek')} onPress={() => router.push({ pathname: '/week', params: { week: earned.weekFrom } })} />
            <TextButton label={t('common.done')} onPress={() => router.back()} />
          </>
        ) : (
          <PrimaryButton label={t('achievements.nice')} onPress={() => router.back()} />
        )}
      </Box>
    </Box>
  );
}
