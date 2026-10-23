import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { ProfileAvatar } from '@/components/avatar';
import { AssetIcon, Glyph, UI_PATHS } from '@/components/icons';
import { GoalScene } from '@/components/scenes';
import { Box, Text } from '@/components/primitives';
import { TodayPlan, useWeekPlan } from '@/components/plan-card';
import { Card, Duration, Hours, Screen, SectionHeader, TrendChip } from '@/components/ui';
import { dayKey, daysBetween, parseDay } from '@/domain/dates';
import { weekRange } from '@/domain/goals';
import { lastWeekFrom } from '@/domain/week';
import { sumMinutes } from '@/domain/stats';
import { restingAsset } from '@/domain/day';
import { durationParts } from '@/domain/format';
import { capitalMinutes, lastLogDay, trend } from '@/domain/growth';
import { dayProgress } from '@/domain/plan';
import { minutesByAsset, quickAssets, todaysSessions } from '@/domain/today';
import type { Asset } from '@/domain/types';
import { RECOVERY_ID } from '@/domain/types';
import { capitalize, longDate, useAssetName } from '@/lib/labels';
import { useSeason } from '@/lib/appearance';
import { useHour, usePortfolio, useToday } from '@/lib/usePortfolio';
import { useSettingsStore } from '@/store/settings-store';
import { useAppTheme } from '@/theme/theme';

function greetingKey(hour: number) {
  return hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
}

const logFor = (asset: Asset) => router.push({ pathname: '/log', params: { assetId: asset.id } });

