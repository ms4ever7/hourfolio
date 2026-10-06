import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { AssetIcon, Glyph, ICON_PATHS, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { RoundButton, Segmented } from '@/components/ui';
import type { AssetFace, IconKey, PaletteKey } from '@/domain/types';
import { pickSquarePhoto } from '@/lib/photos';
import { useSettingsStore } from '@/store/settings-store';
import { PALETTE_KEYS, useAppTheme } from '@/theme/theme';

type FaceKind = 'icon' | 'emoji' | 'photo';

type Props = {
  icon: IconKey;
  color: PaletteKey;
  face: AssetFace | undefined;
  /** Params for the `/emoji` route: `{ assetId }` for a saved asset, `{ draft }` during onboarding. */
  emojiParams: Record<string, string>;
  onIcon: (icon: IconKey) => void;
  /** `undefined` clears the face and falls back to the icon. */
  onFace: (face: AssetFace | undefined) => void;
};

/** Picks an asset's picture: a glyph from the app, an emoji or the user's own photo. */
export function FacePicker({ icon, color, face, emojiParams, onIcon, onFace }: Props) {
  const { t } = useTranslation();
  const { colors, palette } = useAppTheme();
  const recent = useSettingsStore((s) => s.recentEmoji);
  const [kind, setKind] = useState<FaceKind>(face?.kind ?? 'icon');
  const emoji = face?.kind === 'emoji' ? face.emoji : null;

  const selectKind = (k: FaceKind) => {
    setKind(k);
    if (k === 'icon') onFace(undefined);
  };

  const pickPhoto = async () => {
    const file = await pickSquarePhoto();
    if (file) onFace({ kind: 'photo', file });
  };

  return (
    <Box gap="sm">
      <Text variant="bodyStrong">{t('assetEdit.face')}</Text>
      <Segmented
        label={t('assetEdit.face')}
        value={kind}
        onChange={selectKind}
        options={(['icon', 'emoji', 'photo'] as const).map((k) => ({ value: k, label: t(`assetEdit.${k}`) }))}
      />

      {kind === 'icon' ? (
        <Box flexDirection="row" flexWrap="wrap" style={{ gap: 10 }} accessibilityRole="radiogroup" accessibilityLabel={t('assetEdit.icon')}>
          {(Object.keys(ICON_PATHS) as IconKey[]).map((key) => {
            const on = !face && icon === key;
            return (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={key}
                onPress={() => {
                  onFace(undefined);
                  onIcon(key);
                }}
                style={{ padding: 2, borderRadius: 16, borderWidth: 2, borderColor: on ? colors.ink : 'transparent' }}
              >
                <AssetIcon icon={key} color={color} size={48} />
              </Pressable>
            );
          })}
        </Box>
      ) : null}

      {kind === 'emoji' ? (
        <Box gap="sm">
          <RoundButton onPress={() => router.push({ pathname: '/emoji', params: emojiParams })} style={{ alignSelf: 'flex-start' }}>
            <Text style={{ fontSize: 18, lineHeight: 22 }}>{emoji ?? '😀'}</Text>
            <Text variant="label" style={{ fontFamily: 'Inter_600SemiBold' }}>
              {t('assetEdit.chooseEmoji')}
            </Text>
          </RoundButton>
          {recent.length ? (
            <Box flexDirection="row" flexWrap="wrap" style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={t('emoji.recent')}>
              {recent.slice(0, 12).map((e) => {
                const on = emoji === e;
                return (
                  <Pressable
                    key={e}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={e}
                    onPress={() => onFace({ kind: 'emoji', emoji: e })}
                    style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? palette[color].tint : colors.card, borderWidth: on ? 2 : 1, borderColor: on ? palette[color].main : colors.track }}
                  >
                    <Text style={{ fontSize: 24, lineHeight: 30 }} allowFontScaling={false}>
                      {e}
                    </Text>
                  </Pressable>
                );
              })}
            </Box>
          ) : null}
        </Box>
      ) : null}

      {kind === 'photo' ? (
        <RoundButton onPress={() => void pickPhoto()} style={{ alignSelf: 'flex-start' }}>
          <Glyph d={UI_PATHS.image} size={18} color={colors.ink} />
          <Text variant="label" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {face?.kind === 'photo' ? t('assetEdit.changePhoto') : t('assetEdit.pickPhoto')}
          </Text>
        </RoundButton>
      ) : null}
    </Box>
  );
}

/** The row of palette swatches. */
export function ColorPicker({ label, value, onChange }: { label: string; value: PaletteKey; onChange: (key: PaletteKey) => void }) {
  const { t } = useTranslation();
  const { colors, palette } = useAppTheme();
  return (
    <Box flexDirection="row" gap="s" flexWrap="wrap" accessibilityRole="radiogroup" accessibilityLabel={label}>
      {PALETTE_KEYS.map((key) => {
        const on = key === value;
        return (
          <Pressable
            key={key}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={t(`palette.${key}`)}
            onPress={() => onChange(key)}
            style={{ width: 40, height: 40, borderRadius: 20, borderWidth: on ? 2 : 1, borderColor: on ? colors.ink : colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card }}
          >
            <Box width={28} height={28} borderRadius="pill" style={{ backgroundColor: palette[key].main }} />
          </Pressable>
        );
      })}
    </Box>
  );
}
