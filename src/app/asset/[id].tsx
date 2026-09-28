import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WeeklyBars } from '@/components/charts';
import { AssetIcon, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { BackButton, Card, Duration, Hours, LanguageButton, PrimaryButton, Screen, SectionHeader } from '@/components/ui';
import { addDays, dayKey, daysBetween, parseDay, startOfMonth, startOfWeek } from '@/domain/dates';
import { formatHours, formatHoursDelta } from '@/domain/format';
import { capitalMinutes, momentum, MOMENTUM_FLOOR, nextMilestone, trend, weeksTo } from '@/domain/growth';
import { sumMinutes, weeklyMinutes } from '@/domain/stats';
import { capitalize, sessionDate, shortDate, useAssetName } from '@/lib/labels';
import { useToday } from '@/lib/usePortfolio';
import { usePortfolioStore } from '@/store/portfolio-store';
import { assetPalette, useAppTheme } from '@/theme/theme';

const WEEKS = 12;

export default function AssetScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const assetName = useAssetName();
  const today = useToday();
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = usePortfolioStore((s) => s.assets.find((a) => a.id === id));
  const allLogs = usePortfolioStore((s) => s.logs);
  const removeLog = usePortfolioStore((s) => s.removeLog);

  const data = useMemo(() => {
    if (!asset) return null;
    const logs = allLogs.filter((l) => l.assetId === asset.id);
    const monthStart = startOfMonth(today);
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisMonth = { from: dayKey(monthStart), to: dayKey(today) };
    const weekly = weeklyMinutes(logs, asset.id, WEEKS, today);
    const capital = capitalMinutes(asset, logs);
    const milestone = nextMilestone(capital);
    const weeklyAvg = weekly.reduce((a, b) => a + b, 0) / WEEKS;
    const first = logs.reduce((min, l) => (l.day < min ? l.day : min), dayKey(new Date(asset.createdAt)));
    const last = logs.reduce<string | null>((max, l) => (max === null || l.day > max ? l.day : max), null);
    return {
      logs,
      capital,
      since: parseDay(first),
      month: sumMinutes(logs, thisMonth),
      prevMonth: sumMinutes(logs, { from: dayKey(prevMonthStart), to: dayKey(addDays(monthStart, -1)) }),
      sessionsThisMonth: logs.filter((l) => l.day >= thisMonth.from).length,
      momentum: momentum(asset, logs, today),
      trend: trend(asset, logs, today),
      weekly,
      weeklyAvg,
      avgSession: logs.length ? logs.reduce((a, l) => a + l.minutes, 0) / logs.length : 0,
      longest: logs.reduce((a, l) => Math.max(a, l.minutes), 0),
      last,
      nextMilestone: milestone.next,
      progress: milestone.progress,
      etaWeeks: weeksTo(milestone.toGoMinutes, weeklyAvg),
      toGo: milestone.toGoMinutes,
      recent: [...logs].sort((a, b) => b.day.localeCompare(a.day) || b.createdAt.localeCompare(a.createdAt)).slice(0, 10),
    };
  }, [asset, allLogs, today]);

  if (!asset || !data) {
    return (
      <Screen>
        <BackButton onPress={() => router.back()} />
        <Text variant="body">{t('asset.notFound')}</Text>
      </Screen>
    );
  }

  const p = assetPalette[asset.color];
  const name = assetName(asset);
  const monthDelta = data.month - data.prevMonth;
  const relDay = (day: string) => {
    const n = daysBetween(parseDay(day), today);
    return n === 0 ? t('meta.today') : n === 1 ? t('meta.yesterday') : t('meta.daysAgo', { count: n });
  };
  const firstWeek = addDays(startOfWeek(today), -7 * (WEEKS - 1));
  const confirmRemove = (logId: string) =>
    Alert.alert(t('settings.confirm'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeLog(logId) },
    ]);

  return (
    <Screen
      footer={
        <Box paddingHorizontal="l" style={{ paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
          <PrimaryButton dark icon={UI_PATHS.plus} label={t('asset.log')} onPress={() => router.push({ pathname: '/log', params: { assetId: asset.id } })} />
        </Box>
      }
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <BackButton onPress={() => router.back()} />
        <LanguageButton />
      </Box>

      <Box flexDirection="row" alignItems="center" gap="sm">
        <AssetIcon icon={asset.icon} color={asset.color} size={64} />
        <Box flex={1} gap="xs">
          <Text variant="title" style={{ fontSize: 26 }} accessibilityRole="header">
            {name}
          </Text>
          <Text variant="caption">
            {t(`energy.${asset.energy}`)} · {t(`rhythm.${asset.rhythm}`)}
          </Text>
        </Box>
      </Box>

      <Box gap="s">
        <Text variant="label" color="muted">
          {t('asset.capital')}
        </Text>
        <Hours minutes={data.capital} variant="display" />
        <Text variant="caption">{t('asset.since', { date: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(data.since) })}</Text>
      </Box>

      <Box flexDirection="row" gap="sm">
        <Card gap="s" style={{ flex: 1, padding: 16 }}>
          <Text variant="small">{t('asset.thisMonth')}</Text>
          <Hours minutes={data.month} unitSize={15} />
          <Text variant="monoSmall" style={{ color: monthDelta > 0 ? colors.hoursInk : colors.muted }}>
            {formatHoursDelta(monthDelta, locale)} {t('asset.vsLastMonth')}
          </Text>
        </Card>
        <Card gap="s" style={{ flex: 1, padding: 16 }}>
          <Box flexDirection="row" justifyContent="space-between">
            <Text variant="small">{t('asset.momentum')}</Text>
            <Text variant="small" color={data.trend === 'growing' ? 'hoursInk' : 'muted'} style={{ fontFamily: 'Onest_600SemiBold' }}>
              {t(`trend.${data.trend}`)}
            </Text>
          </Box>
          <Text variant="mono" style={{ fontSize: 24 }}>
            {data.momentum}
            <Text variant="caption">/100</Text>
          </Text>
          <Box height={8} borderRadius="pill" style={{ backgroundColor: p.tint }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: data.momentum }}>
            <Box height={8} borderRadius="pill" style={{ width: `${data.momentum}%`, backgroundColor: p.main }} />
            <Box position="absolute" backgroundColor="ink" style={{ left: `${MOMENTUM_FLOOR}%`, top: -3, width: 2, height: 14 }} />
          </Box>
          <Text variant="tiny">{t('asset.floor', { floor: MOMENTUM_FLOOR })}</Text>
        </Card>
      </Box>

      <Card>
        <SectionHeader title={t('asset.weekly')} right={<Text variant="small">{t('asset.weeks', { count: WEEKS })}</Text>} />
        <WeeklyBars
          width={width - 88}
          minutes={data.weekly}
          color={p.main}
          soft={p.soft}
          avgLabel={t('asset.avg', { value: formatHours(data.weeklyAvg, locale) })}
          breakLabel=""
          labels={[shortDate(locale, firstWeek), shortDate(locale, addDays(firstWeek, 7 * Math.floor(WEEKS / 2))), t('asset.thisWeek')]}
          accessibilityLabel={t('asset.weekly')}
        />
      </Card>

      <Box flexDirection="row" flexWrap="wrap" backgroundColor="track" borderRadius="l" overflow="hidden" style={{ gap: 1 }}>
        {[
          { label: t('asset.avgSession'), value: data.avgSession ? <Duration minutes={Math.round(data.avgSession)} size={17} /> : <Text variant="bodyStrong">—</Text> },
          { label: t('asset.longest'), value: data.longest ? <Duration minutes={data.longest} size={17} /> : <Text variant="bodyStrong">—</Text> },
          { label: t('asset.sessionsThisMonth'), value: <Text variant="bodyStrong" style={{ fontSize: 17 }}>{data.sessionsThisMonth}</Text> },
          { label: t('asset.lastSession'), value: <Text variant="bodyStrong" color="days" style={{ fontSize: 17 }}>{data.last ? relDay(data.last) : '—'}</Text> },
        ].map((s) => (
          <Box key={s.label} backgroundColor="card" gap="xs" paddingVertical="sm" paddingHorizontal="m" style={{ width: '49.8%', flexGrow: 1 }}>
            <Text variant="small">{s.label}</Text>
            {s.value}
          </Box>
        ))}
      </Box>

      <Card gap="sm">
        <SectionHeader title={t('asset.milestone')} />
        <Box flexDirection="row" justifyContent="space-between" alignItems="baseline">
          <Hours minutes={data.nextMilestone * 60} variant="bodyStrong" />
          {data.etaWeeks !== null ? <Text variant="caption">{t('asset.milestoneEta', { count: data.etaWeeks })}</Text> : null}
        </Box>
        <Box height={8} borderRadius="pill" style={{ backgroundColor: p.tint }}>
          <Box height={8} borderRadius="pill" style={{ width: `${Math.max(2, Math.round(data.progress * 100))}%`, backgroundColor: p.main }} />
        </Box>
        <Text variant="small">{t('asset.toGo', { hours: formatHours(data.toGo, locale) })}</Text>
      </Card>

      <Box gap="sm">
        <SectionHeader title={t('asset.recent')} />
        <Box backgroundColor="card" borderRadius="xl" paddingVertical="xs">
          {data.recent.length === 0 ? (
            <Box padding="m">
              <Text variant="caption">{t('asset.noSessions')}</Text>
            </Box>
          ) : (
            data.recent.map((l, i) => (
              <Pressable
                key={l.id}
                onLongPress={() => confirmRemove(l.id)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: i === data.recent.length - 1 ? 0 : 1, borderColor: colors.line }}
              >
                <Box flex={1} gap="xs">
                  <Text variant="label" numberOfLines={2}>
                    {l.note || capitalize(relDay(l.day))}
                  </Text>
                  <Text variant="small">{capitalize(sessionDate(locale, parseDay(l.day)))}</Text>
                </Box>
                <Duration minutes={l.minutes} size={14} prefix="+" />
              </Pressable>
            ))
          )}
        </Box>
      </Box>
    </Screen>
  );
}