/** A one-tap tile that opens the log sheet with its asset already chosen. */
function LogTile({ asset, label }: { asset: Asset; label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => logFor(asset)}
      style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 6, paddingVertical: 4, opacity: pressed ? 0.7 : 1 })}
    >
      <AssetIcon icon={asset.icon} color={asset.color} face={asset.face} size={48} />
      <Text variant="tiny" color="ink" numberOfLines={1} style={{ maxWidth: '100%' }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Home: today first, then the week's plan, then the assets. Charts live in Analytics. */
export default function Today() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { colors, palette } = useAppTheme();
  const assetName = useAssetName();
  const today = useToday();
  const hour = useHour();
  const { assets, logs } = usePortfolio();
  const avatar = useSettingsStore((s) => s.avatar);
  const name = useSettingsStore((s) => s.name.trim());
  const season = useSeason();
  const byId = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  const plan = useWeekPlan();
  // A way into last week's recap, once there is a finished week with something in it.
  const lastWeek = useMemo(() => {
    const from = lastWeekFrom(today);
    return sumMinutes(logs, weekRange(parseDay(from))) > 0 ? from : null;
  }, [logs, today]);
  const d = useMemo(() => {
    const sessions = todaysSessions(logs, today);
    const progress = dayProgress(plan, dayKey(today), logs);
    const resting = restingAsset(assets, logs, today);
    return {
      sessions,
      todayMinutes: sessions.reduce((s, l) => s + l.minutes, 0),
      planned: progress.planned,
      done: progress.done,
      byAsset: minutesByAsset(sessions),
      quick: quickAssets(assets, logs, today, 3),
      // Only a gentle word about an asset that is actually paused, never about one that is just a bit quiet.
      resting: resting && trend(resting, logs, today) === 'paused' ? resting : null,
      holdings: assets
        .map((a) => ({ asset: a, capital: capitalMinutes(a, logs), trend: trend(a, logs, today), last: lastLogDay(a.id, logs) }))
        .sort((x, y) => (y.last ?? '').localeCompare(x.last ?? '') || y.capital - x.capital),
    };
  }, [assets, logs, today, plan]);

  const shortTime = (minutes: number) =>
    durationParts(minutes)
      .map((p) => `${p.value}${t(`units.${p.unit}`)}`)
      .join(' ');
  const recovery = byId.get(RECOVERY_ID);
  const greeting = t(`greeting.${greetingKey(hour)}`);
  const relDay = (day: string) => {
    const n = daysBetween(parseDay(day), today);
    return n === 0 ? t('meta.today') : n === 1 ? t('meta.yesterday') : t('meta.daysAgo', { count: n });
  };

  return (
    <Screen>
      <Box flexDirection="row" alignItems="center" gap="s">
        <Box flex={1} gap="xs">
          <Text variant="caption">{capitalize(longDate(locale, new Date()))}</Text>
          <Text variant="heading" style={{ fontSize: 20 }} accessibilityRole="header">
            {name ? t('greeting.named', { greeting, name }) : greeting}
            {season ? ` ${season.decor}` : ''}
          </Text>
        </Box>
        <Pressable accessibilityRole="button" accessibilityLabel={t('profile.title')} onPress={() => router.navigate('/(tabs)/profile')} hitSlop={6}>
          <ProfileAvatar avatar={avatar} size={40} />
        </Pressable>
      </Box>

      <Card gap="sm">
        <Pressable accessibilityRole="button" accessibilityLabel={t('today.label')} onPress={() => router.push('/today')} style={({ pressed }) => ({ gap: 12, opacity: pressed ? 0.8 : 1 })}>
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Text variant="label" color="muted">
              {t('today.label')}
            </Text>
            <Glyph d={UI_PATHS.chevronRight} size={16} color={colors.faint} strokeWidth={2} />
          </Box>
          {d.byAsset.length === 0 ? (
            <Box gap="xs">
              <Text variant="heading" style={{ fontSize: 19 }}>
                {t('today.empty')}
              </Text>
              <Text variant="caption">{t('today.emptySub')}</Text>
            </Box>
          ) : (
            <Box gap="s">
              <Box flexDirection="row" alignItems="baseline" gap="xs">
                <Duration minutes={d.todayMinutes} size={32} />
                {d.planned > 0 ? (
                  <>
                    <Text variant="small">/</Text>
                    <Duration minutes={d.planned} size={15} quiet />
                  </>
                ) : null}
              </Box>
              {d.planned > 0 ? <GoalScene scene="bar" progress={d.done / d.planned} color={colors.accent} tint={colors.accentSoft} season={null} height={8} /> : null}
              <Box>
                {d.byAsset.map(({ assetId, minutes, parts }) => {
                  const a = byId.get(assetId);
                  if (!a) return null;
                  return (
                    <Box key={assetId} flexDirection="row" alignItems="center" gap="sm" paddingVertical="xs">
                      <AssetIcon icon={a.icon} color={a.color} face={a.face} size={28} />
                      <Box flex={1}>
                        <Text variant="label" numberOfLines={1}>
                          {assetName(a)}
                        </Text>
                        {parts.length > 1 ? (
                          <Text variant="tiny" color="muted" numberOfLines={1}>
                            {parts.map(shortTime).join(' + ')}
                          </Text>
                        ) : null}
                      </Box>
                      <Duration minutes={minutes} size={14} prefix="+" highlight={palette[a.color].main} />
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Pressable>
        <Box height={1} backgroundColor="line" />
        <Box gap="s">
          <Text variant="small" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {t('today.quick')}
          </Text>
          <Box flexDirection="row" gap="s">
            {d.quick.map((a) => (
              <LogTile key={a.id} asset={a} label={assetName(a)} />
            ))}
            {recovery ? <LogTile asset={recovery} label={t('log.rest')} /> : null}
          </Box>
        </Box>
      </Card>

      {lastWeek ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/week', params: { week: lastWeek } })}
          style={({ pressed }) => ({ height: 48, borderRadius: 16, backgroundColor: colors.accentSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.8 : 1 })}
        >
          <Glyph d={UI_PATHS.sparkle} size={16} color={colors.accentInk} strokeWidth={2} />
          <Text variant="bodyStrong" color="accentInk">
            {t('week.seeLast')}
          </Text>
        </Pressable>
      ) : null}
      <TodayPlan />

      {d.resting ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => logFor(d.resting!)}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.dashed, opacity: pressed ? 0.8 : 1 })}
        >
          <AssetIcon icon={d.resting.icon} color={d.resting.color} face={d.resting.face} size={36} />
          <Box flex={1} gap="xs">
            <Text variant="bodyStrong">{t('today.resting', { name: assetName(d.resting) })}</Text>
            <Text variant="small">{t('today.restingSub')}</Text>
          </Box>
        </Pressable>
      ) : null}

      <Box gap="sm">
        <SectionHeader
          title={t('portfolio.assets')}
          right={
            <Pressable accessibilityRole="button" accessibilityLabel={t('addAsset.title')} onPress={() => router.push('/add-asset')} hitSlop={10} testID="add-asset">
              <Text variant="label" color="accentInk" style={{ fontFamily: 'Inter_600SemiBold' }}>
                {`+ ${t('addAsset.link')}`}
              </Text>
            </Pressable>
          }
        />
        <Box backgroundColor="card" borderRadius="xl" paddingVertical="xs">
          {d.holdings.map((h, i) => (
            <Pressable
              key={h.asset.id}
              accessibilityRole="button"
              accessibilityLabel={`${assetName(h.asset)}, ${t('today.capital')}`}
              onPress={() => router.push({ pathname: '/asset/[id]', params: { id: h.asset.id } })}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 16, borderBottomWidth: i === d.holdings.length - 1 ? 0 : 1, borderColor: colors.line, opacity: pressed ? 0.7 : 1 })}
            >
              <AssetIcon icon={h.asset.icon} color={h.asset.color} face={h.asset.face} size={38} />
              <Box flex={1} gap="xs">
                <Text variant="bodyStrong" numberOfLines={1}>
                  {assetName(h.asset)}
                </Text>
                <Box flexDirection="row" alignItems="center" gap="s">
                  <TrendChip trend={h.trend} />
                  <Text variant="small" numberOfLines={1} style={{ flexShrink: 1 }}>
                    {h.last ? relDay(h.last) : t('meta.noSessions')}
                  </Text>
                </Box>
              </Box>
              <Box alignItems="flex-end" gap="xs">
                <Hours minutes={h.capital} />
                <Text variant="tiny">{t('today.capital')}</Text>
              </Box>
            </Pressable>
          ))}
        </Box>
      </Box>
    </Screen>
  );
}
