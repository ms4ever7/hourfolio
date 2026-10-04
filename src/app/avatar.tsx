import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PresetTile, ProfileAvatar } from '@/components/avatar';
import { Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { PrimaryButton, RoundButton } from '@/components/ui';
import { AVATAR_GROUPS, type Avatar } from '@/domain/avatars';
import { deletePhoto, pickSquarePhoto } from '@/lib/photos';
import { useSettingsStore } from '@/store/settings-store';
import { useAppTheme } from '@/theme/theme';

/** Pick a ready-made character or your own photo. Every tap applies right away. */
export default function AvatarPicker() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const avatar = useSettingsStore((s) => s.avatar);
  const setAvatar = useSettingsStore((s) => s.setAvatar);

  const apply = (next: Avatar) => {
    // The old photo is no longer shown anywhere once replaced.
    if (avatar.kind === 'photo' && (next.kind !== 'photo' || next.file !== avatar.file)) deletePhoto(avatar.file);
    setAvatar(next);
  };

  const pickPhoto = async () => {
    const file = await pickSquarePhoto();
    if (file) apply({ kind: 'photo', file });
  };

  return (
    <Box flex={1} backgroundColor="ground">
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 28, gap: 22 }}>
        <Text variant="title" accessibilityRole="header">
          {t('avatar.title')}
        </Text>
        <Box alignItems="center" gap="m">
          <ProfileAvatar avatar={avatar} size={120} />
          <RoundButton onPress={() => void pickPhoto()}>
            <Glyph d={UI_PATHS.image} size={18} color={colors.ink} />
            <Text variant="label" style={{ fontFamily: 'Inter_600SemiBold' }}>
              {t('avatar.photo')}
            </Text>
          </RoundButton>
        </Box>
        {AVATAR_GROUPS.map((g) => (
          <Box key={g.id} gap="sm">
            <Text variant="bodyStrong">{t(`avatar.groups.${g.id}`)}</Text>
            <Box flexDirection="row" flexWrap="wrap" style={{ gap: 12 }} accessibilityRole="radiogroup" accessibilityLabel={t(`avatar.groups.${g.id}`)}>
              {g.presets.map((p) => {
                const on = avatar.kind === 'preset' && avatar.id === p.id;
                return (
                  <Pressable
                    key={p.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={p.emoji}
                    onPress={() => apply({ kind: 'preset', id: p.id })}
                    style={({ pressed }) => ({ padding: 3, borderRadius: 24, borderWidth: 3, borderColor: on ? colors.accent : 'transparent', transform: [{ scale: pressed ? 0.94 : 1 }] })}
                  >
                    <PresetTile preset={p} size={66} />
                  </Pressable>
                );
              })}
            </Box>
          </Box>
        ))}
      </ScrollView>
      <Box paddingHorizontal="l" style={{ paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
        <PrimaryButton label={t('avatar.done')} onPress={() => router.back()} />
      </Box>
    </Box>
  );
}
