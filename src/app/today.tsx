import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssetIcon } from '@/components/icons';
import { SessionRow, useWeekPlan } from '@/components/plan-card';
import { Box, Text } from '@/components/primitives';
import { GoalScene } from '@/components/scenes';
import { ActionButton, Duration, PrimaryButton, RoundButton, footerPad } from '@/components/ui';
import { dayKey } from '@/domain/dates';
import { dayProgress, isSessionDone, sessionsOn } from '@/domain/plan';
import { logResized, todaysSessions } from '@/domain/today';
import { UI_PATHS } from '@/components/icons';
import { capitalize, longDate, useAssetName } from '@/lib/labels';
import { useToday } from '@/lib/usePortfolio';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAppTheme } from '@/theme/theme';

/** Everything logged today, which can be corrected here, and what the plan still has for the day. */
export default function TodaySheet() {
  const { t, i18n } = useTranslation();
  const { colors, palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const assetName = useAssetName();
  const today = useToday();
  const assets = usePortfolioStore((s) => s.assets);
  const logs = usePortfolioStore((s) => s.logs);
  const updateLog = usePortfolioStore((s) => s.updateLog);
  const removeLog = usePortfolioStore((s) => s.removeLog);
  const plan = useWeekPlan();
  const key = dayKey(today);
  const small = { minWidth: 32, width: 32, height: 32, borderRadius: 16, paddingHorizontal: 0 } as const;

  const entries = useMemo(() => todaysSessions(logs, today), [logs, today]);
  const total = entries.reduce((n, l) => n + l.minutes, 0);
  const { planned, done } = dayProgress(plan, key, logs);
  const left = sessionsOn(plan, key).filter((s) => !isSessionDone(s, logs));

  return (
    <Box flex={1} backgroundColor="ground">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingTop: 28, gap: 16 }}>
        <Box gap="xs">
          <Text variant="caption">{capitalize(longDate(i18n.language, today))}</Text>
          <Text variant="title" accessibilityRole="header">
            {t('today.label')}
          </Text>
        </Box>

        <Box backgroundColor="card" borderRadius="xl" padding="m" gap="sm">
          <Box flexDirection="row" alignItems="baseline" gap="xs">
            <Duration minutes={total} size={32} />
            {planned > 0 ? (
              <>
                <Text variant="small">/</Text>
                <Duration minutes={planned} size={15} quiet />
              </>
            ) : null}
          </Box>
          {planned > 0 ? <GoalScene scene="bar" progress={done / planned} color={colors.accent} tint={colors.accentSoft} season={null} height={8} /> : null}
          <Text variant="small">{planned > 0 ? t('today.planProgress') : entries.length === 0 ? t('today.empty') : t('today.noPlan')}</Text>
        </Box>

        {entries.length > 0 ? (
          <Box gap="sm">
            <Text variant="label" color="muted">
              {t('today.logged')}
            </Text>
            {entries.map((l) => {
              const asset = assets.find((a) => a.id === l.assetId);
              if (!asset) return null;
              const name = assetName(asset);
              return (
                <Box key={l.id} flexDirection="row" alignItems="center" gap="s" backgroundColor="card" borderRadius="l" paddingHorizontal="s" style={{ minHeight: 56 }}>
                  <AssetIcon icon={asset.icon} color={asset.color} face={asset.face} size={36} />
                  <Box flex={1}>
                    <Text variant="label" numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold' }}>
                      {name}
                    </Text>
                    <Duration minutes={l.minutes} size={13} highlight={palette[asset.color].main} />
                  </Box>
                  <RoundButton accessibilityLabel={`${t('common.less')}: ${name}`} onPress={() => updateLog(l.id, logResized(l.minutes, -1))} style={small}>
                    <Text variant="bodyStrong">−</Text>
                  </RoundButton>
                  <RoundButton accessibilityLabel={`${t('common.more')}: ${name}`} onPress={() => updateLog(l.id, logResized(l.minutes, 1))} style={small}>
                    <Text variant="bodyStrong">+</Text>
                  </RoundButton>
                  <Pressable accessibilityRole="button" accessibilityLabel={`${t('today.remove')}: ${name}`} onPress={() => removeLog(l.id)} hitSlop={8} style={{ width: 32, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                    <Text variant="heading">×</Text>
                  </Pressable>
                </Box>
              );
            })}
          </Box>
        ) : null}

        <Box flexDirection="row">
          <ActionButton label={t('today.add')} icon={UI_PATHS.plus} tone="outline" onPress={() => router.push('/log')} />
        </Box>

        {left.length > 0 ? (
          <Box gap="sm">
            <Text variant="label" color="muted">
              {t('today.planned')}
            </Text>
            {left.map((s) => (
              <SessionRow key={s.id} session={s} logs={logs} />
            ))}
          </Box>
        ) : null}
      </ScrollView>
      <Box paddingHorizontal="l" style={{ paddingBottom: footerPad(insets.bottom), paddingTop: 8 }}>
        <PrimaryButton label={t('common.done')} onPress={() => router.back()} />
      </Box>
    </Box>
  );
}
