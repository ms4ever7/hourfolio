import { router, useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GoalField } from '@/components/goal-field';
import { AssetIcon } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { footerPad, modalTop, PrimaryButton } from '@/components/ui';
import { plansAround, replanWeek } from '@/domain/plan';
import { useAssetName } from '@/lib/labels';
import { useToday } from '@/lib/usePortfolio';
import { usePortfolioStore } from '@/store/portfolio-store';

/** Goals for every asset, by the week or by the day. Changes save immediately. */
export default function GoalsEdit() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const assetName = useAssetName();
  const navigation = useNavigation();
  const assets = usePortfolioStore((s) => s.assets);
  const updateAsset = usePortfolioStore((s) => s.updateAsset);
  const setPlan = usePortfolioStore((s) => s.setPlan);
  const today = useToday();
  // Goals as they were when the screen opened, to tell whether anything changed.
  const before = useRef(new Map(assets.map((a) => [a.id, a.weeklyGoalMinutes ?? 0])));
  const asked = useRef(false);

  // Goals save as they change, so the re-plan question must come on every way out: Done, the iOS swipe and Android back alike.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (asked.current) return;
        const { assets: now, logs, plans } = usePortfolioStore.getState();
        const changed = now.some((a) => (a.weeklyGoalMinutes ?? 0) !== (before.current.get(a.id) ?? 0));
        // The weeks with a plan that new goals apply to: the one shown, and next week's if it has one.
        const { shown, next } = plansAround(plans, today);
        const weeks = [...new Set([shown?.weekFrom, next?.weekFrom].filter((w): w is string => w !== undefined))];
        if (!changed || weeks.length === 0) return;
        e.preventDefault();
        asked.current = true;
        const leave = () => navigation.dispatch(e.data.action);
        Alert.alert(
          t('goals.replanTitle'),
          t('goals.replanBody'),
          [
            { text: t('goals.replanKeep'), style: 'cancel', onPress: leave },
            {
              text: t('goals.replanYes'),
              onPress: () => {
                // Only the days still ahead are re-planned (a week that has not started, whole); sessions already done stay.
                for (const weekFrom of weeks) {
                  const current = plans.find((p) => p.weekFrom === weekFrom);
                  if (current) setPlan(replanWeek(current, now, logs, current.free, today));
                }
                leave();
              },
            },
          ],
          { cancelable: false },
        );
      }),
    [navigation, setPlan, t, today],
  );

  return (
    <Box flex={1} backgroundColor="ground">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingTop: modalTop(insets.top), gap: 16 }}>
        <Text variant="title" accessibilityRole="header">
          {t('goals.editTitle')}
        </Text>
        <Text variant="body">{t('goals.editSub')}</Text>
        <Box backgroundColor="card" borderRadius="xl" paddingVertical="xs">
          {assets.map((a, i) => (
            <Box key={a.id} gap="s" paddingVertical="sm" paddingHorizontal="m" borderBottomWidth={i === assets.length - 1 ? 0 : 1} borderColor="line">
              <Box flexDirection="row" alignItems="center" gap="sm">
                <AssetIcon icon={a.icon} color={a.color} face={a.face} size={36} />
                <Text variant="label" numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter_600SemiBold' }}>
                  {assetName(a)}
                </Text>
              </Box>
              <GoalField asset={a} label={assetName(a)} onChange={(patch) => updateAsset(a.id, patch)} />
            </Box>
          ))}
        </Box>
      </ScrollView>
      <Box paddingHorizontal="l" style={{ paddingBottom: footerPad(insets.bottom), paddingTop: 8 }}>
        <PrimaryButton label={t('goals.done')} onPress={() => router.back()} />
      </Box>
    </Box>
  );
}
