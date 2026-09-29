import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CumulativeChart, Donut, Sparkline } from './charts';
import { AssetIcon } from './icons';
import { Box, Text } from './primitives';
import { Card, Hours, SectionHeader, Segmented, TrendChip } from './ui';
import { addDays, daysBetween, daysInMonth, parseDay } from '@/domain/dates';
import { formatHours, formatHoursDelta, percent } from '@/domain/format';
import { allocation, cumulativeHours, periodRanges, sumMinutes, type Period } from '@/domain/stats';
import { capitalize, monthGenitive, monthName, shortDate, useAssetName } from '@/lib/labels';
import { useHoldings, usePortfolio, useToday, type Holding } from '@/lib/usePortfolio';
import { useAppTheme } from '@/theme/theme';

const PERIODS: Period[] = ['week', 'month', 'year', 'all'];

function periodLength(period: Period, today: Date, elapsed: number) {
  if (period === 'week') return 7;
  if (period === 'month') return daysInMonth(today);
  if (period === 'year') return daysBetween(new Date(today.getFullYear(), 0, 1), new Date(today.getFullYear() + 1, 0, 1));
  return elapsed;
}

/** The period report: hours for a week, month, year or all time, compared with the one before, with the chart, allocation and per-asset numbers. */
export function PeriodReport() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { colors, palette } = useAppTheme();
  const { width } = useWindowDimensions();
  const assetName = useAssetName();
  const today = useToday();
  const { assets, logs } = usePortfolio();
  const [period, setPeriod] = useState<Period>('month');

  const { current, previous } = useMemo(() => periodRanges(period, today, logs), [period, today, logs]);
  const holdings = useHoldings(assets, logs, current, previous, today);
  const total = sumMinutes(logs, current);
  const prevTotal = previous ? sumMinutes(logs, previous) : 0;

  const chart = useMemo(() => {
    const from = parseDay(current.from);
    const elapsed = daysBetween(from, today) + 1;
    const prev = previous ? cumulativeHours(logs, parseDay(previous.from), daysBetween(parseDay(previous.from), parseDay(previous.to)) + 1) : null;
    return {
      current: cumulativeHours(logs, from, elapsed),
      previous: prev,
      totalDays: periodLength(period, today, elapsed),
      labels: [shortDate(locale, from), shortDate(locale, addDays(from, Math.floor(periodLength(period, today, elapsed) / 2))), t('portfolio.today')] as [string, string, string],
    };
  }, [current, previous, logs, period, today, locale, t]);

  const slices = useMemo(() => allocation(logs, current), [logs, current]);
  const byId = new Map(assets.map((a) => [a.id, a]));

  const periodLabel = {
    week: t('portfolio.thisWeek'),
    month: monthName(locale, today),
    year: t('portfolio.thisYear'),
    all: t('portfolio.allTime'),
  }[period];
  const prevLabel = {
    week: t('portfolio.lastWeek'),
    month: monthGenitive(locale, new Date(today.getFullYear(), today.getMonth() - 1, 1)),
    year: t('portfolio.lastYear'),
    all: '',
  }[period];
  const gain = total - prevTotal;
  const chartWidth = width - 48;

  return (
    <>
      <Box gap="s">
        <Text variant="label" color="muted">
          {t('portfolio.invested', { period: periodLabel })}
        </Text>
        <Hours minutes={total} variant="display" />
        {previous && prevTotal > 0 ? (
          <Box flexDirection="row" alignItems="center" gap="sm">
            <Box flexDirection="row" alignItems="center" gap="xs" backgroundColor={gain >= 0 ? 'hoursSoft' : 'track'} borderRadius="pill" paddingHorizontal="sm" style={{ paddingVertical: 4 }}>
              <Svg width={10} height={10} viewBox="0 0 10 10">
                <Path d={gain >= 0 ? 'M5 1l4 7H1z' : 'M5 9L1 2h8z'} fill={gain >= 0 ? colors.hoursInk : colors.body} />
              </Svg>
              <Text variant="monoSmall" style={{ color: gain >= 0 ? colors.hoursInk : colors.body, fontFamily: 'JetBrainsMono_600SemiBold', fontSize: 13 }}>
                {formatHours(Math.abs(gain), locale)} {t('units.h')}
              </Text>
            </Box>
            <Text variant="caption">
              {t('portfolio.vsPrev', { pct: `${gain >= 0 ? '+' : '−'}${percent(Math.abs(gain) / prevTotal)}`, period: prevLabel })}
            </Text>
          </Box>
        ) : null}
      </Box>

      <Segmented label={t('portfolio.invested', { period: '' })} value={period} onChange={setPeriod} options={PERIODS.map((p) => ({ value: p, label: t(`period.${p}`) }))} />

      <Box gap="s">
        <CumulativeChart width={chartWidth} current={chart.current} previous={chart.previous} totalDays={chart.totalDays} labels={chart.labels} accessibilityLabel={t('portfolio.chartLabel')} />
        {previous ? (
          <Box flexDirection="row" gap="ml">
            <Box flexDirection="row" alignItems="center" gap="s">
              <Box width={16} height={3} borderRadius="pill" backgroundColor="hours" />
              <Text variant="small">{capitalize(periodLabel)}</Text>
            </Box>
            <Box flexDirection="row" alignItems="center" gap="s">
              <Box width={16} style={{ borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.previous }} />
              <Text variant="small">
                {capitalize(period === 'month' ? monthName(locale, new Date(today.getFullYear(), today.getMonth() - 1, 1)) : prevLabel)} · {formatHours(prevTotal, locale)} {t('units.h')}
              </Text>
            </Box>
          </Box>
        ) : null}
      </Box>

      {logs.length === 0 ? (
        <Card>
          <Text variant="heading">{t('portfolio.emptyTitle')}</Text>
          <Text variant="body">{t('portfolio.emptySub')}</Text>
        </Card>
      ) : (
        <Card>
          <SectionHeader title={t('portfolio.allocation')} right={<Text variant="small">{periodLabel}</Text>} />
          <Box flexDirection="row" alignItems="center" gap="ml">
            <Donut
              slices={slices.map((s) => ({ share: s.share, color: s.assetId === 'other' ? colors.previous : palette[byId.get(s.assetId)?.color ?? 'grey'].main }))}
              centerTop={formatHours(total, locale)}
              centerBottom={t('units.h')}
              accessibilityLabel={slices.map((s) => `${s.assetId === 'other' ? t('portfolio.other') : assetName(byId.get(s.assetId)!)} ${percent(s.share)}`).join(', ')}
            />
            <Box flex={1} gap="s">
              {slices.map((s) => {
                const a = byId.get(s.assetId);
                return (
                  <Box key={s.assetId} flexDirection="row" alignItems="center" gap="s">
                    <Box width={8} height={8} style={{ borderRadius: 2, backgroundColor: a ? palette[a.color].main : colors.previous }} />
                    <Text variant="caption" color="ink" numberOfLines={1} style={{ flex: 1 }}>
                      {a ? assetName(a) : t('portfolio.other')}
                    </Text>
                    <Text variant="monoSmall">{percent(s.share)}</Text>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Card>
      )}

      <Box gap="sm">
        <SectionHeader title={t('portfolio.assets')} />
        <Box backgroundColor="card" borderRadius="xl" paddingVertical="xs">
          {holdings.map((h, i) => (
            <HoldingRow key={h.asset.id} h={h} last={i === holdings.length - 1} name={assetName(h.asset)} today={today} showDelta={Boolean(previous)} />
          ))}
        </Box>
      </Box>
    </>
  );
}

function HoldingRow({ h, last, name, today, showDelta }: { h: Holding; last: boolean; name: string; today: Date; showDelta: boolean }) {
  const { t, i18n } = useTranslation();
  const { colors, palette } = useAppTheme();
  const delta = h.minutes - h.prevMinutes;
  const meta =
    h.trend === 'paused' && h.lastDay
      ? t('meta.daysAgo', { count: daysBetween(parseDay(h.lastDay), today) })
      : h.sessions > 0
        ? t('meta.sessions', { count: h.sessions })
        : h.lastDay
          ? t('meta.daysAgo', { count: daysBetween(parseDay(h.lastDay), today) })
          : t('meta.noSessions');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${formatHours(h.minutes, i18n.language)} ${t('units.h')}`}
      onPress={() => router.push({ pathname: '/asset/[id]', params: { id: h.asset.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 1,
        borderColor: colors.line,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <AssetIcon icon={h.asset.icon} color={h.asset.color} face={h.asset.face} size={40} />
      <Box flex={1} gap="xs">
        <Text variant="bodyStrong" numberOfLines={1}>
          {name}
        </Text>
        <Box flexDirection="row" alignItems="center" gap="s">
          <TrendChip trend={h.trend} />
          <Text variant="small" numberOfLines={1} style={{ flexShrink: 1 }}>
            {meta}
          </Text>
        </Box>
      </Box>
      <Sparkline values={h.spark} color={palette[h.asset.color].main} />
      <Box alignItems="flex-end" gap="xs" style={{ width: 72 }}>
        <Hours minutes={h.minutes} />
        {showDelta ? (
          <Text variant="monoSmall" style={{ color: delta > 0 ? colors.hoursInk : colors.muted }}>
            {formatHoursDelta(delta, i18n.language)}
          </Text>
        ) : null}
      </Box>
    </Pressable>
  );
}
