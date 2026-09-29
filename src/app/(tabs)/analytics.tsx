import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Heatmap, StackedBar } from '@/components/charts';
import { AssetIcon, Glyph, ICON_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { PeriodReport } from '@/components/period-report';
import { Card, Hours, Screen, SectionHeader } from '@/components/ui';
import { addDays, dayKey, startOfMonth, startOfWeek } from '@/domain/dates';
import { formatHours, formatHoursDelta, percent } from '@/domain/format';
import { energyBalance, monthHeatmap, sumMinutes } from '@/domain/stats';
import { ENERGY_TYPES, RECOVERY_ID } from '@/domain/types';
import { capitalize, monthYear, useAssetName } from '@/lib/labels';
import { usePortfolio, useToday } from '@/lib/usePortfolio';
import { energyColor, useAppTheme } from '@/theme/theme';

const ENERGY_ICON = { mind: 'code', creative: 'guitar', body: 'dumbbell', recovery: 'moon' } as const;

export default function Analytics() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const { colors, palette, heatSteps } = useAppTheme();
  const assetName = useAssetName();
  const today = useToday();
  const { assets, logs } = usePortfolio();

  const d = useMemo(() => {
    const monthStart = startOfMonth(today);
    const range = { from: dayKey(monthStart), to: dayKey(today) };
    const prevRange = { from: dayKey(new Date(today.getFullYear(), today.getMonth() - 1, 1)), to: dayKey(addDays(monthStart, -1)) };
    const balance = energyBalance(assets, logs, range);
    const prevBalance = energyBalance(assets, logs, prevRange);
    const total = sumMinutes(logs, range);
    const restDays = new Set(logs.filter((l) => l.assetId === RECOVERY_ID && l.day >= range.from && l.day <= range.to).map((l) => l.day)).size;
    return { balance, prevBalance, total, restDays, heat: monthHeatmap(logs, today, today) };
  }, [assets, logs, today]);

  // Localized Mon–Sun initials from a known Monday.
  const weekdays = useMemo(() => {
    const monday = startOfWeek(today);
    return Array.from({ length: 7 }, (_, i) => capitalize(new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(addDays(monday, i))).slice(0, 2));
  }, [locale, today]);

  const order = [...ENERGY_TYPES].sort((a, b) => d.balance[b] - d.balance[a]);

  const members = (e: string) =>
    assets
      .filter((a) => a.energy === e && a.id !== RECOVERY_ID)
      .map((a) => assetName(a))
      .slice(0, 3)
      .join(', ');

  return (
    <Screen>
      <Text variant="title" accessibilityRole="header">
        {t('analytics.title')}
      </Text>

      <PeriodReport />

      <SectionHeader title={capitalize(monthYear(locale, today))} />

      <Card>
        <Box gap="xs">
          <Text variant="heading">{t('analytics.energy')}</Text>
          <Text variant="caption">{t('analytics.energySub', { hours: formatHours(d.total, locale) })}</Text>
        </Box>
        {d.total === 0 ? (
          <Text variant="caption">{t('analytics.empty')}</Text>
        ) : (
          <StackedBar
            parts={order.map((e) => ({ share: d.balance[e] / d.total, color: palette[energyColor[e]].main }))}
            accessibilityLabel={ENERGY_TYPES.map((e) => `${t(`energy.${e}`)} ${percent(d.balance[e] / d.total)}`).join(', ')}
          />
        )}
        <Box>
          {order.map((e, i) => (
              <Box key={e} flexDirection="row" alignItems="center" gap="sm" paddingVertical="s" borderBottomWidth={i === 3 ? 0 : 1} borderColor="line">
                <AssetIcon icon={ENERGY_ICON[e]} color={energyColor[e]} size={36} />
                <Box flex={1} gap="xs">
                  <Text variant="label" style={{ fontSize: 15 }}>
                    {t(`energy.${e}`)}
                  </Text>
                  {members(e) ? (
                    <Text variant="small" numberOfLines={1}>
                      {members(e)}
                    </Text>
                  ) : null}
                </Box>
                <Box alignItems="flex-end" gap="xs">
                  <Hours minutes={d.balance[e]} unitSize={12} />
                  <Text variant="monoSmall" style={{ color: d.balance[e] >= d.prevBalance[e] ? colors.hoursInk : colors.muted }}>
                    {formatHoursDelta(d.balance[e] - d.prevBalance[e], locale)}
                  </Text>
                </Box>
              </Box>
            ))}
        </Box>
      </Card>

      <Card gap="sm">
        <SectionHeader title={t('analytics.calendar')} />
        <Heatmap cells={d.heat} weekdays={weekdays} />
        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
          <Box flexDirection="row" alignItems="center" gap="xs">
            <Text variant="tiny">{t('analytics.less')}</Text>
            {heatSteps.map((c) => (
              <Box key={c} width={12} height={12} style={{ borderRadius: 3, backgroundColor: c }} />
            ))}
            <Text variant="tiny">{t('analytics.more')}</Text>
          </Box>
          <Box flexDirection="row" alignItems="center" gap="s">
            <Box width={12} height={12} backgroundColor="daysSoft" style={{ borderRadius: 3 }} />
            <Text variant="tiny">{t('analytics.restDay')}</Text>
          </Box>
        </Box>
      </Card>

      <Box backgroundColor="inverse" borderRadius="xl" padding="ml" gap="s">
        <Box flexDirection="row" alignItems="center" gap="s">
          <Glyph d={ICON_PATHS.moon} size={16} color={colors.daysOnInverse} strokeWidth={2} />
          <Text variant="small" color="daysOnInverse" style={{ fontFamily: 'Onest_600SemiBold' }}>
            {t('analytics.insight')}
          </Text>
        </Box>
        <Text variant="heading" color="onInverse" style={{ fontSize: 18 }}>
          {t('analytics.restTitle')}
        </Text>
        <Text variant="body" color="onInverseMuted" style={{ fontSize: 14 }}>
          {d.restDays > 0 ? t('analytics.restDays', { count: d.restDays }) : t('analytics.noRest')}
        </Text>
      </Box>
    </Screen>
  );
}
