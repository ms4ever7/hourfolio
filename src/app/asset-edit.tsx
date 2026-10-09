import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FacePicker, ColorPicker } from '@/components/face-picker';
import { AssetIcon } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { PrimaryButton, footerPad } from '@/components/ui';
import { addDays, startOfWeek } from '@/domain/dates';
import { ALL_DAYS } from '@/domain/plan';
import type { AssetFace } from '@/domain/types';
import { useAssetName } from '@/lib/labels';
import { deletePhoto } from '@/lib/photos';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAppTheme } from '@/theme/theme';

/** Name, picture and color of an asset. Changes save as they are made. */
export default function AssetEdit() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const assetName = useAssetName();
  const { id } = useLocalSearchParams<{ id: string }>();
  const asset = usePortfolioStore((s) => s.assets.find((a) => a.id === id));
  const updateAsset = usePortfolioStore((s) => s.updateAsset);
  const [name, setName] = useState(asset ? assetName(asset) : '');

  if (!asset) return null;

  const setFace = (face: AssetFace | undefined) => {
    const old = asset.face;
    if (old?.kind === 'photo' && (face?.kind !== 'photo' || face.file !== old.file)) deletePhoto(old.file);
    updateAsset(asset.id, { face });
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

  const planDays = asset.planDays ?? ALL_DAYS;
  const monday = startOfWeek(new Date());
  const toggleDay = (d: number) => {
    const next = planDays.includes(d) ? planDays.filter((x) => x !== d) : [...planDays, d].sort();
    // At least one day stays on; all seven is the default and is stored as unset.
    if (next.length === 0) return;
    updateAsset(asset.id, { planDays: next.length === 7 ? undefined : next });
  };

  return (
    <Box flex={1} backgroundColor="ground">
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 28, gap: 22 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
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

        <FacePicker
          icon={asset.icon}
          color={asset.color}
          face={asset.face}
          emojiParams={{ assetId: asset.id }}
          onIcon={(icon) => updateAsset(asset.id, { icon })}
          onFace={setFace}
        />

        <Box gap="s">
          <Text variant="bodyStrong">{t('assetEdit.color')}</Text>
          <ColorPicker label={t('assetEdit.color')} value={asset.color} onChange={(color) => updateAsset(asset.id, { color })} />
        </Box>

        <Box gap="s">
          <Text variant="bodyStrong">{t('assetEdit.planDays')}</Text>
          <Text variant="small">{t('assetEdit.planDaysSub')}</Text>
          <Box flexDirection="row" gap="xs" accessibilityLabel={t('assetEdit.planDays')}>
            {ALL_DAYS.map((d) => {
              const on = planDays.includes(d);
              const name = new Intl.DateTimeFormat(i18n.language, { weekday: 'long' }).format(addDays(monday, d));
              return (
                <Pressable
                  key={d}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={name}
                  onPress={() => toggleDay(d)}
                  style={{ flex: 1, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.accentSoft : colors.card, borderWidth: on ? 2 : 1, borderColor: on ? colors.accent : colors.border }}
                >
                  <Text variant="label" style={{ fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' }}>
                    {new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' }).format(addDays(monday, d))}
                  </Text>
                </Pressable>
              );
            })}
          </Box>
        </Box>
      </ScrollView>
      <Box paddingHorizontal="l" style={{ paddingBottom: footerPad(insets.bottom), paddingTop: 8 }}>
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
