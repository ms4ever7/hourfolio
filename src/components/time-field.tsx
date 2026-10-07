import { RoundButton } from './ui';
import { useTranslation } from 'react-i18next';
import { Box, Text } from './primitives';

const STEP = 15;
const DAY = 24 * 60;
const pad = (n: number) => String(n).padStart(2, '0');

/** A time of day as minutes after midnight, in 15-minute steps. Android and web have no SwiftUI picker. */
export function TimeField({ minutes, onChange, label }: { minutes: number; onChange: (m: number) => void; label?: string }) {
  const { t } = useTranslation();
  const move = (by: number) => onChange((((minutes + by) % DAY) + DAY) % DAY);
  const name = label ? `: ${label}` : '';
  return (
    <Box flexDirection="row" alignItems="center" gap="s">
      <RoundButton accessibilityLabel={`${t('common.less')}${name}`} onPress={() => move(-STEP)} style={{ paddingHorizontal: 0 }}>
        <Text variant="heading">−</Text>
      </RoundButton>
      <Box width={64} alignItems="center">
        <Text variant="bodyStrong">{`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`}</Text>
      </Box>
      <RoundButton accessibilityLabel={`${t('common.more')}${name}`} onPress={() => move(STEP)} style={{ paddingHorizontal: 0 }}>
        <Text variant="heading">+</Text>
      </RoundButton>
    </Box>
  );
}
