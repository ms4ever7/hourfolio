import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssetIcon } from '@/components/icons';
import { PlanBoard } from '@/components/plan-board';
import { ShortNote } from '@/components/plan-card';
import { Box, Text } from '@/components/primitives';
import { Duration, Group, PrimaryButton, RoundButton, Segmented, SwitchRow, TextButton, footerPad } from '@/components/ui';
import { addDays, dayKey, parseDay, startOfWeek, weekdayMonFirst } from '@/domain/dates';
import { DEFAULT_FREE, autoPlan, keepDone, mergeMove, overFree, planGoals, planWeek, previousSetup, resized, type PlanResult } from '@/domain/plan';
import { RECOVERY_ID } from '@/domain/types';
import { durationParts } from '@/domain/format';
import { useAssetName, weekdayName } from '@/lib/labels';
import { useToday } from '@/lib/usePortfolio';
import { usePortfolioStore } from '@/store/portfolio-store';

const STEP = 30;
const MAX_FREE = 8 * 60;
const MAX_REST = 5 * 60;
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKEND_FREE = 120;
const small = { minWidth: 32, width: 32, height: 32, borderRadius: 16, paddingHorizontal: 0 } as const;

type When = 'this' | 'next';

function Stepper({ value, onChange, label, off }: { value: number; onChange: (minutes: number) => void; label: string; off: string }) {
  const { t } = useTranslation();
  return (
    <Box flexDirection="row" alignItems="center" gap="sm">
      <RoundButton accessibilityLabel={`${t('common.less')}: ${label}`} onPress={() => onChange(value - STEP)} style={{ paddingHorizontal: 0 }}>
        <Text variant="heading">−</Text>
      </RoundButton>
      <Box width={76} alignItems="center">
        {value === 0 ? <Text variant="small">{off}</Text> : <Duration minutes={value} size={14} />}
      </Box>
      <RoundButton accessibilityLabel={`${t('common.more')}: ${label}`} onPress={() => onChange(value + STEP)} style={{ paddingHorizontal: 0 }}>
        <Text variant="heading">+</Text>
      </RoundButton>
    </Box>
  );
}

