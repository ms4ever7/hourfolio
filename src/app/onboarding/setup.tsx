import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssetIcon, UI_PATHS } from '@/components/icons';
import { GoalScene, ScenePicker } from '@/components/scenes';
import { Box, Text } from '@/components/primitives';
import { BackButton, Card, LanguageButton, OptionButton, PrimaryButton, RoundButton, Screen, Segmented, TextButton } from '@/components/ui';
import { ENERGY_TYPES, RHYTHMS } from '@/domain/types';
import { useSeason } from '@/lib/appearance';
import { useAssetName } from '@/lib/labels';
import { useSettingsStore } from '@/store/settings-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { PALETTE_KEYS, useAppTheme } from '@/theme/theme';

const CAPITAL_HOURS = [0, 50, 200, 500];

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

  const finish = () => router.push('/onboarding/day');

  if (!draft) return null;
  const isLast = step >= drafts.length - 1;
  const goalHours = Math.round((draft.weeklyGoalMinutes ?? 0) / 60);
  const setGoal = (h: number) => updateDraft(step, { weeklyGoalMinutes: h > 0 ? h * 60 : undefined });

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
        <AssetIcon icon={draft.icon} color={draft.color} size={76} />
        <Box flex={1} gap="xs">
          <Text variant="title" accessibilityRole="header">
            {assetName(draft)}
          </Text>
          <Text variant="label" color="body">
            {t('setup.tagline')}
          </Text>
        </Box>
      </Box>

      <Box gap="s">
        <Text variant="bodyStrong">{t('setup.color')}</Text>
        <Box flexDirection="row" gap="s" flexWrap="wrap" accessibilityRole="radiogroup" accessibilityLabel={t('setup.color')}>
          {PALETTE_KEYS.map((key) => {
            const on = key === draft.color;
            return (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={t(`palette.${key}`)}
                onPress={() => updateDraft(step, { color: key })}
                style={{ width: 40, height: 40, borderRadius: 20, borderWidth: on ? 2 : 1, borderColor: on ? colors.ink : colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card }}
              >
                <Box width={28} height={28} borderRadius="pill" style={{ backgroundColor: palette[key].main }} />
              </Pressable>
            );
          })}
        </Box>
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
        <Box flexDirection="row" flexWrap="wrap" gap="s" accessibilityRole="radiogroup" accessibilityLabel={t('setup.rhythm')}>
          {RHYTHMS.map((r) => (
            <OptionButton key={r} selected={draft.rhythm === r} onPress={() => updateDraft(step, { rhythm: r })} style={{ width: '48.5%' }}>
              <Text variant="label">{t(`rhythm.${r}`)}</Text>
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
                onPress={() => updateDraft(step, { startingMinutes: h * 60 })}
                style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, justifyContent: 'center', backgroundColor: on ? colors.inverse : colors.card, borderWidth: 1, borderColor: on ? colors.inverse : colors.border }}
              >
                <Text variant="label" color={on ? 'onInverse' : 'ink'} style={{ fontFamily: 'Onest_600SemiBold' }}>
                  {h === 0 ? t('setup.justStarting') : `${i === CAPITAL_HOURS.length - 1 ? `${h}+` : `~${h}`}`}
                  {h > 0 ? (
                    <Text variant="small" style={{ color: on ? colors.hoursOnInverse : colors.hours, fontFamily: 'Onest_600SemiBold' }}>
                      {' '}
                      {t('units.h')}
                    </Text>
                  ) : null}
                </Text>
              </Pressable>
            );
          })}
        </Box>
        <Text variant="small">{t('setup.capitalNote')}</Text>
      </Card>

      <Box flexDirection="row" alignItems="center" gap="sm" backgroundColor="card" borderRadius="l" paddingVertical="sm" paddingHorizontal="ml">
        <Box flex={1} gap="xs">
          <Text variant="bodyStrong">{t('setup.goal')}</Text>
          <Text variant="small">{t('setup.goalOptional')}</Text>
        </Box>
        <RoundButton accessibilityLabel={t('common.less')} onPress={() => setGoal(Math.max(0, goalHours - 1))} style={{ paddingHorizontal: 0 }}>
          <Text variant="heading">−</Text>
        </RoundButton>
        <Box minWidth={64} alignItems="center">
          {goalHours === 0 ? (
            <Text variant="label" color="muted">
              {t('setup.goalOff')}
            </Text>
          ) : (
            <Text variant="mono" style={{ fontSize: 18 }}>
              {goalHours}
              <Text variant="small" color="hours" style={{ fontFamily: 'Onest_600SemiBold' }}>
                {' '}
                {t('units.h')}
              </Text>
            </Text>
          )}
        </Box>
        <RoundButton accessibilityLabel={t('common.more')} onPress={() => setGoal(Math.min(40, goalHours + 1))} style={{ paddingHorizontal: 0 }}>
          <Text variant="heading">+</Text>
        </RoundButton>
      </Box>

      {goalHours > 0 ? (
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
