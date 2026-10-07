import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { AssetIcon, Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { GoalScene } from '@/components/scenes';
import { ActionButton, Card, Duration, PrimaryButton, SectionHeader } from '@/components/ui';
import { addDays, dayKey, parseDay, startOfWeek, weekdayMonFirst } from '@/domain/dates';
import { isSessionDone, replanWeek, sessionsOn, type PlannedSession, type WeekPlan } from '@/domain/plan';
import type { LogEntry } from '@/domain/types';
import { useAssetName, weekdayName } from '@/lib/labels';
import { usePortfolio, useToday } from '@/lib/usePortfolio';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAppTheme } from '@/theme/theme';

export const DEFAULT_FREE = [60, 60, 60, 60, 60, 0, 0];

/** The plan for the week `today` is in, or on a Sunday, when this week is over, for the next one. */
export function useWeekPlan(): WeekPlan | undefined {
  const today = useToday();
  const weekFrom = dayKey(startOfWeek(today));
  const nextFrom = dayKey(addDays(startOfWeek(today), 7));
  const plans = usePortfolioStore((s) => s.plans);
  const withSessions = (from: string) => plans.find((p) => p.weekFrom === from && p.sessions.length > 0);
  return withSessions(weekFrom) ?? (weekdayMonFirst(today) === 6 ? withSessions(nextFrom) : undefined);
}

/** "45m", "2h" or "1.5h": short enough for a day column. */
function shortDuration(minutes: number, t: TFunction): string {
  if (minutes < 60) return `${minutes}${t('units.m')}`;
  const h = Math.round((minutes / 60) * 10) / 10;
  return `${h}${t('units.h')}`;
}

