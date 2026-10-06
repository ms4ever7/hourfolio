import { useTranslation } from 'react-i18next';
import { AssetIcon, Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { GoalScene } from '@/components/scenes';
import { Card, Duration, Hours } from '@/components/ui';
import { addDays, startOfWeek } from '@/domain/dates';
import type { IconKey, PaletteKey } from '@/domain/types';
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
  const goals: { id: DemoId; done: number; goal: number; scene: 'tree' | 'dog' | 'rocket' }[] = [
    { id: 'guitar', done: 150, goal: 180, scene: 'tree' },
    { id: 'running', done: 60, goal: 120, scene: 'dog' },
    { id: 'coding', done: 210, goal: 210, scene: 'rocket' },
  ];
  return (
    <Box gap="sm">
      <Card gap="s">
        <Text variant="label" color="muted">
          {t('today.label')}
        </Text>
        <Duration minutes={105} size={32} />
        {(['guitar', 'running'] as const).map((id) => (
          <Box key={id} flexDirection="row" alignItems="center" gap="sm">
            <AssetIcon icon={DEMO[id].icon} color={DEMO[id].color} size={28} />
            <Text variant="label" numberOfLines={1} style={{ flex: 1 }}>
              {name(id)}
            </Text>
            <Duration minutes={id === 'guitar' ? 45 : 60} size={14} prefix="+" highlight={palette[DEMO[id].color].main} />
          </Box>
        ))}
      </Card>
      <Card gap="sm">
        {goals.map(({ id, done, goal, scene }) => {
          const p = palette[DEMO[id].color];
          return (
            <Box key={id} gap="xs">
              <Box flexDirection="row" alignItems="center" gap="s">
                <Text variant="label" numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter_600SemiBold' }}>
                  {name(id)}
                </Text>
                <Duration minutes={done} size={13} highlight={p.main} />
                <Text variant="small">/</Text>
                <Duration minutes={goal} size={13} quiet />
              </Box>
              <GoalScene scene={scene} progress={done / goal} color={done >= goal ? colors.days : p.main} tint={done >= goal ? colors.daysSoft : p.tint} season={null} height={36} />
            </Box>
          );
        })}
      </Card>
    </Box>
  );
}

/** Slide 3: capital and the next milestone for each hobby. */
export function InvestmentPreview() {
  const { t } = useTranslation();
  const { palette } = useAppTheme();
  const name = useDemoName();
  const rows: { id: DemoId; capital: number; next: number; weeks: number; before?: number }[] = [
    { id: 'guitar', capital: 62 * 60 + 30, next: 100, weeks: 9, before: 40 },
    { id: 'coding', capital: 212 * 60, next: 250, weeks: 5 },
    { id: 'running', capital: 18 * 60, next: 25, weeks: 3 },
  ];
  return (
    <Box gap="sm">
      <Card gap="xs">
        <Text variant="label" color="muted">
          {t('tour.capital')}
        </Text>
        <Hours minutes={rows.reduce((s, r) => s + r.capital, 0)} variant="display" />
      </Card>
      {rows.map((r) => {
        const p = palette[DEMO[r.id].color];
        const prev = r.next === 100 ? 50 : r.next === 250 ? 200 : 10;
        const progress = (r.capital / 60 - prev) / (r.next - prev);
        return (
          <Box key={r.id} backgroundColor="card" borderRadius="xl" padding="m" gap="s">
            <Box flexDirection="row" alignItems="center" gap="sm">
              <AssetIcon icon={DEMO[r.id].icon} color={DEMO[r.id].color} size={36} />
              <Text variant="label" numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter_600SemiBold' }}>
                {name(r.id)}
              </Text>
              <Duration minutes={r.capital} size={15} highlight={p.main} />
              <Text variant="small">/</Text>
              <Hours minutes={r.next * 60} variant="bodyStrong" />
            </Box>
            <GoalScene scene="bar" progress={progress} color={p.main} tint={p.tint} season={null} />
            <Box flexDirection="row" justifyContent="space-between" gap="s">
              <Text variant="small" numberOfLines={1} style={{ flexShrink: 1 }}>
                {r.before ? t('goals.milestoneBefore', { hours: r.before }) : ' '}
              </Text>
              <Text variant="small">{t('asset.milestoneEta', { count: r.weeks })}</Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
