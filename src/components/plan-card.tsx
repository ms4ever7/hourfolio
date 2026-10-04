import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { AssetIcon, Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { Card, Duration, PrimaryButton, SectionHeader, TextButton } from '@/components/ui';
import { addDays, dayKey, parseDay, startOfWeek, weekdayMonFirst } from '@/domain/dates';
import { isSessionDone, replanWeek, sessionsOn, type PlannedSession, type WeekPlan } from '@/domain/plan';
import type { LogEntry } from '@/domain/types';
import { useAssetName, weekdayName } from '@/lib/labels';
import { usePortfolio, useToday } from '@/lib/usePortfolio';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAppTheme } from '@/theme/theme';

const DEFAULT_FREE = [60, 60, 60, 60, 60, 0, 0];

/** The plan for the week `today` is in, or on a Sunday, when this week is over, for the next one. */
export function useWeekPlan(): WeekPlan | undefined {
  const today = useToday();
  const weekFrom = dayKey(startOfWeek(today));
  const nextFrom = dayKey(addDays(startOfWeek(today), 7));
  const plans = usePortfolioStore((s) => s.plans);
  const withSessions = (from: string) => plans.find((p) => p.weekFrom === from && p.sessions.length > 0);
  return withSessions(weekFrom) ?? (weekdayMonFirst(today) === 6 ? withSessions(nextFrom) : undefined);
}

function SessionRow({ session, done }: { session: PlannedSession; done: boolean }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const assetName = useAssetName();
  const asset = usePortfolioStore((s) => s.assets.find((a) => a.id === session.assetId));
  if (!asset) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${assetName(asset)}${done ? `, ${t('plan.done')}` : ''}`}
      onPress={() => router.push({ pathname: '/log', params: { assetId: asset.id } })}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4, minHeight: 44, opacity: pressed ? 0.7 : 1 })}
    >
      <AssetIcon icon={asset.icon} color={asset.color} face={asset.face} size={32} />
      <Text variant="label" numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter_600SemiBold' }}>
        {assetName(asset)}
      </Text>
      <Duration minutes={session.minutes} size={13} quiet={done} />
      {done ? (
        <Box width={20} height={20} borderRadius="pill" backgroundColor="daysSoft" alignItems="center" justifyContent="center">
          <Glyph d={UI_PATHS.check} size={12} color={colors.days} strokeWidth={3} />
        </Box>
      ) : (
        <Box backgroundColor="accentSoft" borderRadius="pill" paddingHorizontal="sm" style={{ paddingVertical: 6 }}>
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
  const { i18n } = useTranslation();
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
    if (!assets.some((a) => a.weeklyGoalMinutes)) return null;
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
  return (
    <Card gap="sm">
      <Pressable accessibilityRole="button" accessibilityLabel={t('plan.weekTitle')} onPress={toGoals} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text variant="bodyStrong" style={{ flex: 1 }}>
          {t('plan.weekTitle')}
        </Text>
        <Glyph d={UI_PATHS.chevronRight} size={16} color={colors.faint} strokeWidth={2} />
      </Pressable>
      <WeekStrip monday={parseDay(plan.weekFrom)} plan={plan} todayKey={todayKey} logs={logs} onPress={toGoals} />
      <Box height={1} backgroundColor="line" />
      <Text variant="tiny" color="muted" style={{ fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {t('meta.today')}
      </Text>
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
          <Box key={i} gap="xs">
            <Text variant="small" style={{ fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' }}>
              {weekdayName(i18n.language, parseDay(dayKey(day)))}
            </Text>
            {sessions.map((s) => (
              <SessionRow key={s.id} session={s} done={isSessionDone(s, logs)} />
            ))}
          </Box>
        );
      })}
      {plan.weekFrom <= dayKey(today) ? <TextButton label={t('plan.replan')} onPress={replan} /> : null}
      <TextButton label={t('plan.edit')} onPress={() => router.push('/plan-week')} />
    </Card>
  );
}
