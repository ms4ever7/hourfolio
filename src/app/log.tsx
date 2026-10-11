import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DayPicker } from '@/components/day-picker';
import { AssetIcon, Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { PrimaryButton, RoundButton, footerPad } from '@/components/ui';
import { addDays, dayKey, parseDay } from '@/domain/dates';
import { durationParts } from '@/domain/format';
import { celebrationKey, goalMetBy, weekRange } from '@/domain/goals';
import { RECOVERY_ID } from '@/domain/types';
import { useAssetName } from '@/lib/labels';
import { useToday } from '@/lib/usePortfolio';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useSettingsStore } from '@/store/settings-store';
import { useAppTheme } from '@/theme/theme';

const QUICK = [15, 30, 45, 60, 90, 120];

export default function LogSheet() {
  const { t, i18n } = useTranslation();
  const { colors, palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const assetName = useAssetName();
  const today = useToday();
  // A planned session passes its own day and what is left of it, so logging it ticks it off.
  const params = useLocalSearchParams<{ assetId?: string; day?: string; minutes?: string }>();
  // Today, yesterday and the days before are labelled by name for a week; the calendar reaches further back.
  const days = Array.from({ length: 7 }, (_, i) => dayKey(addDays(today, -i)));
  const plannedMinutes = Number(params.minutes);
  const assets = usePortfolioStore((s) => s.assets);
  const logTime = usePortfolioStore((s) => s.logTime);
  const [assetId, setAssetId] = useState(params.assetId ?? assets.find((a) => a.id !== RECOVERY_ID)?.id ?? RECOVERY_ID);
  const [minutes, setMinutes] = useState(plannedMinutes > 0 && plannedMinutes <= 24 * 60 ? Math.max(5, Math.ceil(plannedMinutes / 5) * 5) : 60);
  // null means "today", resolved when saving, so a sheet left open past midnight still logs to the day it is then.
  const [picked, setPicked] = useState<string | null>(params.day && params.day !== days[0] && days.includes(params.day) ? params.day : null);
  const when = picked ?? days[0];
  const [picking, setPicking] = useState(false);
  const [note, setNote] = useState('');
  const dayLabel = (d: string) => (d === days[1] ? t('log.yesterday') : new Intl.DateTimeFormat(i18n.language, d >= days[6] ? { weekday: 'short', day: 'numeric' } : { day: 'numeric', month: 'short' }).format(parseDay(d)));

  const others = assets.filter((a) => a.id !== RECOVERY_ID);
  const restOn = assetId === RECOVERY_ID;
  const durationLabel = durationParts(minutes)
    .map((p) => `${p.value} ${t(`units.${p.unit}`)}`)
    .join(' ');

  const save = () => {
    const entry = { assetId, minutes, day: picked ?? dayKey(new Date()), note: note.trim() || undefined };
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
          <Box flexDirection="row" gap="s" accessibilityRole="radiogroup" accessibilityLabel={t('log.when')}>
            {[
              { key: 'today', label: t('log.today'), on: when === days[0], onPress: () => { setPicked(null); setPicking(false); } },
              { key: 'other', label: when !== days[0] ? dayLabel(when) : t('log.chooseDay'), on: when !== days[0], onPress: () => setPicking(true) },
            ].map((o) => (
              <Pressable
                key={o.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: o.on }}
                onPress={o.onPress}
                style={{ flex: 1, height: 44, paddingHorizontal: 14, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: o.on ? colors.inverse : colors.card, borderWidth: 1, borderColor: o.on ? colors.inverse : colors.border }}
              >
                <Text variant="label" color={o.on ? 'onInverse' : 'ink'} numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold' }}>
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </Box>
          <DayPicker visible={picking} value={when} max={days[0]} onPick={(d) => { setPicked(d === days[0] ? null : d); setPicking(false); }} onClose={() => setPicking(false)} />
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
