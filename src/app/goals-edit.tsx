import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssetIcon } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { Duration, PrimaryButton, RoundButton } from '@/components/ui';
import { useAssetName } from '@/lib/labels';
import { usePortfolioStore } from '@/store/portfolio-store';

const STEP = 30;
const MAX = 40 * 60;

/** Weekly goals for every asset, in half-hour steps. Changes save immediately. */
export default function GoalsEdit() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const assetName = useAssetName();
  const assets = usePortfolioStore((s) => s.assets);
  const updateAsset = usePortfolioStore((s) => s.updateAsset);

  const set = (id: string, minutes: number) => updateAsset(id, { weeklyGoalMinutes: minutes > 0 ? minutes : undefined });

  return (
    <Box flex={1} backgroundColor="ground">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingTop: 28, gap: 16 }}>
        <Text variant="title" accessibilityRole="header">
          {t('goals.editTitle')}
        </Text>
        <Text variant="body">{t('goals.editSub')}</Text>
        <Box backgroundColor="card" borderRadius="xl" paddingVertical="xs">
          {assets.map((a, i) => {
            const goal = a.weeklyGoalMinutes ?? 0;
            return (
              <Box key={a.id} flexDirection="row" alignItems="center" gap="sm" paddingVertical="sm" paddingHorizontal="m" borderBottomWidth={i === assets.length - 1 ? 0 : 1} borderColor="line">
                <AssetIcon icon={a.icon} color={a.color} face={a.face} size={36} />
                <Text variant="label" numberOfLines={1} style={{ flex: 1, fontFamily: 'Inter_600SemiBold' }}>
                  {assetName(a)}
                </Text>
                <RoundButton accessibilityLabel={`${t('common.less')}: ${assetName(a)}`} onPress={() => set(a.id, Math.max(0, goal - STEP))} style={{ paddingHorizontal: 0 }}>
                  <Text variant="heading">−</Text>
                </RoundButton>
                <Box width={76} alignItems="center">
                  {goal === 0 ? (
                    <Text variant="small">{t('setup.goalOff')}</Text>
                  ) : (
                    <Duration minutes={goal} size={14} />
                  )}
                </Box>
                <RoundButton accessibilityLabel={`${t('common.more')}: ${assetName(a)}`} onPress={() => set(a.id, Math.min(MAX, goal + STEP))} style={{ paddingHorizontal: 0 }}>
                  <Text variant="heading">+</Text>
                </RoundButton>
              </Box>
            );
          })}
        </Box>
      </ScrollView>
      <Box paddingHorizontal="l" style={{ paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
        <PrimaryButton label={t('goals.done')} onPress={() => router.back()} />
      </Box>
    </Box>
  );
}
