import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { AssetIcon, Glyph, UI_PATHS } from '@/components/icons';
import { PlanBoard } from '@/components/plan-board';
import { Box, Text } from '@/components/primitives';
import { GoalScene } from '@/components/scenes';
import { ActionButton, Card, Duration, PrimaryButton, RoundButton, SectionHeader } from '@/components/ui';
import { addDays, dayKey, parseDay, startOfWeek, weekdayMonFirst } from '@/domain/dates';
import { defaultSessionRange, isSessionDone, loggedFor, minutesLeft, dropDays, overFree, plansAround, replanWeek, resized, sessionsOn, type PlannedSession, type WeekPlan } from '@/domain/plan';
import { durationParts } from '@/domain/format';
import type { LogEntry } from '@/domain/types';
import { useAssetName, weekdayName } from '@/lib/labels';
import { usePortfolio, useToday } from '@/lib/usePortfolio';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAppTheme } from '@/theme/theme';

/** Asset ids in the portfolio's order, which is the order sessions are listed in within a day. */
function useAssetOrder(): string[] {
  const assets = usePortfolioStore((s) => s.assets);
  return assets.map((a) => a.id);
}

/** The plan to show: this week's, or on a Sunday with none, next week's. */
export function useWeekPlan(): WeekPlan | undefined {
  const today = useToday();
  const plans = usePortfolioStore((s) => s.plans);
  return plansAround(plans, today).shown;
}

/** Next week's plan, and whether it is time (Friday on) to offer making one. */
export function useNextWeek() {
  const today = useToday();
  const plans = usePortfolioStore((s) => s.plans);
  return plansAround(plans, today);
}

const planNext = () => router.push({ pathname: '/plan-week', params: { when: 'next' } });

/** "45m", "2h" or "1.5h": short enough for a day column. */
function shortDuration(minutes: number, t: TFunction): string {
  if (minutes < 60) return `${minutes}${t('units.m')}`;
  const h = Math.round((minutes / 60) * 10) / 10;
  return `${h}${t('units.h')}`;
}