/** One screen: the plan is proposed straight away, and a session is dragged to another day to change it. How much time is free is an option, not a question. */
export default function PlanWeek() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const assetName = useAssetName();
  const today = useToday();
  const assets = usePortfolioStore((s) => s.assets);
  const logs = usePortfolioStore((s) => s.logs);
  const setPlan = usePortfolioStore((s) => s.setPlan);

  const params = useLocalSearchParams<{ when?: string }>();
  const mondayOf = (w: When) => addDays(startOfWeek(today), w === 'next' ? 7 : 0);
  const recovery = assets.find((a) => a.id === RECOVERY_ID);
  const recoveryGoal = recovery?.weeklyGoalMinutes ?? 0;
  const restFor = (w: When) => previousSetup(usePortfolioStore.getState().plans, dayKey(mondayOf(w))).rest ?? recoveryGoal;
  // On Sunday there is nothing left of this week to plan.
  const first: When = params.when === 'next' || (params.when !== 'this' && weekdayMonFirst(today) === 6) ? 'next' : 'this';
  const hasGoals = assets.some((a) => a.id !== RECOVERY_ID && a.weeklyGoalMinutes);

  /** Sessions the week already holds and are done: they stay, and use up their day. */
  const keptFor = (w: When) => {
    const weekFrom = dayKey(mondayOf(w));
    return keepDone(usePortfolioStore.getState().plans.find((p) => p.weekFrom === weekFrom)?.sessions ?? [], w === 'this' ? dayKey(today) : undefined, logs);
  };

  /** The proposal: automatic unless the user set their own free time. */
  const propose = (w: When, restMinutes: number, custom: number[] | null): PlanResult & { free: number[] } => {
    const monday = mondayOf(w);
    const weekFrom = dayKey(monday);
    const fromDay = w === 'this' ? dayKey(today) : undefined;
    const goals = planGoals(assets, logs, w === 'this' ? today : monday, recovery ? restMinutes : 0);
    const kept = keptFor(w);
    if (!custom) return autoPlan({ weekFrom, goals, fromDay, kept });
    const free = custom.map((m, i) => (fromDay && dayKey(addDays(monday, i)) < fromDay ? 0 : m));
    return { ...planWeek({ weekFrom, goals, free, fromDay, kept }), free: custom };
  };

  const [when, setWhen] = useState<When>(first);
  const [rest, setRest] = useState(() => restFor(first));
  const [custom, setCustom] = useState<number[] | null>(null);
  const [result, setResult] = useState(() => (hasGoals ? propose(first, restFor(first), null) : null));
  const [options, setOptions] = useState(false);

  const monday = mondayOf(when);
  const weekFrom = dayKey(monday);
  const fromDay = when === 'this' ? dayKey(today) : undefined;
  const isPast = (i: number) => fromDay !== undefined && dayKey(addDays(monday, i)) < fromDay;
  const free = custom ?? result?.free ?? DEFAULT_FREE;
  const weekendsFree = free[5] > 0 || free[6] > 0;

  const regenerate = (w: When, restMinutes: number, next: number[] | null) => {
    setWhen(w);
    setRest(restMinutes);
    setCustom(next);
    setEdited(false);
    setResult(propose(w, restMinutes, next));
  };
  // Rebuilding the proposal throws away what was moved, resized or removed, so ask first.
  const [edited, setEdited] = useState(false);
  const guard = (go: () => void) => {
    if (!edited) return go();
    Alert.alert(t('plan.discardTitle'), t('plan.discardSub'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('plan.discardGo'), onPress: go },
    ]);
  };
  const chooseWhen = (w: When) => guard(() => regenerate(w, restFor(w), null));
  const setDay = (i: number, minutes: number) => guard(() => regenerate(when, rest, free.map((m, j) => (j === i ? Math.min(MAX_FREE, Math.max(0, minutes)) : m))));
  const setWeekends = (on: boolean) => guard(() => regenerate(when, rest, free.map((m, i) => (i >= 5 ? (on ? WEEKEND_FREE : 0) : m))));
  const setRestMinutes = (minutes: number) => guard(() => regenerate(when, Math.min(MAX_REST, Math.max(0, minutes)), custom));

  const move = (id: string, day: string) => {
    setEdited(true);
    setResult((r) => r && { ...r, sessions: mergeMove(r.sessions, id, day) });
  };
  const resize = (id: string, direction: 1 | -1) => {
    setEdited(true);
    setResult((r) => r && { ...r, sessions: r.sessions.map((x) => (x.id === id ? { ...x, minutes: resized(x.minutes, direction) } : x)) });
  };
  const remove = (id: string) => {
    setEdited(true);
    setResult((r) => r && { ...r, sessions: r.sessions.filter((x) => x.id !== id) });
  };

  const save = () => {
    if (!result) return;
    setPlan({ weekFrom, sessions: [...keptFor(when), ...result.sessions], free: custom ?? undefined, rest, short: result.shortBy });
    router.back();
  };

  const time = (minutes: number) =>
    durationParts(minutes)
      .map((p) => `${p.value} ${t(`units.${p.unit}`)}`)
      .join(' ');

  const days = WEEKDAYS.filter((i) => !isPast(i)).map((i) => {
    const key = dayKey(addDays(monday, i));
    return { key, sessions: result?.sessions.filter((s) => s.day === key) ?? [], drop: true };
  });
  const nameOf = (id: string) => {
    const a = assets.find((x) => x.id === id);
    return a ? assetName(a) : '';
  };

  return (
    <Box flex={1} backgroundColor="ground">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingTop: 28, gap: 16 }}>
        <Text variant="title" accessibilityRole="header">
          {t('plan.result')}
        </Text>

        {!hasGoals || !result ? (
          <>
            <Text variant="body">{t('plan.noGoals')}</Text>
            <TextButton label={t('plan.setGoals')} onPress={() => router.replace('/goals-edit')} />
          </>
        ) : (
          <>
            <Text variant="body">{result.sessions.length === 0 ? t('plan.empty') : t('plan.resultSub')}</Text>
            <Segmented
              label={t('plan.title')}
              value={when}
              onChange={chooseWhen}
              options={[
                { value: 'this', label: t('plan.thisWeek') },
                { value: 'next', label: t('plan.nextWeek') },
              ]}
            />
            <PlanBoard
              days={days}
              canDrag={() => true}
              onMove={move}
              gripLabel={(s) => nameOf(s.assetId)}
              earlierLabel={t('plan.earlier')}
              laterLabel={t('plan.later')}
              header={(d) => {
                const i = weekdayMonFirst(parseDay(d.key));
                const over = custom ? overFree(result.sessions, d.key, free) : 0;
                return (
                  <>
                    <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                      <Text variant="bodyStrong" style={{ textTransform: 'capitalize' }}>
                        {weekdayName(i18n.language, parseDay(d.key))}
                      </Text>
                      {d.sessions.length > 0 ? <Duration minutes={d.sessions.reduce((n, s) => n + s.minutes, 0)} size={12} quiet /> : null}
                    </Box>
                    {over > 0 ? <Text variant="small">{free[i] === 0 ? t('plan.overOff') : t('plan.over', { time: time(free[i]) })}</Text> : null}
                    {d.sessions.length === 0 ? <Text variant="small">{t('plan.nothing')}</Text> : null}
                  </>
                );
              }}
              row={(s, handle) => {
                const asset = assets.find((a) => a.id === s.assetId);
                if (!asset) return null;
                return (
                  <Box flexDirection="row" alignItems="center" gap="sm">
                    {handle}
                    <AssetIcon icon={asset.icon} color={asset.color} face={asset.face} size={32} />
                    <Box flex={1}>
                      <Text variant="label" numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold' }}>
                        {assetName(asset)}
                      </Text>
                      <Duration minutes={s.minutes} size={13} />
                    </Box>
                    <RoundButton accessibilityLabel={`${t('common.less')}: ${assetName(asset)}`} onPress={() => resize(s.id, -1)} style={small}>
                      <Text variant="bodyStrong">−</Text>
                    </RoundButton>
                    <RoundButton accessibilityLabel={`${t('common.more')}: ${assetName(asset)}`} onPress={() => resize(s.id, 1)} style={small}>
                      <Text variant="bodyStrong">+</Text>
                    </RoundButton>
                    <Pressable accessibilityRole="button" accessibilityLabel={`${t('plan.remove')}: ${assetName(asset)}`} onPress={() => remove(s.id)} hitSlop={8} style={{ width: 32, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                      <Text variant="heading">×</Text>
                    </Pressable>
                  </Box>
                );
              }}
            />
            <ShortNote short={result.shortBy} />

            <TextButton label={options ? t('plan.hideOptions') : t('plan.options')} onPress={() => setOptions((o) => !o)} />
            {options ? (
              <>
                <Text variant="small">{t('plan.freeSub')}</Text>
                <Group>
                  <SwitchRow title={t('plan.weekends')} sub={t('plan.weekendsSub')} value={weekendsFree} onChange={setWeekends} last />
                </Group>
                <Box backgroundColor="card" borderRadius="xl" paddingVertical="xs">
                  {WEEKDAYS.map((i) => {
                    const name = weekdayName(i18n.language, addDays(monday, i));
                    return (
                      <Box key={i} flexDirection="row" alignItems="center" paddingVertical="sm" paddingHorizontal="m" borderBottomWidth={i === 6 ? 0 : 1} borderColor="line" style={{ opacity: isPast(i) ? 0.4 : 1 }}>
                        <Text variant="label" style={{ flex: 1, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' }}>
                          {name}
                        </Text>
                        {isPast(i) ? null : <Stepper value={free[i]} label={name} off={t('setup.goalOff')} onChange={(m) => setDay(i, m)} />}
                      </Box>
                    );
                  })}
                </Box>
                {recovery ? (
                  <Box backgroundColor="card" borderRadius="xl" padding="m" gap="sm">
                    <Box flexDirection="row" alignItems="center" gap="sm">
                      <AssetIcon icon={recovery.icon} color={recovery.color} face={recovery.face} size={36} />
                      <Box flex={1}>
                        <Text variant="bodyStrong">{t('plan.recovery')}</Text>
                        <Text variant="small">{t('plan.recoverySub')}</Text>
                      </Box>
                    </Box>
                    <Box alignItems="flex-end">
                      <Stepper value={rest} label={t('plan.recovery')} off={t('setup.goalOff')} onChange={setRestMinutes} />
                    </Box>
                  </Box>
                ) : null}
                {custom ? <TextButton label={t('plan.autoAgain')} onPress={() => regenerate(when, rest, null)} /> : null}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
      {hasGoals && result ? (
        <Box paddingHorizontal="l" style={{ paddingBottom: footerPad(insets.bottom), paddingTop: 8 }}>
          <PrimaryButton label={t('plan.save')} onPress={save} disabled={result.sessions.length === 0} />
        </Box>
      ) : null}
    </Box>
  );
}
