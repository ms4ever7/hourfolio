import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssetIcon, Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { PrimaryButton, RoundButton, Segmented, footerPad } from '@/components/ui';
import { addDays, dayKey, parseDay } from '@/domain/dates';
import { durationParts } from '@/domain/format';
import { celebrationKey, goalMetBy, weekRange } from '@/domain/goals';
import { RECOVERY_ID } from '@/domain/types';
import { useAssetName } from '@/lib/labels';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useSettingsStore } from '@/store/settings-store';
import { useAppTheme } from '@/theme/theme';

const QUICK = [15, 30, 45, 60, 90, 120];

export default function LogSheet() {
  const { t } = useTranslation();
  const { colors, palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const assetName = useAssetName();
  const params = useLocalSearchParams<{ assetId?: string }>();
  const assets = usePortfolioStore((s) => s.assets);
  const logTime = usePortfolioStore((s) => s.logTime);
  const [assetId, setAssetId] = useState(params.assetId ?? assets.find((a) => a.id !== RECOVERY_ID)?.id ?? RECOVERY_ID);
  const [minutes, setMinutes] = useState(60);
  const [when, setWhen] = useState<'today' | 'yesterday'>('today');
  const [note, setNote] = useState('');

  const others = assets.filter((a) => a.id !== RECOVERY_ID);
  const restOn = assetId === RECOVERY_ID;
  const durationLabel = durationParts(minutes)
    .map((p) => `${p.value} ${t(`units.${p.unit}`)}`)
    .join(' ');

  const save = () => {
    const entry = { assetId, minutes, day: dayKey(when === 'today' ? new Date() : addDays(new Date(), -1)), note: note.trim() || undefined };
    const met = goalMetBy(entry, assets, usePortfolioStore.getState().logs);
    logTime(entry);
    if (met) {
      const week = weekRange(parseDay(entry.day)).from;
      const key = celebrationKey(met.id, week);
      const { celebrated, markCelebrated } = useSettingsStore.getState();
      if (!celebrated.includes(key)) {
        markCelebrated(key);
        // The congrats screen has its own success haptic.
        router.replace({ pathname: '/congrats', params: { assetId: met.id, week } });
        return;
      }
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <Box flex={1} backgroundColor="ground">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingTop: 28, gap: 22 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Text variant="title" accessibilityRole="header">
          {t('log.title')}
        </Text>

        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ checked: restOn }}
          onPress={() => setAssetId(RECOVERY_ID)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            padding: 14,
            borderRadius: 18,
            backgroundColor: restOn ? palette.sky.main : palette.sky.tint,
          }}
        >
          <Box backgroundColor="card" style={{ borderRadius: 14 }}>
            <AssetIcon icon="moon" color="sky" size={48} />
          </Box>
          <Box flex={1}>
            <Text variant="heading" style={{ color: restOn ? colors.card : colors.restInk }}>
              {t('log.rest')}
            </Text>
            <Text variant="small" style={{ color: restOn ? colors.card : colors.restSub, opacity: restOn ? 0.85 : 1 }}>
              {t('log.restSub')}
            </Text>
          </Box>
          {restOn ? <Glyph d={UI_PATHS.check} size={22} color={colors.card} strokeWidth={2.6} /> : null}
        </Pressable>

        <Box gap="s">
          <Text variant="bodyStrong">{t('log.asset')}</Text>
          <Box flexDirection="row" flexWrap="wrap" style={{ gap: 10 }} accessibilityRole="radiogroup" accessibilityLabel={t('log.asset')}>
            {others.map((a) => {
              const on = a.id === assetId;
              return (
                <Pressable
                  key={a.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={assetName(a)}
                  onPress={() => setAssetId(a.id)}
                  style={{ width: '22.7%', alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.card, borderWidth: on ? 2 : 1, borderColor: on ? palette[a.color].main : colors.track }}
                >
                  <AssetIcon icon={a.icon} color={a.color} face={a.face} size={40} />
                  <Text variant="tiny" color="ink" numberOfLines={1} style={{ maxWidth: '90%' }}>
                    {assetName(a)}
                  </Text>
                </Pressable>
              );
            })}
          </Box>
        </Box>

        <Box gap="s">
          <Text variant="bodyStrong">{t('log.duration')}</Text>
          <Box flexDirection="row" flexWrap="wrap" gap="s">
            {QUICK.map((m) => {
              const on = m === minutes;
              return (
                <Pressable
                  key={m}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setMinutes(m)}
                  style={{ height: 44, minWidth: 64, paddingHorizontal: 12, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? colors.inverse : colors.card, borderWidth: 1, borderColor: on ? colors.inverse : colors.border }}
                >
                  <Text variant="label" color={on ? 'onInverse' : 'ink'} style={{ fontFamily: 'Inter_600SemiBold' }}>
                    {durationParts(m).map((p, i) => (
                      <Text key={p.unit} style={{ fontFamily: 'Inter_600SemiBold', color: on ? colors.onInverse : colors.ink }}>
                        {i > 0 ? ' ' : ''}
                        {p.value}
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: p.unit === 'h' ? (on ? colors.hoursOnInverse : colors.hours) : on ? colors.minutesOnInverse : colors.minutes }}>
                          {t(`units.${p.unit}`)}
                        </Text>
                      </Text>
                    ))}
                  </Text>
                </Pressable>
              );
            })}
          </Box>
          <Box flexDirection="row" alignItems="center" gap="sm">
            <RoundButton accessibilityLabel={t('common.less')} onPress={() => setMinutes((m) => Math.max(5, m - 5))} style={{ paddingHorizontal: 0 }}>
              <Text variant="heading">−</Text>
            </RoundButton>
            <Text variant="mono" style={{ fontSize: 18, flex: 1, textAlign: 'center' }}>
              {durationLabel}
            </Text>
            <RoundButton accessibilityLabel={t('common.more')} onPress={() => setMinutes((m) => Math.min(24 * 60, m + 5))} style={{ paddingHorizontal: 0 }}>
              <Text variant="heading">+</Text>
            </RoundButton>
          </Box>
        </Box>

        <Box gap="s">
          <Text variant="bodyStrong">{t('log.when')}</Text>
          <Segmented
            label={t('log.when')}
            value={when}
            onChange={setWhen}
            options={[
              { value: 'today', label: t('log.today') },
              { value: 'yesterday', label: t('log.yesterday') },
            ]}
          />
        </Box>

        <Box gap="s">
          <Text variant="bodyStrong">{t('log.note')}</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('log.notePlaceholder')}
            placeholderTextColor={colors.faint}
            accessibilityLabel={t('log.note')}
            style={{ minHeight: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.ink }}
          />
        </Box>
      </ScrollView>
      <Box paddingHorizontal="l" style={{ paddingBottom: footerPad(insets.bottom), paddingTop: 8 }}>
        <PrimaryButton label={t('log.save', { duration: durationLabel })} onPress={save} />
      </Box>
    </Box>
  );
}