/** One planned session as a tile in its asset's color: tap to log it, for its own day and what is left of it. */
export function SessionRow({ session, logs }: { session: PlannedSession; logs: LogEntry[] }) {
  const { t } = useTranslation();
  const { colors, palette } = useAppTheme();
  const assetName = useAssetName();
  const asset = usePortfolioStore((s) => s.assets.find((a) => a.id === session.assetId));
  if (!asset) return null;
  const p = palette[asset.color];
  const done = isSessionDone(session, logs);
  const left = minutesLeft(session, logs);
  const started = !done && left < session.minutes;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${assetName(asset)}${done ? `, ${t('plan.done')}` : ''}`}
      onPress={() => router.push({ pathname: '/log', params: done ? { assetId: asset.id, day: session.day } : { assetId: asset.id, day: session.day, minutes: String(left) } })}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, backgroundColor: done ? colors.track : p.tint, minHeight: 56, opacity: pressed ? 0.7 : 1 })}
    >
      <AssetIcon icon={asset.icon} color={asset.color} face={asset.face} size={36} />
      <Box flex={1} gap="xs">
        <Text variant="label" numberOfLines={1} color={done ? 'muted' : 'ink'} style={{ fontFamily: 'Inter_600SemiBold' }}>
          {assetName(asset)}
        </Text>
        <Box flexDirection="row" alignItems="baseline" gap="xs">
          <Duration minutes={started ? left : session.minutes} size={13} quiet={done} highlight={p.main} />
          {started ? (
            <Text variant="tiny" color="muted">
              {t('plan.left')}
            </Text>
          ) : null}
        </Box>
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

/** A session that can still change: drag it to another day by its grip, make it shorter or longer, or take it out. */
function EditableSession({ session, plan, handle }: { session: PlannedSession; plan: WeekPlan; handle: ReactNode }) {
  const { t } = useTranslation();
  const { palette } = useAppTheme();
  const assetName = useAssetName();
  const asset = usePortfolioStore((s) => s.assets.find((a) => a.id === session.assetId));
  const remove = usePortfolioStore((s) => s.removePlannedSession);
  const resize = usePortfolioStore((s) => s.resizePlannedSession);
  if (!asset) return null;
  const name = assetName(asset);
  const small = { minWidth: 32, width: 32, height: 32, borderRadius: 16, paddingHorizontal: 0 } as const;
  return (
    <Box flexDirection="row" alignItems="center" gap="s" style={{ minHeight: 48 }}>
      {handle}
      <AssetIcon icon={asset.icon} color={asset.color} face={asset.face} size={32} />
      <Box flex={1}>
        <Text variant="label" numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold' }}>
          {name}
        </Text>
        <Duration minutes={session.minutes} size={13} highlight={palette[asset.color].main} />
      </Box>
      <RoundButton accessibilityLabel={`${t('common.less')}: ${name}`} onPress={() => resize(plan.weekFrom, session.id, resized(session.minutes, -1))} style={small}>
        <Text variant="bodyStrong">−</Text>
      </RoundButton>
      <RoundButton accessibilityLabel={`${t('common.more')}: ${name}`} onPress={() => resize(plan.weekFrom, session.id, resized(session.minutes, 1))} style={small}>
        <Text variant="bodyStrong">+</Text>
      </RoundButton>
      <Pressable accessibilityRole="button" accessibilityLabel={`${t('plan.remove')}: ${name}`} onPress={() => remove(plan.weekFrom, session.id)} hitSlop={8} style={{ width: 32, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="heading">×</Text>
      </Pressable>
    </Box>
  );
}

/** Picks an asset to add to a day; assets already on that day are left out. */
function AddSession({ plan, day, onDone }: { plan: WeekPlan; day: string; onDone: () => void }) {
  const { t } = useTranslation();
  const assetName = useAssetName();
  const assets = usePortfolioStore((s) => s.assets);
  const add = usePortfolioStore((s) => s.addPlannedSession);
  const options = assets.filter((a) => !plan.sessions.some((s) => s.day === day && s.assetId === a.id));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} accessibilityLabel={t('plan.add')}>
      {options.map((a) => (
        <Pressable
          key={a.id}
          accessibilityRole="button"
          accessibilityLabel={assetName(a)}
          onPress={() => {
            add(plan.weekFrom, { assetId: a.id, day, minutes: (a.sessionMinutes ?? defaultSessionRange(a)).min });
            onDone();
          }}
          style={({ pressed }) => ({ alignItems: 'center', gap: 4, width: 72, opacity: pressed ? 0.7 : 1 })}
        >
          <AssetIcon icon={a.icon} color={a.color} face={a.face} size={40} />
          <Text variant="tiny" numberOfLines={1} color="muted">
            {assetName(a)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const WEEK = [0, 1, 2, 3, 4, 5, 6];

/** The week as seven days: its name, a circle (ticked when everything planned is done) and a dot per asset. */
function WeekStrip({ monday, plan, todayKey, logs, onPress }: { monday: Date; plan?: WeekPlan; todayKey: string; logs: LogEntry[]; onPress: () => void }) {
  const { t, i18n } = useTranslation();
  const { colors, palette } = useAppTheme();
  const assets = usePortfolioStore((s) => s.assets);
  const order = useAssetOrder();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flexDirection: 'row', gap: 4 }}>
      {WEEK.map((i) => {
        const date = addDays(monday, i);
        const key = dayKey(date);
        const sessions = sessionsOn(plan, key, order);
        const isToday = key === todayKey;
        const past = key < todayKey;
        const allDone = sessions.length > 0 && sessions.every((s) => isSessionDone(s, logs));
        const ids = [...new Set(sessions.map((s) => s.assetId))];
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
            <Box flexDirection="row" height={5} style={{ gap: 2 }}>
              {ids.map((id) => {
                const asset = assets.find((a) => a.id === id);
                const done = sessions.filter((s) => s.assetId === id).every((s) => isSessionDone(s, logs));
                return asset ? <Box key={id} width={5} height={5} borderRadius="pill" style={{ backgroundColor: palette[asset.color].main, opacity: done ? 0.35 : 1 }} /> : null;
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
  const { next, askNext } = useNextWeek();
  const order = useAssetOrder();
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
  const sessions = sessionsOn(plan, todayKey, order);
  const planned = plan.sessions.reduce((sum, s) => sum + s.minutes, 0);
  const done = plan.sessions.reduce((sum, s) => sum + Math.min(s.minutes, loggedFor(s, logs)), 0);
  const todayLeft = sessions.reduce((sum, s) => sum + minutesLeft(s, logs), 0);
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
        <SessionRow key={s.id} session={s} logs={logs} />
      ))}
      {askNext ? (
        <Box flexDirection="row" style={{ marginTop: 4 }}>
          <ActionButton label={next ? t('plan.editNext') : t('plan.planNext')} icon={next ? UI_PATHS.pencil : UI_PATHS.arrowRight} tone={next ? 'outline' : 'soft'} onPress={planNext} />
        </Box>
      ) : null}
    </Card>
  );
}

/** On Goals: the whole week's plan, which can be changed in place, or the button to make one. */
export function WeekPlanCard() {
  const { t, i18n } = useTranslation();
  const today = useToday();
  const plan = useWeekPlan();
  const { next } = useNextWeek();
  const order = useAssetOrder();
  const { assets, logs } = usePortfolio();
  const setPlan = usePortfolioStore((s) => s.setPlan);
  const move = usePortfolioStore((s) => s.movePlannedSession);
  const assetName = useAssetName();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const empty = !plan || plan.sessions.length === 0;
  // Removing the last session ends editing, so the next plan does not open in edit mode.
  const [wasEmpty, setWasEmpty] = useState(empty);
  if (empty !== wasEmpty) {
    setWasEmpty(empty);
    if (empty) {
      setEditing(false);
      setAdding(null);
    }
  }

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
  const todayKey = dayKey(today);
  // Days before this can no longer change; a week that has not started can change from its Monday.
  const editFrom = plan.weekFrom > todayKey ? plan.weekFrom : todayKey;
  const replan = () => setPlan(replanWeek(plan, assets, logs, plan.free, today));
  const assetNameById = (id: string) => {
    const a = assets.find((x) => x.id === id);
    return a ? assetName(a) : '';
  };
  const open = new Set(dropDays(plan.weekFrom, editFrom));
  const days = [0, 1, 2, 3, 4, 5, 6]
    .map((i) => {
      const key = dayKey(addDays(monday, i));
      return { key, sessions: sessionsOn(plan, key, order), drop: editing && open.has(key) };
    })
    .filter((d) => d.sessions.length > 0 || d.drop);

  return (
    <Card gap="sm">
      <SectionHeader title={t('plan.yourPlan')} />
      <PlanBoard
        plain
        days={days}
        canDrag={(s) => editing && s.day >= editFrom && !isSessionDone(s, logs)}
        onMove={(id, day) => move(plan.weekFrom, id, day)}
        gripLabel={(s) => assetNameById(s.assetId)}
        earlierLabel={t('plan.earlier')}
        laterLabel={t('plan.later')}
        header={(d) => {
          const day = parseDay(d.key);
          const over = editing && d.drop ? overFree(plan.sessions, d.key, plan.free) : 0;
          const free = plan.free?.[weekdayMonFirst(day)] ?? 0;
          return (
            <>
              <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                <Text variant="small" style={{ fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' }}>
                  {weekdayName(i18n.language, day)}
                </Text>
                <Box flexDirection="row" alignItems="center" gap="s">
                  <Duration minutes={d.sessions.reduce((sum, s) => sum + s.minutes, 0)} size={12} quiet />
                  {editing && d.drop ? (
                    <RoundButton accessibilityLabel={`${t('plan.add')}: ${weekdayName(i18n.language, day)}`} onPress={() => setAdding(adding === d.key ? null : d.key)} style={{ minWidth: 32, width: 32, height: 32, borderRadius: 16, paddingHorizontal: 0 }}>
                      <Text variant="bodyStrong">{adding === d.key ? '×' : '+'}</Text>
                    </RoundButton>
                  ) : null}
                </Box>
              </Box>
              {over > 0 ? <Text variant="small">{free === 0 ? t('plan.overOff') : t('plan.over', { time: timeText(free, t) })}</Text> : null}
            </>
          );
        }}
        row={(s, handle) => (editing && s.day >= editFrom && !isSessionDone(s, logs) ? <EditableSession session={s} plan={plan} handle={handle} /> : <SessionRow session={s} logs={logs} />)}
        footer={(d) => (editing && d.drop && adding === d.key ? <AddSession plan={plan} day={d.key} onDone={() => setAdding(null)} /> : null)}
      />
      <ShortNote short={plan.short} />
      {editing ? (
        <Box flexDirection="row" gap="s" style={{ marginTop: 4 }}>
          <ActionButton
            label={t('plan.doneEditing')}
            icon={UI_PATHS.check}
            tone="soft"
            onPress={() => {
              setEditing(false);
              setAdding(null);
            }}
          />
        </Box>
      ) : (
        <>
          <Box flexDirection="row" gap="s" style={{ marginTop: 4 }}>
            <ActionButton label={t('plan.edit')} icon={UI_PATHS.pencil} tone="outline" onPress={() => setEditing(true)} />
            {plan.weekFrom <= todayKey ? <ActionButton label={t('plan.replan')} icon={UI_PATHS.refresh} tone="soft" onPress={replan} /> : null}
          </Box>
          <Box flexDirection="row" gap="s">
            <ActionButton label={t('plan.startOver')} icon={UI_PATHS.refresh} tone="outline" onPress={() => router.push('/plan-week')} />
            {plan !== next ? <ActionButton label={next ? t('plan.editNext') : t('plan.planNext')} icon={next ? UI_PATHS.pencil : UI_PATHS.arrowRight} tone="outline" onPress={planNext} /> : null}
          </Box>
        </>
      )}
    </Card>
  );
}

/** "1 h 30 m" for a free-time note. */
function timeText(minutes: number, t: TFunction): string {
  return durationParts(minutes)
    .map((p) => `${p.value} ${t(`units.${p.unit}`)}`)
    .join(' ');
}

/** What did not fit when the plan was made, said plainly and without blame. */
export function ShortNote({ short }: { short?: { assetId: string; minutes: number }[] }) {
  const { t } = useTranslation();
  const assetName = useAssetName();
  const assets = usePortfolioStore((s) => s.assets);
  const items = (short ?? []).flatMap((x) => {
    const a = assets.find((y) => y.id === x.assetId);
    return a ? [{ name: assetName(a), minutes: x.minutes }] : [];
  });
  if (items.length === 0) return null;
  return (
    <Box gap="xs" style={{ marginTop: 4 }}>
      <Text variant="small" style={{ fontFamily: 'Inter_600SemiBold' }}>
        {t('plan.shortTitle')}
      </Text>
      {items.map((x) => (
        <Text key={x.name} variant="small">
          {t('plan.short', { name: x.name, time: timeText(x.minutes, t) })}
        </Text>
      ))}
    </Box>
  );
}
