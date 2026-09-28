import { Image } from 'expo-image';
import { useId } from 'react';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { avatarPreset, type Avatar, type AvatarPreset } from '@/domain/avatars';
import { photoUri } from '@/lib/photos';
import { Box, Text } from './primitives';

/** A preset character: its emoji on a two-tone tile. */
export function PresetTile({ preset, size }: { preset: AvatarPreset; size: number }) {
  const id = useId().replace(/:/g, '');
  const radius = size * 0.32;
  return (
    <Box width={size} height={size} alignItems="center" justifyContent="center" overflow="hidden" style={{ borderRadius: radius }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={preset.colors[0]} />
            <Stop offset="1" stopColor={preset.colors[1]} />
          </LinearGradient>
        </Defs>
        <Rect width={size} height={size} fill={`url(#${id})`} />
      </Svg>
      <Text style={{ fontSize: size * 0.56, lineHeight: size * 0.72 }} allowFontScaling={false}>
        {preset.emoji}
      </Text>
    </Box>
  );
}

export function ProfileAvatar({ avatar, size = 40 }: { avatar: Avatar; size?: number }) {
  if (avatar.kind === 'photo') {
    return <Image source={{ uri: photoUri(avatar.file) }} style={{ width: size, height: size, borderRadius: size * 0.32 }} contentFit="cover" accessibilityIgnoresInvertColors />;
  }
  return <PresetTile preset={avatarPreset(avatar.id)} size={size} />;
}
