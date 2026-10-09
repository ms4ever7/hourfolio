import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { InvestmentPreview, PlanPreview, ProgressPreview } from '@/components/tour-previews';
import { OnboardingFooter, PrimaryButton, TextButton } from '@/components/ui';
import { useAppTheme } from '@/theme/theme';

const SLIDES = [
  { key: 'plan', Preview: PlanPreview },
  { key: 'progress', Preview: ProgressPreview },
  { key: 'investment', Preview: InvestmentPreview },
] as const;

/** Three looks at the app after months of use, before the user picks their first hobby. */
export default function Tour() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pager = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  const start = () => router.push('/onboarding/pick');
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  const next = () => {
    if (last) return start();
    pager.current?.scrollTo({ x: width * (index + 1), animated: true });
    setIndex(index + 1);
  };

  return (
    <Box flex={1} backgroundColor="ground" style={{ paddingTop: insets.top + 12 }}>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" paddingHorizontal="l">
        <Box flexDirection="row" alignItems="center" gap="s">
          <BrandMark size={28} />
          <Text variant="bodyStrong" style={{ fontFamily: 'Inter_700Bold' }}>
            Hourfolio
          </Text>
        </Box>
        {!last ? <TextButton label={t('tour.skip')} onPress={start} /> : null}
      </Box>

      <ScrollView ref={pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd} style={{ flex: 1 }}>
        {SLIDES.map(({ key, Preview }) => (
          <ScrollView key={key} style={{ width }} contentContainerStyle={{ padding: 24, gap: 24 }} showsVerticalScrollIndicator={false}>
            <Box gap="sm">
              <Text variant="title" style={{ fontSize: 28, lineHeight: 33 }} accessibilityRole="header">
                {t(`tour.${key}.title`)}
              </Text>
              <Text variant="body" style={{ fontSize: 16, lineHeight: 24 }}>
                {t(`tour.${key}.sub`)}
              </Text>
            </Box>
            <Box accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden pointerEvents="none">
              <Preview />
            </Box>
          </ScrollView>
        ))}
      </ScrollView>

      <Box paddingHorizontal="l" style={{ paddingTop: 8, paddingBottom: 16 }}>
        <Box flexDirection="row" justifyContent="center" gap="xs" accessible accessibilityLabel={t('setup.step', { current: index + 1, total: SLIDES.length })}>
          {SLIDES.map((s, i) => (
            <Box key={s.key} width={i === index ? 20 : 6} height={6} borderRadius="pill" style={{ backgroundColor: i === index ? colors.accent : colors.dashed }} />
          ))}
        </Box>
      </Box>
      <OnboardingFooter primary={<PrimaryButton label={last ? t('tour.start') : t('common.continue')} onPress={next} />} />
    </Box>
  );
}
