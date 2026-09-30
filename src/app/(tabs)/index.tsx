import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { ProfileAvatar } from '@/components/avatar';
import { AssetIcon } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { GoalScene } from '@/components/scenes';
import { Card, Duration, Hours, Screen, SectionHeader, TextButton, TrendChip } from '@/components/ui';
import { daysBetween, parseDay, weekdayMonFirst } from '@/domain/dates';
import { restingAsset } from '@/domain/day';
import { weekRange, type SceneId } from '@/domain/goals';
import { capitalMinutes, lastLogDay, trend } from '@/domain/growth';
import { sumMinutes } from '@/domain/stats';
import { minutesByAsset, quickAssets, todaysSessions } from '@/domain/today';
import type { SeasonId } from '@/domain/seasons';
import type { Asset } from '@/domain/types';
import { RECOVERY_ID } from '@/domain/types';
import { capitalize, longDate, useAssetName } from '@/lib/labels';
import { useSeason } from '@/lib/appearance';
import { usePortfolio, useToday } from '@/lib/usePortfolio';
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

/** Home: today first, then this week's goals, then the assets. Charts live in Analytics. */
export default function Today() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { colors, palette } = useAppTheme();
  const assetName = useAssetName();
  const today = useToday();
  const { assets, logs } = usePortfolio();
  const avatar = useSettingsStore((s) => s.avatar);
  const name = useSettingsStore((s) => s.name.trim());
  const scene = useSettingsStore((s) => s.goalScene);
  const season = useSeason();
  const byId = useMemo(() => new Map(assets.map((a) => [a.id, a])), [assets]);

  const d = useMemo(() => {
    const week = weekRange(today);
    const sessions = todaysSessions(logs, today);
    const resting = restingAsset(assets, logs, today);
    return {
      sessions,
      todayMinutes: sessions.reduce((s, l) => s + l.minutes, 0),
      byAsset: minutesByAsset(sessions),
      quick: quickAssets(assets, logs, today, 3),
      goals: assets.filter((a) => a.weeklyGoalMinutes).map((a) => ({ asset: a, done: sumMinutes(logs, week, a.id), goal: a.weeklyGoalMinutes! })),
      // Only a gentle word about an asset that is actually paused, never about one that is just a bit quiet.
      resting: resting && trend(resting, logs, today) === 'paused' ? resting : null,
      holdings: assets
        .map((a) => ({ asset: a, capital: capitalMinutes(a, logs), trend: trend(a, logs, today), last: lastLogDay(a.id, logs) }))
        .sort((x, y) => (y.last ?? '').localeCompare(x.last ?? '') || y.capital - x.capital),
    };
  }, [assets, logs, today]);

  const recovery = byId.get(RECOVERY_ID);
  const greeting = t(`greeting.${greetingKey(new Date().getHours())}`);
  const daysLeft = 7 - weekdayMonFirst(today);
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
        <Text variant="label" color="muted">
          {t('today.label')}
        </Text>
        {d.byAsset.length === 0 ? (
          <Box gap="xs">
            <Text variant="heading" style={{ fontSize: 19 }}>
              {t('today.empty')}
            </Text>
            <Text variant="caption">{t('today.emptySub')}</Text>
          </Box>
        ) : (
          <Box gap="s">
            <Duration minutes={d.todayMinutes} size={32} />
            <Box>
              {d.byAsset.slice(0, 3).map(({ assetId, minutes }) => {
                const a = byId.get(assetId);
                if (!a) return null;
                return (
                  <Box key={assetId} flexDirection="row" alignItems="center" gap="sm" paddingVertical="xs">
                    <AssetIcon icon={a.icon} color={a.color} face={a.face} size={28} />
                    <Text variant="label" numberOfLines={1} style={{ flex: 1 }}>
                      {assetName(a)}
                    </Text>
                    <Duration minutes={minutes} size={14} prefix="+" highlight={palette[a.color].main} />
                  </Box>
                );
              })}
              {d.byAsset.length > 3 ? <Text variant="small">{t('today.more', { count: d.byAsset.length - 3 })}</Text> : null}
            </Box>
          </Box>
        )}
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

      <Box gap="sm">
        <SectionHeader title={t('today.goals')} right={d.goals.length ? <Text variant="small">{t('goals.daysLeft', { count: daysLeft })}</Text> : undefined} />
        {d.goals.length === 0 ? (
          <Card gap="xs">
            <Text variant="caption">{t('goals.noGoals')}</Text>
            <TextButton label={t('goals.set')} onPress={() => router.push('/goals-edit')} />
          </Card>
        ) : (
          <Pressable accessibilityRole="link" onPress={() => router.navigate('/(tabs)/goals')} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
            <Card gap="sm">
              {d.goals.map(({ asset, done, goal }) => {
                const met = done >= goal;
                return (
                  <Box key={asset.id} gap="xs">
                    <Box flexDirection="row" alignItems="center" gap="s">
                      <Text variant="label" numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter_600SemiBold' }}>
                        {assetName(asset)}
                      </Text>
                      <Box flexDirection="row" alignItems="baseline" gap="xs">
                        <Duration minutes={done} size={13} highlight={palette[asset.color].main} />
                        <Text variant="small">/</Text>
                        <Duration minutes={goal} size={13} quiet />
                      </Box>
                    </Box>
                    <GoalSceneRow scene={scene} progress={done / goal} met={met} color={asset.color} season={season?.id ?? null} label={assetName(asset)} />
                  </Box>
                );
              })}
            </Card>
          </Pressable>
        )}
      </Box>

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
        <SectionHeader title={t('portfolio.assets')} />
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

function GoalSceneRow({ scene, progress, met, color, season, label }: { scene: SceneId; progress: number; met: boolean; color: Asset['color']; season: SeasonId | null; label: string }) {
  const { colors, palette } = useAppTheme();
  const p = palette[color];
  return <GoalScene scene={scene} progress={progress} color={met ? colors.days : p.main} tint={met ? colors.daysSoft : p.tint} season={season} height={36} accessibilityLabel={label} />;
}
