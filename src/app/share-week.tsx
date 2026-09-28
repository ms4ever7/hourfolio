import { router } from 'expo-router';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { shareView, WeekCard } from '@/components/share';
import { PrimaryButton, TextButton } from '@/components/ui';
import { addDays, parseDay } from '@/domain/dates';
import { weekRange } from '@/domain/goals';
import { sumMinutes } from '@/domain/stats';
import { shortDate } from '@/lib/labels';
import { usePortfolio, useToday } from '@/lib/usePortfolio';
import { useAppTheme } from '@/theme/theme';

/** This week as a card to post: total hours, top assets, goals met. */
export default function ShareWeek() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const { assets, logs } = usePortfolio();
  const cardRef = useRef<View>(null);

  const d = useMemo(() => {
    const range = weekRange(today);
    const from = parseDay(range.from);
    const rows = assets
      .map((asset) => ({ asset, minutes: sumMinutes(logs, range, asset.id) }))
      .filter((r) => r.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 4);
    const withGoals = assets.filter((a) => a.weeklyGoalMinutes);
    return {
      total: sumMinutes(logs, range),
      rows,
      goalsTotal: withGoals.length,
      goalsMet: withGoals.filter((a) => sumMinutes(logs, range, a.id) >= a.weeklyGoalMinutes!).length,
      label: `${shortDate(i18n.language, from)} – ${shortDate(i18n.language, addDays(from, 6))}`,
    };
  }, [assets, logs, today, i18n.language]);

  const share = async () => {
    if (!(await shareView(cardRef))) Alert.alert(t('share.unavailable'));
  };

  return (
    <Box flex={1} backgroundColor="ground" style={{ paddingTop: 28, paddingBottom: insets.bottom + 12 }}>
      <Box paddingHorizontal="l" gap="xs">
        <Text variant="title" accessibilityRole="header">
          {t('share.title')}
        </Text>
        <Text variant="body">{t('share.sub')}</Text>
      </Box>
      <Box flex={1} alignItems="center" justifyContent="center">
        <WeekCard cardRef={cardRef} total={d.total} rows={d.rows} weekLabel={d.label} goalsMet={d.goalsMet} goalsTotal={d.goalsTotal} accent={colors.accent} />
      </Box>
      <Box paddingHorizontal="l" gap="xs">
        <PrimaryButton icon={UI_PATHS.share} label={t('share.button')} onPress={() => void share()} />
        <TextButton label={t('common.cancel')} onPress={() => router.back()} />
      </Box>
    </Box>
  );
}
