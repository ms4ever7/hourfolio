import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { BADGE_EMOJI, parseBadge, type BadgeDef } from '@/domain/achievements';
import { useBadgeName } from '@/lib/badges';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAppTheme } from '@/theme/theme';
import { AssetIcon } from './icons';
import { Box, Text } from './primitives';

/** A badge's picture: an emoji on a soft accent tile, or the hobby's own icon for hour badges. `quiet` is for badges still ahead. */
export function BadgeIcon({ def, size = 48, quiet }: { def: BadgeDef; size?: number; quiet?: boolean }) {
  const { colors } = useAppTheme();
  const assets = usePortfolioStore((s) => s.assets);
  if (def.kind === 'asset') {
    const asset = assets.find((a) => a.id === def.assetId);
    if (asset) {
      return (
        <Box style={{ opacity: quiet ? 0.45 : 1 }}>
          <AssetIcon icon={asset.icon} color={asset.color} face={asset.face} size={size} />
        </Box>
      );
    }
  }
  const emoji = def.kind === 'fixed' ? BADGE_EMOJI[def.id] : '⏳';
  return (
    <Box width={size} height={size} alignItems="center" justifyContent="center" style={{ borderRadius: size * 0.33, backgroundColor: quiet ? colors.track : colors.accentSoft, opacity: quiet ? 0.7 : 1 }}>
      <Text style={{ fontSize: size * 0.46, lineHeight: size * 0.6 }} allowFontScaling={false}>
        {emoji}
      </Text>
    </Box>
  );
}

/** A small pill with the badge's icon and name; opens the badge sheet. Sits on the week that earned it. */
export function BadgeChip({ id }: { id: string }) {
  const { colors } = useAppTheme();
  const name = useBadgeName();
  const def = parseBadge(id);
  if (!def) return null;
  const label = name(def);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={() => router.push({ pathname: '/badge', params: { id } })}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 5, height: 26, paddingLeft: 4, paddingRight: 10, borderRadius: 999, backgroundColor: colors.accentSoft, alignSelf: 'flex-start', opacity: pressed ? 0.7 : 1 })}
    >
      <BadgeIcon def={def} size={18} />
      <Text variant="tiny" color="accentInk" numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold', flexShrink: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}
