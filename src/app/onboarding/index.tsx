import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';
import { AssetIcon, BrandMark } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { OnboardingFooter, PrimaryButton, Screen } from '@/components/ui';
import { formatHours } from '@/domain/format';
import { useAppTheme } from '@/theme/theme';

function HeroArt() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const tiles = [
    { icon: 'guitar', color: 'magenta', left: '8%', top: 120, rotate: '-6deg' },
    { icon: 'dumbbell', color: 'vermilion', left: '34%', top: 70, rotate: '5deg' },
    { icon: 'code', color: 'violet', left: '58%', top: 128, rotate: '-4deg' },
    { icon: 'moon', color: 'sky', left: '76%', top: 30, rotate: '7deg' },
  ] as const;
  return (
    <Box height={250} backgroundColor="card" overflow="hidden" style={{ borderRadius: 28 }} accessible={false}>
      <Svg width="100%" height={250} viewBox="0 0 342 250" preserveAspectRatio="none" style={{ position: 'absolute' }}>
        <Path d="M0,220 C60,210 90,190 130,170 C170,150 200,160 240,110 C270,75 300,60 342,40 L342,250 L0,250 Z" fill={colors.hours} fillOpacity={0.07} />
        <Path d="M0,220 C60,210 90,190 130,170 C170,150 200,160 240,110 C270,75 300,60 342,40" fill="none" stroke={colors.hours} strokeWidth={2.5} />
      </Svg>
      {tiles.map((tile) => (
        <Box key={tile.icon} position="absolute" style={{ left: tile.left, top: tile.top, transform: [{ rotate: tile.rotate }] }}>
          <AssetIcon icon={tile.icon} color={tile.color} size={56} />
        </Box>
      ))}
      <Box position="absolute" backgroundColor="inverse" borderRadius="pill" paddingHorizontal="sm" style={{ left: 24, top: 24, paddingVertical: 6 }}>
        <Text variant="mono" color="onInverse" style={{ fontSize: 14 }}>
          +{formatHours(6870, i18n.language)}
          <Text variant="bodyStrong" color="hoursOnInverse" style={{ fontSize: 12 }}>
            {' '}
            {t('units.h')}
          </Text>
        </Text>
      </Box>
    </Box>
  );
}

export default function Welcome() {
  const { t } = useTranslation();

  return (
    <Screen
      footer={
        <OnboardingFooter primary={<PrimaryButton label={t('welcome.cta')} onPress={() => router.push('/onboarding/tour')} />} />
      }
    >
      <Box flexDirection="row" alignItems="center" gap="s">
        <BrandMark size={28} />
        <Text variant="bodyStrong" style={{ fontFamily: 'Inter_700Bold' }}>
          Hourfolio
        </Text>
      </Box>

      <HeroArt />

      <Box gap="sm">
        <Text variant="title" style={{ fontSize: 30, lineHeight: 35 }} accessibilityRole="header">
          {t('welcome.headline')}
        </Text>
        <Text variant="body" style={{ fontSize: 16, lineHeight: 24 }}>
          {t('welcome.sub')}
        </Text>
      </Box>
    </Screen>
  );
}
