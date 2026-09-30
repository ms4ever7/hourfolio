import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssetIcon, Glyph, ICON_PATHS, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { PrimaryButton, RoundButton, Segmented } from '@/components/ui';
import type { AssetFace, IconKey } from '@/domain/types';
import { useAssetName } from '@/lib/labels';
import { deletePhoto, pickSquarePhoto } from '@/lib/photos';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useSettingsStore } from '@/store/settings-store';
import { PALETTE_KEYS, useAppTheme } from '@/theme/theme';

type FaceKind = 'icon' | 'emoji' | 'photo';

/** Name, picture and color of an asset. Changes save as they are made. */
export default function AssetEdit() {
  const { t } = useTranslation();
  const { colors, palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const assetName = useAssetName();
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = usePortfolioStore((s) => s.assets.find((a) => a.id === id));
  const updateAsset = usePortfolioStore((s) => s.updateAsset);
  const recent = useSettingsStore((s) => s.recentEmoji);
  const [kind, setKind] = useState<FaceKind>(asset?.face?.kind ?? 'icon');
  const [name, setName] = useState(asset ? assetName(asset) : '');

  if (!asset) return null;

  const setFace = (face: AssetFace | undefined) => {
    const old = asset.face;
    if (old?.kind === 'photo' && (face?.kind !== 'photo' || face.file !== old.file)) deletePhoto(old.file);
    updateAsset(asset.id, { face });
  };

  const pickPhoto = async () => {
    const file = await pickSquarePhoto();
    if (file) setFace({ kind: 'photo', file });
  };

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(assetName(asset));
      return;
    }
    // Catalog names follow the app language until the user really renames them.
    const catalogName = asset.catalogId ? t(`catalog.${asset.catalogId}`) : null;
    updateAsset(asset.id, { customName: trimmed === catalogName ? undefined : trimmed });
  };

  const selectKind = (k: FaceKind) => {
    setKind(k);
    if (k === 'icon') setFace(undefined);
  };

  const emoji = asset.face?.kind === 'emoji' ? asset.face.emoji : null;

  return (
    <Box flex={1} backgroundColor="ground">
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 28, gap: 22 }} keyboardShouldPersistTaps="handled">
        <Text variant="title" accessibilityRole="header">
          {t('assetEdit.title')}
        </Text>

        <Box alignItems="center">
          <AssetIcon icon={asset.icon} color={asset.color} face={asset.face} size={104} />
        </Box>

        <Box gap="s">
          <Text variant="bodyStrong">{t('assetEdit.name')}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            onEndEditing={saveName}
            returnKeyType="done"
            maxLength={40}
            accessibilityLabel={t('assetEdit.name')}
            style={{ height: 52, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, fontFamily: 'Inter_400Regular', fontSize: 17, color: colors.ink }}
          />
        </Box>

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
                const on = !asset.face && asset.icon === key;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={key}
                    onPress={() => {
                      setFace(undefined);
                      updateAsset(asset.id, { icon: key });
                    }}
                    style={{ padding: 2, borderRadius: 16, borderWidth: 2, borderColor: on ? colors.ink : 'transparent' }}
                  >
                    <AssetIcon icon={key} color={asset.color} size={48} />
                  </Pressable>
                );
              })}
            </Box>
          ) : null}

          {kind === 'emoji' ? (
            <Box gap="sm">
              <RoundButton onPress={() => router.push({ pathname: '/emoji', params: { assetId: asset.id } })} style={{ alignSelf: 'flex-start' }}>
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
                        onPress={() => setFace({ kind: 'emoji', emoji: e })}
                        style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? palette[asset.color].tint : colors.card, borderWidth: on ? 2 : 1, borderColor: on ? palette[asset.color].main : colors.track }}
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
                {asset.face?.kind === 'photo' ? t('assetEdit.changePhoto') : t('assetEdit.pickPhoto')}
              </Text>
            </RoundButton>
          ) : null}
        </Box>

        <Box gap="s">
          <Text variant="bodyStrong">{t('assetEdit.color')}</Text>
          <Box flexDirection="row" gap="s" flexWrap="wrap" accessibilityRole="radiogroup" accessibilityLabel={t('assetEdit.color')}>
            {PALETTE_KEYS.map((key) => {
              const on = key === asset.color;
              return (
                <Pressable
                  key={key}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={t(`palette.${key}`)}
                  onPress={() => updateAsset(asset.id, { color: key })}
                  style={{ width: 40, height: 40, borderRadius: 20, borderWidth: on ? 2 : 1, borderColor: on ? colors.ink : colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card }}
                >
                  <Box width={28} height={28} borderRadius="pill" style={{ backgroundColor: palette[key].main }} />
                </Pressable>
              );
            })}
          </Box>
        </Box>
      </ScrollView>
      <Box paddingHorizontal="l" style={{ paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
        <PrimaryButton
          label={t('assetEdit.done')}
          onPress={() => {
            saveName();
            router.back();
          }}
        />
      </Box>
    </Box>
  );
}
