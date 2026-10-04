import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssetIcon } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { Duration, Group, PrimaryButton, RoundButton, Segmented, SwitchRow, TextButton } from '@/components/ui';
import { addDays, dayKey, parseDay, startOfWeek } from '@/domain/dates';
import { goalsFromAssets, planWeek, type PlannedSession, type PlanResult } from '@/domain/plan';
import { RECOVERY_ID } from '@/domain/types';
import { durationParts } from '@/domain/format';
import { useAssetName, weekdayName } from '@/lib/labels';
import { useToday } from '@/lib/usePortfolio';
import { usePortfolioStore } from '@/store/portfolio-store';

const STEP = 30;
const MAX_FREE = 8 * 60;
const MAX_REST = 5 * 60;
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const DEFAULT_FREE = [60, 60, 60, 60, 60, 0, 0];
const WEEKEND_FREE = 120;

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

/** Two steps: when you are free, then the plan the week gets, which can still be adjusted before saving. */
export default function PlanWeek() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const assetName = useAssetName();
  const today = useToday();
  const assets = usePortfolioStore((s) => s.assets);
  const logs = usePortfolioStore((s) => s.logs);
  const setPlan = usePortfolioStore((s) => s.setPlan);

  const [when, setWhen] = useState<When>('this');
  const [free, setFree] = useState(DEFAULT_FREE);
  const [rest, setRest] = useState(0);
  const [result, setResult] = useState<PlanResult | null>(null);

  const monday = useMemo(() => addDays(startOfWeek(today), when === 'next' ? 7 : 0), [today, when]);
  const weekFrom = dayKey(monday);
  const fromDay = when === 'this' ? dayKey(today) : undefined;
  const isPast = (i: number) => fromDay !== undefined && dayKey(addDays(monday, i)) < fromDay;
  const recovery = assets.find((a) => a.id === RECOVERY_ID);
  const hasGoals = assets.some((a) => a.id !== RECOVERY_ID && a.weeklyGoalMinutes);
  const weekendsFree = free[5] > 0 || free[6] > 0;

  const setDay = (i: number, minutes: number) => setFree((f) => f.map((m, j) => (j === i ? Math.min(MAX_FREE, Math.max(0, minutes)) : m)));
  const setWeekends = (on: boolean) => setFree((f) => f.map((m, i) => (i >= 5 ? (on ? WEEKEND_FREE : 0) : m)));

  const make = () => {
    const base = when === 'this' ? today : monday;
    const goals = goalsFromAssets(
      assets.filter((a) => a.id !== RECOVERY_ID),
      logs,
      base,
    );
    if (recovery && rest > 0) goals.push({ assetId: RECOVERY_ID, minutes: rest, session: { min: 20, max: 60 }, days: WEEKDAYS });
    setResult(planWeek({ weekFrom, goals, free: free.map((m, i) => (isPast(i) ? 0 : m)), fromDay }));
  };

  const move = (s: PlannedSession, by: number) => {
    const day = dayKey(addDays(parseDay(s.day), by));
    if (day < weekFrom || day > dayKey(addDays(monday, 6)) || (fromDay && day < fromDay)) return;
    setResult((r) => r && { ...r, sessions: r.sessions.map((x) => (x.id === s.id ? { ...x, day } : x)) });
  };
  const remove = (s: PlannedSession) => setResult((r) => r && { ...r, sessions: r.sessions.filter((x) => x.id !== s.id) });

  const save = () => {
    if (!result) return;
    setPlan({ weekFrom, sessions: result.sessions, free });
    router.back();
  };

  const time = (minutes: number) =>
    durationParts(minutes)
      .map((p) => `${p.value} ${t(`units.${p.unit}`)}`)
      .join(' ');

  return (
    <Box flex={1} backgroundColor="ground">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingTop: 28, gap: 16 }}>
        <Text variant="title" accessibilityRole="header">
          {result ? t('plan.result') : t('plan.free')}
        </Text>

        {!hasGoals ? (
          <>
            <Text variant="body">{t('plan.noGoals')}</Text>
            <TextButton label={t('plan.setGoals')} onPress={() => router.replace('/goals-edit')} />
          </>
        ) : result === null ? (
          <>
            <Text variant="body">{t('plan.freeSub')}</Text>
            <Segmented
              label={t('plan.title')}
              value={when}
              onChange={setWhen}
              options={[
                { value: 'this', label: t('plan.thisWeek') },
                { value: 'next', label: t('plan.nextWeek') },
              ]}
            />
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
                  <Stepper value={rest} label={t('plan.recovery')} off={t('setup.goalOff')} onChange={(m) => setRest(Math.min(MAX_REST, Math.max(0, m)))} />
                </Box>
              </Box>
            ) : null}
          </>
        ) : (
          <>
            <Text variant="body">{t('plan.resultSub')}</Text>
            {WEEKDAYS.map((i) => {
              const day = addDays(monday, i);
              const key = dayKey(day);
              const sessions = result.sessions.filter((s) => s.day === key);
              if (isPast(i)) return null;
              return (
                <Box key={key} backgroundColor="card" borderRadius="xl" padding="m" gap="sm">
                  <Text variant="bodyStrong" style={{ textTransform: 'capitalize' }}>
                    {weekdayName(i18n.language, day)}
                  </Text>
                  {sessions.length === 0 ? <Text variant="small">{t('plan.nothing')}</Text> : null}
                  {sessions.map((s) => {
                    const asset = assets.find((a) => a.id === s.assetId);
                    if (!asset) return null;
                    return (
                      <Box key={s.id} flexDirection="row" alignItems="center" gap="sm">
                        <AssetIcon icon={asset.icon} color={asset.color} face={asset.face} size={32} />
                        <Box flex={1}>
                          <Text variant="label" numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold' }}>
                            {assetName(asset)}
                          </Text>
                          <Duration minutes={s.minutes} size={13} />
                        </Box>
                        <RoundButton accessibilityLabel={t('plan.earlier')} onPress={() => move(s, -1)} style={{ paddingHorizontal: 0 }}>
                          <Text variant="heading">‹</Text>
                        </RoundButton>
                        <RoundButton accessibilityLabel={t('plan.later')} onPress={() => move(s, 1)} style={{ paddingHorizontal: 0 }}>
                          <Text variant="heading">›</Text>
                        </RoundButton>
                        <Pressable accessibilityRole="button" accessibilityLabel={t('plan.remove')} onPress={() => remove(s)} hitSlop={8} style={{ minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                          <Text variant="heading">×</Text>
                        </Pressable>
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
            {result.shortBy.map((s) => {
              const asset = assets.find((a) => a.id === s.assetId);
              return asset ? (
                <Text key={s.assetId} variant="small">
                  {t('plan.short', { name: assetName(asset), time: time(s.minutes) })}
                </Text>
              ) : null;
            })}
            <TextButton label={t('plan.backToTime')} onPress={() => setResult(null)} />
          </>
        )}
      </ScrollView>
      {hasGoals ? (
        <Box paddingHorizontal="l" style={{ paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
          {result ? <PrimaryButton label={t('plan.save')} onPress={save} /> : <PrimaryButton label={t('plan.make')} onPress={make} />}
        </Box>
      ) : null}
    </Box>
  );
}
