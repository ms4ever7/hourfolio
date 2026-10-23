import { useTranslation } from 'react-i18next';
import { useWindowDimensions } from 'react-native';
import { CumulativeChart } from '@/components/charts';
import { AssetIcon, Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { PaceBar, PaceDays } from '@/components/pace-bar';
import { GoalScene } from '@/components/scenes';
import { Card, Duration, Hours } from '@/components/ui';
import { addDays, startOfWeek } from '@/domain/dates';
import type { IconKey, PaletteKey } from '@/domain/types';
import { shortDate } from '@/lib/labels';
import { useAppTheme } from '@/theme/theme';

/** Sample hobbies for the welcome tour. Static: nothing here reads or writes the user's data. */
const DEMO: Record<'guitar' | 'running' | 'coding', { icon: IconKey; color: PaletteKey }> = {
  guitar: { icon: 'guitar', color: 'magenta' },
  running: { icon: 'route', color: 'vermilion' },
  coding: { icon: 'code', color: 'violet' },
};
type DemoId = keyof typeof DEMO;

function useDemoName() {
  const { t } = useTranslation();
  return (id: DemoId) => t(`catalog.${id}`);
}

function SessionTile({ id, minutes, done }: { id: DemoId; minutes: number; done?: boolean }) {
  const { t } = useTranslation();
  const { colors, palette } = useAppTheme();
  const name = useDemoName();
  const p = palette[DEMO[id].color];
  return (
    <Box flexDirection="row" alignItems="center" gap="sm" style={{ padding: 10, borderRadius: 16, backgroundColor: done ? colors.track : p.tint }}>
      <AssetIcon icon={DEMO[id].icon} color={DEMO[id].color} size={36} />
      <Box flex={1} gap="xs">
        <Text variant="label" numberOfLines={1} color={done ? 'muted' : 'ink'} style={{ fontFamily: 'Inter_600SemiBold' }}>
          {name(id)}
        </Text>
        <Duration minutes={minutes} size={13} quiet={done} highlight={p.main} />
      </Box>
      {done ? (
        <Box width={26} height={26} borderRadius="pill" backgroundColor="daysSoft" alignItems="center" justifyContent="center">
          <Glyph d={UI_PATHS.check} size={14} color={colors.days} strokeWidth={3} />
        </Box>
      ) : (
        <Box backgroundColor="card" borderRadius="pill" paddingHorizontal="sm" style={{ paddingVertical: 7 }}>
          <Text variant="tiny" color="accentInk" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {t('plan.log')}
          </Text>
        </Box>
      )}
    </Box>
  );
}

const WEEK_PLAN = [90, 60, 120, 0, 60, 60, 0];
const TODAY_INDEX = 2;

/** Slide 1: the weekly plan, a week of days with their hours and today's sessions. */
export function PlanPreview() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const monday = startOfWeek(new Date());
  const planned = WEEK_PLAN.reduce((a, b) => a + b, 0);
  const done = 195;
  return (
    <Card gap="sm">
      <Box flexDirection="row" alignItems="center" gap="s">
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {t('plan.weekTitle')}
        </Text>
        <Box flexDirection="row" alignItems="baseline" gap="xs">
          <Duration minutes={done} size={13} />
          <Text variant="small">/</Text>
          <Duration minutes={planned} size={13} quiet />
        </Box>
      </Box>
      <GoalScene scene="bar" progress={done / planned} color={colors.accent} tint={colors.accentSoft} season={null} />
      <Box flexDirection="row" style={{ gap: 4 }}>
        {WEEK_PLAN.map((minutes, i) => {
          const date = addDays(monday, i);
          const isToday = i === TODAY_INDEX;
          const past = i < TODAY_INDEX;
          return (
            <Box key={i} flex={1} alignItems="center" gap="s" backgroundColor={isToday ? 'accentSoft' : undefined} style={{ paddingTop: 8, paddingBottom: 6, borderRadius: 14 }}>
              <Text variant="tiny" color={isToday ? 'accentInk' : 'muted'} numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold' }}>
                {new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(date)}
              </Text>
              <Box width={28} height={28} borderRadius="pill" alignItems="center" justifyContent="center" backgroundColor={isToday ? 'accent' : past && minutes > 0 ? 'daysSoft' : 'track'}>
                {past && minutes > 0 ? (
                  <Glyph d={UI_PATHS.check} size={12} color={colors.days} strokeWidth={3} />
                ) : (
                  <Text variant="tiny" color={isToday ? 'onAccent' : 'body'} style={{ fontFamily: 'Inter_600SemiBold' }}>
                    {date.getDate()}
                  </Text>
                )}
              </Box>
              <Text variant="tiny" color={isToday ? 'accentInk' : 'muted'} numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold' }}>
                {minutes ? `${Math.round((minutes / 60) * 10) / 10}${t('units.h')}` : ' '}
              </Text>
            </Box>
          );
        })}
      </Box>
      <SessionTile id="guitar" minutes={45} done />
      <SessionTile id="running" minutes={75} />
    </Card>
  );
}

