import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { AssetIcon, Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { Card, Duration, PrimaryButton, SectionHeader, TextButton } from '@/components/ui';
import { addDays, dayKey, parseDay, startOfWeek } from '@/domain/dates';
import { isSessionDone, replanWeek, sessionsOn, type PlannedSession, type WeekPlan } from '@/domain/plan';
import { useAssetName, weekdayName } from '@/lib/labels';
import { usePortfolio, useToday } from '@/lib/usePortfolio';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAppTheme } from '@/theme/theme';

const DEFAULT_FREE = [60, 60, 60, 60, 60, 0, 0];

/** The saved plan for the week `today` is in, if there is one. */
export function useWeekPlan(): WeekPlan | undefined {
  const today = useToday();
  const weekFrom = dayKey(startOfWeek(today));
  return usePortfolioStore((s) => s.plans.find((p) => p.weekFrom === weekFrom));
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
      {done ? <Glyph d={UI_PATHS.check} size={14} color={colors.days} strokeWidth={3} /> : null}
    </Pressable>
  );
}

/** On Today: what the plan has for today, or a quiet invitation to make a plan. */
export function TodayPlan() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const today = useToday();
  const plan = useWeekPlan();
  const { assets, logs } = usePortfolio();
  const sessions = sessionsOn(plan, dayKey(today));

  if (plan) {
    if (sessions.length === 0) return null;
    return (
      <Card gap="xs">
        <SectionHeader title={t('plan.today')} />
        {sessions.map((s) => (
          <SessionRow key={s.id} session={s} done={isSessionDone(s, logs)} />
        ))}
      </Card>
    );
  }
  if (!assets.some((a) => a.weeklyGoalMinutes)) return null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/plan-week')}
      style={({ pressed }) => ({ gap: 4, padding: 14, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.dashed, opacity: pressed ? 0.8 : 1 })}
    >
      <Text variant="bodyStrong">{t('plan.cta')}</Text>
      <Text variant="small">{t('plan.ctaSub')}</Text>
    </Pressable>
  );
}

/** On Goals: the whole week's plan with a way to re-plan what is left, or the button to make one. */
export function WeekPlanCard() {
  const { t, i18n } = useTranslation();
  const today = useToday();
  const plan = useWeekPlan();
  const { assets, logs } = usePortfolio();
  const setPlan = usePortfolioStore((s) => s.setPlan);
  const monday = startOfWeek(today);

  if (!plan) {
    return (
      <Card gap="sm">
        <SectionHeader title={t('plan.yourPlan')} />
        <Text variant="body">{t('plan.ctaSub')}</Text>
        <PrimaryButton label={t('plan.cta')} onPress={() => router.push('/plan-week')} />
      </Card>
    );
  }

  const replan = () => setPlan({ ...replanWeek(plan, assets, logs, plan.free ?? DEFAULT_FREE, today), free: plan.free });

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
      <TextButton label={t('plan.replan')} onPress={replan} />
      <TextButton label={t('plan.edit')} onPress={() => router.push('/plan-week')} />
    </Card>
  );
}
