import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { CARD_WIDTH, shareView, WeekCard, weekCardHeight } from '@/components/share';
import { PrimaryButton, TextButton } from '@/components/ui';
import { addDays, parseDay } from '@/domain/dates';
import { weekRange } from '@/domain/goals';
import { sumMinutes } from '@/domain/stats';
import { shortDate } from '@/lib/labels';
import { usePortfolio, useToday } from '@/lib/usePortfolio';
import { useAppTheme } from '@/theme/theme';

/** This week as a card to post: total hours, every hobby with time in it, goals met. */
export default function ShareWeek() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const today = useToday();
  // A past week can be shared from its recap; without one it is this week.
  const { week } = useLocalSearchParams<{ week?: string }>();
  const { assets, logs } = usePortfolio();
  const cardRef = useRef<View>(null);

  const d = useMemo(() => {
    const range = weekRange(week ? parseDay(week) : today);
    const from = parseDay(range.from);
    const rows = assets
      .map((asset) => ({ asset, minutes: sumMinutes(logs, range, asset.id) }))
      .filter((r) => r.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
    const withGoals = assets.filter((a) => a.weeklyGoalMinutes);
    return {
      total: sumMinutes(logs, range),
      rows,
      goalsTotal: withGoals.length,
      goalsMet: withGoals.filter((a) => sumMinutes(logs, range, a.id) >= a.weeklyGoalMinutes!).length,
      label: `${shortDate(i18n.language, from)} – ${shortDate(i18n.language, addDays(from, 6))}`,
    };
  }, [assets, logs, today, week, i18n.language]);

  // With many hobbies the card grows; the preview shrinks to fit the screen, the PNG keeps full size.
  const cardHeight = weekCardHeight(d.rows.length);
  const [room, setRoom] = useState(0);
  const scale = room ? Math.min(1, (room - 16) / cardHeight) : 1;

  const share = async () => {
    if (!(await shareView(cardRef, cardHeight))) Alert.alert(t('share.unavailable'));
  };

  return (
    <Box flex={1} backgroundColor="ground" style={{ paddingTop: 28, paddingBottom: insets.bottom + 12 }}>
      <Box paddingHorizontal="l" gap="xs">
        <Text variant="title" accessibilityRole="header">
          {t('share.title')}
        </Text>
        <Text variant="body">{t('share.sub')}</Text>
      </Box>
      <Box flex={1} alignItems="center" justifyContent="center" onLayout={(e) => setRoom(e.nativeEvent.layout.height)}>
        <View style={{ width: CARD_WIDTH * scale, height: cardHeight * scale }}>
          <View style={{ transform: [{ scale }], transformOrigin: 'top left' }}>
            <WeekCard cardRef={cardRef} total={d.total} rows={d.rows} weekLabel={d.label} goalsMet={d.goalsMet} goalsTotal={d.goalsTotal} accent={colors.accent} />
          </View>
        </View>
      </Box>
      <Box paddingHorizontal="l" gap="xs">
        <PrimaryButton icon={UI_PATHS.share} label={t('share.button')} onPress={() => void share()} />
        <TextButton label={t('common.cancel')} onPress={() => router.back()} />
      </Box>
    </Box>
  );
}