/** Slide 2: today's hours and weekly goals as little scenes. */
export function ProgressPreview() {
  const { t } = useTranslation();
  const { colors, palette } = useAppTheme();
  const name = useDemoName();
  const today = new Date();
  const goals: { id: DemoId; done: number; goal: number }[] = [
    { id: 'guitar', done: 150, goal: 180 },
    { id: 'running', done: 60, goal: 120 },
    { id: 'coding', done: 210, goal: 210 },
  ];
  // Only the goals: the first slide already shows a day's logging, and together they did not fit the screen.
  return (
    <Box gap="sm">
      <Card gap="sm">
        {goals.map(({ id, done, goal }) => {
          const p = palette[DEMO[id].color];
          const met = done >= goal;
          return (
            <Box key={id} gap="s" paddingVertical="xs">
              <Box flexDirection="row" alignItems="center" gap="sm">
                <AssetIcon icon={DEMO[id].icon} color={DEMO[id].color} size={36} />
                <Box flex={1} gap="xs">
                  <Text variant="label" numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold' }}>
                    {name(id)}
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
              <PaceBar progress={done / goal} color={met ? colors.days : p.main} tint={met ? colors.daysSoft : p.tint} today={today} />
            </Box>
          );
        })}
        <PaceDays today={today} />
      </Card>
    </Box>
  );
}

/** Capital over the last twelve weeks, in hours: it only ever climbs. The last point is the total on the card. */
const CAPITAL_CURVE = [60, 84, 106, 128, 150, 172, 194, 216, 236, 256, 275, 292.5];

/** Slide 3: the capital built up, as a rising line and as a share per hobby. */
export function InvestmentPreview() {
  const { t, i18n } = useTranslation();
  const { palette } = useAppTheme();
  const { width } = useWindowDimensions();
  const name = useDemoName();
  const today = new Date();
  const rows: { id: DemoId; capital: number }[] = [
    { id: 'coding', capital: 212 * 60 },
    { id: 'guitar', capital: 62 * 60 + 30 },
    { id: 'running', capital: 18 * 60 },
  ];
  const total = rows.reduce((sum, r) => sum + r.capital, 0);
  const weeks = CAPITAL_CURVE.length;
  const labels: [string, string, string] = [shortDate(i18n.language, addDays(today, -7 * (weeks - 1))), shortDate(i18n.language, addDays(today, -7 * Math.floor((weeks - 1) / 2))), t('portfolio.today')];
  // One card, so the whole slide fits above the page dots: the total, its climb, then each hobby's share.
  return (
    <Card gap="sm">
      <Box gap="xs">
        <Text variant="label" color="muted">
          {t('tour.capital')}
        </Text>
        <Hours minutes={total} variant="display" />
      </Box>
      <CumulativeChart width={width - 48 - 40} height={150} current={CAPITAL_CURVE} previous={null} totalDays={weeks} labels={labels} accessibilityLabel={t('tour.capital')} />
      <Box gap="s">
        {rows.map((r) => {
          const p = palette[DEMO[r.id].color];
          return (
            <Box key={r.id} gap="s">
              <Box flexDirection="row" alignItems="center" gap="sm">
                <AssetIcon icon={DEMO[r.id].icon} color={DEMO[r.id].color} size={36} />
                <Text variant="label" numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter_600SemiBold' }}>
                  {name(r.id)}
                </Text>
                <Duration minutes={r.capital} size={15} highlight={p.main} />
              </Box>
              <Box height={8} borderRadius="pill" style={{ backgroundColor: p.tint }}>
                <Box height={8} borderRadius="pill" style={{ width: `${Math.round((r.capital / total) * 100)}%`, backgroundColor: p.main }} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Card>
  );
}
