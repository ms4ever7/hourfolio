import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FacePicker, ColorPicker } from '@/components/face-picker';
import { AssetIcon, UI_PATHS } from '@/components/icons';
import { GoalScene, ScenePicker } from '@/components/scenes';
import { Box, Text } from '@/components/primitives';
import { BackButton, Card, Duration, LanguageButton, OptionButton, PrimaryButton, RoundButton, Screen, Segmented, TextButton } from '@/components/ui';
import { parseStartingMinutes } from '@/domain/capital';
import { ENERGY_TYPES, RHYTHMS, type AssetFace } from '@/domain/types';
import { useSeason } from '@/lib/appearance';
import { useAssetName } from '@/lib/labels';
import { deletePhoto } from '@/lib/photos';
import { useSettingsStore } from '@/store/settings-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useAppTheme } from '@/theme/theme';

const CAPITAL_HOURS = [0, 50, 200, 500];
const GOAL_STEP = 30;
const GOAL_MAX = 40 * 60;

export default function Setup() {
  const { t } = useTranslation();
  const { colors, palette } = useAppTheme();
  const insets = useSafeAreaInsets();
  const assetName = useAssetName();
  const step = Number(useLocalSearchParams<{ step: string }>().step ?? 0);
  const drafts = useOnboardingStore((s) => s.drafts);
  const updateDraft = useOnboardingStore((s) => s.updateDraft);
  const draft = drafts[step];
  const scene = useSettingsStore((s) => s.goalScene);
  const season = useSeason();

  const capitalFor = (minutes: number | undefined) => (minutes ? String(Math.round((minutes / 60) * 100) / 100) : '');
  const [capitalText, setCapitalText] = useState(capitalFor(draft?.startingMinutes));
  const onCapitalText = (text: string) => {
    setCapitalText(text);
    const minutes = text.trim() === '' ? 0 : parseStartingMinutes(text);
    if (minutes !== null) updateDraft(step, { startingMinutes: minutes });
  };

  // An input the parser rejects ("1.2.3") must not linger as if it were saved.
  const onCapitalBlur = () => setCapitalText(capitalFor(useOnboardingStore.getState().drafts[step]?.startingMinutes));

  const finish = () => router.push('/onboarding/day');

  if (!draft) return null;
  const isLast = step >= drafts.length - 1;
  const goalMinutes = draft.weeklyGoalMinutes ?? 0;
  const setFace = (face: AssetFace | undefined) => {
    const old = draft.face;
    if (old?.kind === 'photo' && (face?.kind !== 'photo' || face.file !== old.file)) deletePhoto(old.file);
    updateDraft(step, { face });
  };
  const setGoal = (minutes: number) => updateDraft(step, { weeklyGoalMinutes: minutes > 0 ? minutes : undefined });

  return (
    <Screen
      footer={
        <Box paddingHorizontal="l" gap="xs" style={{ paddingBottom: insets.bottom + 8 }}>
          <PrimaryButton
            label={isLast ? t('common.continue') : t('setup.next', { name: assetName(drafts[step + 1]) })}
            icon={UI_PATHS.arrowRight}
            onPress={() => (isLast ? finish() : router.push({ pathname: '/onboarding/setup', params: { step: String(step + 1) } }))}
          />
          {!isLast ? <TextButton label={t('setup.later')} onPress={finish} /> : null}
        </Box>
      }
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap="s">
        <BackButton onPress={() => router.back()} />
        <Box flex={1} alignItems="center" gap="xs">
          <Text variant="small">{t('setup.step', { current: step + 1, total: drafts.length })}</Text>
          <Box flexDirection="row" gap="xs">
            {drafts.map((d, i) => (
              <Box key={i} width={Math.max(6, Math.min(14, 160 / drafts.length))} height={4} borderRadius="pill" style={{ backgroundColor: i <= step ? colors.accent : colors.dashed }} />
            ))}
          </Box>
        </Box>
        <LanguageButton />
      </Box>

      <Box flexDirection="row" alignItems="center" gap="m">
        <AssetIcon icon={draft.icon} color={draft.color} face={draft.face} size={76} />
        <Box flex={1} gap="xs">
          <Text variant="title" accessibilityRole="header">
            {assetName(draft)}
          </Text>
          <Text variant="label" color="body">
            {t('setup.tagline')}
          </Text>
        </Box>
      </Box>

      <FacePicker
        icon={draft.icon}
        color={draft.color}
        face={draft.face}
        emojiParams={{ draft: String(step) }}
        onIcon={(icon) => updateDraft(step, { icon })}
        onFace={setFace}
      />

      <Box gap="s">
        <Text variant="bodyStrong">{t('setup.color')}</Text>
        <ColorPicker label={t('setup.color')} value={draft.color} onChange={(color) => updateDraft(step, { color })} />
      </Box>

      <Box gap="s">
        <Text variant="bodyStrong">{t('setup.energy')}</Text>
        <Segmented
          label={t('setup.energy')}
          value={draft.energy}
          onChange={(energy) => updateDraft(step, { energy })}
          options={ENERGY_TYPES.map((e) => ({ value: e, label: t(`energy.${e}`) }))}
        />
      </Box>

      <Box gap="s">
        <Text variant="bodyStrong">{t('setup.rhythm')}</Text>
        <Box gap="s" accessibilityRole="radiogroup" accessibilityLabel={t('setup.rhythm')}>
          {RHYTHMS.map((r) => (
            <OptionButton key={r} selected={draft.rhythm === r} onPress={() => updateDraft(step, { rhythm: r })} style={{ alignItems: 'flex-start' }}>
              <Text variant="label" style={{ fontFamily: 'Inter_600SemiBold' }}>
                {t(`rhythm.${r}`)}
              </Text>
              <Text variant="small">{t(`setup.rhythmHint.${r}`)}</Text>
            </OptionButton>
          ))}
        </Box>
        <Text variant="small" style={{ lineHeight: 17 }}>
          {t('setup.rhythmNote')}
        </Text>
      </Box>

      <Card gap="sm">
        <Text variant="bodyStrong">{t('setup.capital')}</Text>
        <Text variant="label" color="body">
          {t('setup.capitalQ')}
        </Text>
        <Box flexDirection="row" flexWrap="wrap" gap="s" accessibilityRole="radiogroup" accessibilityLabel={t('setup.capital')}>
          {CAPITAL_HOURS.map((h, i) => {
            const on = draft.startingMinutes === h * 60;
            return (
              <Pressable
                key={h}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => {
                  setCapitalText(h > 0 ? String(h) : '');
                  updateDraft(step, { startingMinutes: h * 60 });
                }}
                style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, justifyContent: 'center', backgroundColor: on ? colors.inverse : colors.card, borderWidth: 1, borderColor: on ? colors.inverse : colors.border }}
              >
                <Text variant="label" color={on ? 'onInverse' : 'ink'} style={{ fontFamily: 'Inter_600SemiBold' }}>
                  {h === 0 ? t('setup.justStarting') : `${i === CAPITAL_HOURS.length - 1 ? `${h}+` : `~${h}`}`}
                  {h > 0 ? (
                    <Text variant="small" style={{ color: on ? colors.hoursOnInverse : colors.hours, fontFamily: 'Inter_600SemiBold' }}>
                      {' '}
                      {t('units.h')}
                    </Text>
                  ) : null}
                </Text>
              </Pressable>
            );
          })}
        </Box>
        <Box flexDirection="row" alignItems="center" gap="s">
          <TextInput
            value={capitalText}
            onChangeText={onCapitalText}
            keyboardType="decimal-pad"
            placeholder={t('setup.capitalCustom')}
            placeholderTextColor={colors.faint}
            maxLength={8}
            onBlur={onCapitalBlur}
            accessibilityLabel={t('setup.capitalCustom')}
            style={{ flex: 1, height: 44, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.ink }}
          />
          <Text variant="label" color="hours" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {t('units.h')}
          </Text>
        </Box>
        <Text variant="small">{t('setup.capitalNote')}</Text>
      </Card>

      <Box flexDirection="row" alignItems="center" gap="sm" backgroundColor="card" borderRadius="l" paddingVertical="sm" paddingHorizontal="ml">
        <Box flex={1} gap="xs">
          <Text variant="bodyStrong">{t('setup.goal')}</Text>
          <Text variant="small">{t('setup.goalOptional')}</Text>
        </Box>
        <RoundButton accessibilityLabel={t('common.less')} onPress={() => setGoal(Math.max(0, goalMinutes - GOAL_STEP))} style={{ paddingHorizontal: 0 }}>
          <Text variant="heading">−</Text>
        </RoundButton>
        <Box minWidth={64} alignItems="center">
          {goalMinutes === 0 ? (
            <Text variant="label" color="muted">
              {t('setup.goalOff')}
            </Text>
          ) : (
            <Duration minutes={goalMinutes} size={18} />
          )}
        </Box>
        <RoundButton accessibilityLabel={t('common.more')} onPress={() => setGoal(Math.min(GOAL_MAX, goalMinutes + GOAL_STEP))} style={{ paddingHorizontal: 0 }}>
          <Text variant="heading">+</Text>
        </RoundButton>
      </Box>

      {goalMinutes > 0 ? (
        <Card gap="sm">
          <Box gap="xs">
            <Text variant="bodyStrong">{t('setup.sceneTitle')}</Text>
            <Text variant="small">{t('setup.sceneSub')}</Text>
          </Box>
          <GoalScene scene={scene} progress={0.6} color={palette[draft.color].main} tint={palette[draft.color].tint} season={season?.id ?? null} height={48} />
          <ScenePicker />
        </Card>
      ) : null}
    </Screen>
  );
}
