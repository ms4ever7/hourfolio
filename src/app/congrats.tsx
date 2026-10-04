import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Confetti } from '@/components/confetti';
import { UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { GoalCard, shareView } from '@/components/share';
import { PrimaryButton, TextButton } from '@/components/ui';
import { addDays, parseDay } from '@/domain/dates';
import { formatHours } from '@/domain/format';
import { allGoalsMet, weekRange } from '@/domain/goals';
import { sumMinutes } from '@/domain/stats';
import { shortDate, useAssetName } from '@/lib/labels';
import { useSeason } from '@/lib/appearance';
import { usePortfolio } from '@/lib/usePortfolio';
import { useSettingsStore } from '@/store/settings-store';
import { lightPalette, useAppTheme } from '@/theme/theme';

/** Shown once when a log entry completes a weekly goal. */
export default function Congrats() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const assetName = useAssetName();
  const { assetId, week } = useLocalSearchParams<{ assetId: string; week: string }>();
  const { assets, logs } = usePortfolio();
  const scene = useSettingsStore((s) => s.goalScene);
  const season = useSeason();
  const cardRef = useRef<View>(null);
  const asset = assets.find((a) => a.id === assetId);

  const data = useMemo(() => {
    const range = weekRange(parseDay(week));
    const from = parseDay(range.from);
    return {
      minutes: asset ? sumMinutes(logs, range, asset.id) : 0,
      all: allGoalsMet(assets, logs, range),
      label: `${shortDate(i18n.language, from)} – ${shortDate(i18n.language, addDays(from, 6))}`,
    };
  }, [asset, assets, logs, week, i18n.language]);

  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  if (!asset?.weeklyGoalMinutes) return null;
  const p = lightPalette[asset.color];

  const share = async () => {
    if (!(await shareView(cardRef))) Alert.alert(t('share.unavailable'));
  };

  return (
    <Box flex={1} backgroundColor="ground" style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 12 }}>
      <Box flex={1} alignItems="center" justifyContent="center" gap="l" paddingHorizontal="l">
        <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', gap: 6 }}>
          <Text variant="title" style={{ fontSize: 32, lineHeight: 38 }} accessibilityRole="header">
            {t('congrats.title')}
          </Text>
          <Text variant="body" textAlign="center">
            {t('congrats.sub', { name: assetName(asset), hours: formatHours(data.minutes, i18n.language) })}
          </Text>
          {data.all ? (
            <Text variant="label" color="days" textAlign="center" style={{ fontFamily: 'Inter_600SemiBold' }}>
              {t('congrats.all')}
            </Text>
          ) : null}
        </Animated.View>
        <Animated.View entering={ZoomIn.delay(150).springify().damping(14)}>
          <GoalCard cardRef={cardRef} asset={asset} minutes={data.minutes} goal={asset.weeklyGoalMinutes} weekLabel={data.label} scene={scene} season={season?.id ?? null} />
        </Animated.View>
      </Box>
      <Box paddingHorizontal="l" gap="xs">
        <PrimaryButton icon={UI_PATHS.share} label={t('congrats.share')} onPress={() => void share()} />
        <TextButton label={t('congrats.done')} onPress={() => router.back()} />
      </Box>
      <Confetti colors={[p.main, p.soft, colors.hours, colors.minutes, colors.days]} />
    </Box>
  );
}