/** One planned session as a tile in its asset's color: tap to log it. */
function SessionRow({ session, done }: { session: PlannedSession; done: boolean }) {
  const { t } = useTranslation();
  const { colors, palette } = useAppTheme();
  const assetName = useAssetName();
  const asset = usePortfolioStore((s) => s.assets.find((a) => a.id === session.assetId));
  if (!asset) return null;
  const p = palette[asset.color];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${assetName(asset)}${done ? `, ${t('plan.done')}` : ''}`}
      onPress={() => router.push({ pathname: '/log', params: { assetId: asset.id } })}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, backgroundColor: done ? colors.track : p.tint, minHeight: 56, opacity: pressed ? 0.7 : 1 })}
    >
      <AssetIcon icon={asset.icon} color={asset.color} face={asset.face} size={36} />
      <Box flex={1} gap="xs">
        <Text variant="label" numberOfLines={1} color={done ? 'muted' : 'ink'} style={{ fontFamily: 'Inter_600SemiBold' }}>
          {assetName(asset)}
        </Text>
        <Duration minutes={session.minutes} size={13} quiet={done} highlight={p.main} />
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
    </Pressable>
  );
}

const WEEK = [0, 1, 2, 3, 4, 5, 6];

/** The week as seven days: its name, a circle (ticked when everything planned is done) and a dot per asset. */
function WeekStrip({ monday, plan, todayKey, logs, onPress }: { monday: Date; plan?: WeekPlan; todayKey: string; logs: LogEntry[]; onPress: () => void }) {
  const { t, i18n } = useTranslation();
  const { colors, palette } = useAppTheme();
  const assets = usePortfolioStore((s) => s.assets);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flexDirection: 'row', gap: 4 }}>
      {WEEK.map((i) => {
        const date = addDays(monday, i);
        const key = dayKey(date);
        const sessions = sessionsOn(plan, key);
        const isToday = key === todayKey;
        const past = key < todayKey;
        const allDone = sessions.length > 0 && sessions.every((s) => isSessionDone(s, logs));
        const ids = [...new Set(sessions.map((s) => s.assetId))].slice(0, 3);
        return (
          <Box key={key} flex={1} alignItems="center" gap="s" backgroundColor={isToday ? 'accentSoft' : undefined} style={{ paddingTop: 8, paddingBottom: 6, borderRadius: 14 }}>
            <Text variant="tiny" color={isToday ? 'accentInk' : 'muted'} numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold' }}>
              {new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(date)}
            </Text>
            <Box width={28} height={28} borderRadius="pill" alignItems="center" justifyContent="center" backgroundColor={isToday ? 'accent' : past && allDone ? 'daysSoft' : 'track'}>
              {past && allDone ? (
                <Glyph d={UI_PATHS.check} size={12} color={colors.days} strokeWidth={3} />
              ) : (
                <Text variant="tiny" color={isToday ? 'onAccent' : 'body'} style={{ fontFamily: 'Inter_600SemiBold', opacity: past ? 0.6 : 1 }}>
                  {date.getDate()}
                </Text>
              )}
            </Box>
            <Text variant="tiny" color={isToday ? 'accentInk' : 'muted'} numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold', opacity: allDone ? 0.5 : 1 }}>
              {sessions.length ? shortDuration(sessions.reduce((sum, s) => sum + s.minutes, 0), t) : ' '}
            </Text>
            <Box flexDirection="row" height={6} style={{ gap: 3 }}>
              {ids.map((id) => {
                const asset = assets.find((a) => a.id === id);
                const done = sessions.filter((s) => s.assetId === id).every((s) => isSessionDone(s, logs));
                return asset ? <Box key={id} width={6} height={6} borderRadius="pill" style={{ backgroundColor: palette[asset.color].main, opacity: done ? 0.35 : 1 }} /> : null;
              })}
            </Box>
          </Box>
        );
      })}
    </Pressable>
  );
}

/** On Today: the week as a strip with today's sessions under it, or an invitation to plan one. */
export function TodayPlan() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const today = useToday();
  const plan = useWeekPlan();
  const { assets, logs } = usePortfolio();
  const todayKey = dayKey(today);

  if (!plan) {
    if (!assets.some((a) => a.weeklyGoalMinutes)) {
      // The plan spreads weekly goals over the week, so goals come first.
      return (
        <Box backgroundColor="accentSoft" borderRadius="xl" borderWidth={1} borderColor="line" padding="m" gap="m">
          <Box gap="xs">
            <Text variant="heading" style={{ fontSize: 18 }}>
              {t('plan.goalsCta')}
            </Text>
            <Text variant="small">{t('plan.goalsCtaSub')}</Text>
          </Box>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/goals-edit')}
            style={({ pressed }) => ({ height: 50, borderRadius: 16, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.85 : 1 })}
          >
            <Text variant="bodyStrong" color="onAccent">
              {t('plan.setGoals')}
            </Text>
            <Glyph d={UI_PATHS.arrowRight} size={18} color={colors.onAccent} strokeWidth={2.2} />
          </Pressable>
        </Box>
      );
    }
    const monday = startOfWeek(today);
    return (
      <Box backgroundColor="accentSoft" borderRadius="xl" borderWidth={1} borderColor="line" padding="m" gap="m">
        <Box gap="xs">
          <Text variant="heading" style={{ fontSize: 18 }}>
            {t('plan.cta')}
          </Text>
          <Text variant="small">{t('plan.ctaSub')}</Text>
        </Box>
        <Box flexDirection="row" accessible={false} style={{ gap: 4 }}>
          {WEEK.map((i) => (
            <Box key={i} flex={1} alignItems="center" gap="s">
              <Text variant="tiny" color="muted" numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold' }}>
                {new Intl.DateTimeFormat(i18n.language, { weekday: 'short' }).format(addDays(monday, i))}
              </Text>
              <Box width={28} height={28} borderRadius="pill" style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.muted, opacity: 0.6 }} />
            </Box>
          ))}
        </Box>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/plan-week')}
          style={({ pressed }) => ({ height: 50, borderRadius: 16, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.85 : 1 })}
        >
          <Text variant="bodyStrong" color="onAccent">
            {t('plan.make')}
          </Text>
          <Glyph d={UI_PATHS.arrowRight} size={18} color={colors.onAccent} strokeWidth={2.2} />
        </Pressable>
      </Box>
    );
  }

  const toGoals = () => router.navigate('/(tabs)/goals');
  const sessions = sessionsOn(plan, todayKey);
  const planned = plan.sessions.reduce((sum, s) => sum + s.minutes, 0);
  const done = plan.sessions.filter((s) => isSessionDone(s, logs)).reduce((sum, s) => sum + s.minutes, 0);
  const todayLeft = sessions.filter((s) => !isSessionDone(s, logs)).reduce((sum, s) => sum + s.minutes, 0);
  return (
    <Card gap="sm">
      <Pressable accessibilityRole="button" accessibilityLabel={t('plan.weekTitle')} onPress={toGoals} style={{ gap: 10 }}>
        <Box flexDirection="row" alignItems="center" gap="s">
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            {t('plan.weekTitle')}
          </Text>
          <Box flexDirection="row" alignItems="baseline" gap="xs">
            <Duration minutes={done} size={13} />
            <Text variant="small">/</Text>
            <Duration minutes={planned} size={13} quiet />
          </Box>
          <Glyph d={UI_PATHS.chevronRight} size={16} color={colors.faint} strokeWidth={2} />
        </Box>
        <GoalScene scene="bar" progress={planned > 0 ? done / planned : 0} color={colors.accent} tint={colors.accentSoft} season={null} height={8} />
      </Pressable>
      <WeekStrip monday={parseDay(plan.weekFrom)} plan={plan} todayKey={todayKey} logs={logs} onPress={toGoals} />
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" style={{ marginTop: 4 }}>
        <Text variant="tiny" color="muted" style={{ fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {t('meta.today')}
        </Text>
        {todayLeft > 0 ? <Duration minutes={todayLeft} size={12} quiet /> : null}
      </Box>
      {sessions.length === 0 ? <Text variant="small">{t('plan.nothingToday')}</Text> : null}
      {sessions.map((s) => (
        <SessionRow key={s.id} session={s} done={isSessionDone(s, logs)} />
      ))}
    </Card>
  );
}

/** On Goals: the whole week's plan with a way to re-plan what is left, or the button to make one. */
export function WeekPlanCard() {
  const { t, i18n } = useTranslation();
  const today = useToday();
  const plan = useWeekPlan();
  const { assets, logs } = usePortfolio();
  const setPlan = usePortfolioStore((s) => s.setPlan);

  if (!plan || plan.sessions.length === 0) {
    return (
      <Card gap="sm">
        <SectionHeader title={t('plan.yourPlan')} />
        <Text variant="body">{t('plan.ctaSub')}</Text>
        <PrimaryButton label={t('plan.cta')} onPress={() => router.push('/plan-week')} />
      </Card>
    );
  }

  const monday = parseDay(plan.weekFrom);
  const replan = () => setPlan(replanWeek(plan, assets, logs, plan.free ?? DEFAULT_FREE, today));

  return (
    <Card gap="sm">
      <SectionHeader title={t('plan.yourPlan')} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const day = addDays(monday, i);
        const sessions = sessionsOn(plan, dayKey(day));
        if (sessions.length === 0) return null;
        return (
          <Box key={i} gap="s">
            <Box flexDirection="row" alignItems="center" justifyContent="space-between">
              <Text variant="small" style={{ fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' }}>
                {weekdayName(i18n.language, parseDay(dayKey(day)))}
              </Text>
              <Duration minutes={sessions.reduce((sum, s) => sum + s.minutes, 0)} size={12} quiet />
            </Box>
            {sessions.map((s) => (
              <SessionRow key={s.id} session={s} done={isSessionDone(s, logs)} />
            ))}
          </Box>
        );
      })}
      <Box flexDirection="row" gap="s" style={{ marginTop: 4 }}>
        {plan.weekFrom <= dayKey(today) ? (
          <ActionButton label={t('plan.replan')} icon={UI_PATHS.refresh} tone="soft" onPress={replan} />
        ) : null}
        <ActionButton label={t('plan.edit')} icon={UI_PATHS.pencil} tone="outline" onPress={() => router.push('/plan-week')} />
      </Box>
    </Card>
  );
}
