import { ColorPicker, Host } from '@expo/ui/swift-ui';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { Backdrop } from '@/components/backdrop';
import { Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { BackButton, Card, Group, Hours, Screen, Segmented, SwitchRow, TrendChip } from '@/components/ui';
import { BACKGROUNDS } from '@/domain/backgrounds';
import { parseHex, toHex } from '@/domain/color';
import type { AppIconName } from '@/domain/seasons';
import { canChangeIcon, useAppIcon, useSeason } from '@/lib/appearance';
import { useSettingsStore, type ThemeMode } from '@/store/settings-store';
import { DEFAULT_ACCENT, pageMode, useAppTheme } from '@/theme/theme';

const PRESETS = [DEFAULT_ACCENT, '#6246EA', '#C2388A', '#E4572E', '#E8741C', '#C99A06', '#1F8A5B', '#0F7A63', '#1E96C8', '#4A4F57'];
const MODES: ThemeMode[] = ['system', 'light', 'dark'];
/** Page colors from soft pastels to deep darks; any other one comes from the picker. */
const PAGES = ['#FFFFFF', '#FFF8E7', '#FFEFE5', '#FDEBF3', '#F1ECFF', '#EAF2FF', '#E8F6EF', '#F2F5DC', '#1B2233', '#231B33', '#10231C', '#000000'];

const ICONS: { name: AppIconName | null; key: string; image: number }[] = [
  { name: null, key: 'default', image: require('../../assets/images/app-icons/default.png') },
  { name: 'Pumpkin', key: 'Pumpkin', image: require('../../assets/images/app-icons/pumpkin.png') },
  { name: 'Winter', key: 'Winter', image: require('../../assets/images/app-icons/winter.png') },
];

/** A small portfolio card that shows the accent and mode as they are picked. */
function Preview() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <Card gap="sm">
      <Text variant="label" color="muted">
        {t('appearance.previewLabel')}
      </Text>
      <Box flexDirection="row" alignItems="center" gap="sm">
        <Hours minutes={754} variant="heading" unitSize={14} />
        <TrendChip trend="growing" />
      </Box>
      <Box height={8} borderRadius="pill" backgroundColor="track">
        <Box height={8} borderRadius="pill" backgroundColor="hours" style={{ width: '64%' }} />
      </Box>
      <Box flexDirection="row" gap="s" alignItems="center">
        <Box flex={1} height={44} borderRadius="m" backgroundColor="accent" flexDirection="row" alignItems="center" justifyContent="center" gap="s">
          <Glyph d={UI_PATHS.plus} size={18} color={colors.onAccent} strokeWidth={2.2} />
          <Text variant="bodyStrong" color="onAccent">
            {t('appearance.previewButton')}
          </Text>
        </Box>
        <Box height={44} paddingHorizontal="m" borderRadius="m" backgroundColor="accentSoft" alignItems="center" justifyContent="center">
          <Text variant="bodyStrong" color="accentInk">
            {t('tabs.analytics')}
          </Text>
        </Box>
      </Box>
    </Card>
  );
}

export default function Appearance() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { mode } = useAppTheme();
  const season = useSeason();
  const s = useSettingsStore();
  const [icon, setIcon] = useAppIcon();
  const accent = toHex(parseHex(s.accent));
  const custom = !PRESETS.includes(accent);

  return (
    <Screen>
      <Box flexDirection="row" alignItems="center" gap="sm">
        <BackButton onPress={() => router.back()} />
        <Text variant="title" style={{ fontSize: 24 }} accessibilityRole="header">
          {t('appearance.title')}
        </Text>
      </Box>

      <Preview />

      <Box gap="s">
        <Text variant="bodyStrong">{t('appearance.mode')}</Text>
        <Box style={{ opacity: s.pageColor ? 0.5 : 1 }} pointerEvents={s.pageColor ? 'none' : 'auto'}>
          <Segmented label={t('appearance.mode')} value={s.themeMode} onChange={s.setThemeMode} options={MODES.map((m) => ({ value: m, label: t(`appearance.${m}`) }))} />
        </Box>
        {s.pageColor ? <Text variant="small">{t('appearance.modeFromPage')}</Text> : null}
      </Box>

      <Box gap="sm">
        <Text variant="bodyStrong">{t('appearance.page')}</Text>
        <Box flexDirection="row" flexWrap="wrap" gap="s" accessibilityRole="radiogroup" accessibilityLabel={t('appearance.page')}>
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: !s.pageColor }}
            accessibilityLabel={t('appearance.pageDefault')}
            onPress={() => s.setPageColor(null)}
            style={{ height: 44, paddingHorizontal: 14, borderRadius: 22, justifyContent: 'center', backgroundColor: !s.pageColor ? colors.inverse : colors.card, borderWidth: 1, borderColor: !s.pageColor ? colors.inverse : colors.border }}
          >
            <Text variant="label" color={!s.pageColor ? 'onInverse' : 'ink'} style={{ fontFamily: 'Onest_600SemiBold', fontSize: 13 }}>
              {t('appearance.pageDefault')}
            </Text>
          </Pressable>
          {PAGES.map((c) => {
            const on = s.pageColor === c;
            return (
              <Pressable
                key={c}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={c}
                onPress={() => s.setPageColor(c)}
                style={{ width: 44, height: 44, borderRadius: 22, borderWidth: on ? 2 : 1, borderColor: on ? colors.ink : colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: c }}
              >
                {on ? <Glyph d={UI_PATHS.check} size={16} color={pageMode(c) === 'dark' ? '#FFFFFF' : '#15171A'} strokeWidth={3} /> : null}
              </Pressable>
            );
          })}
        </Box>
        <Box flexDirection="row" alignItems="center" gap="sm" backgroundColor="card" borderRadius="l" paddingVertical="sm" paddingHorizontal="m" style={{ borderWidth: s.pageColor && !PAGES.includes(s.pageColor) ? 2 : 0, borderColor: colors.ink }}>
          <Box flex={1} gap="xs">
            <Text variant="bodyStrong">{t('appearance.anyColor')}</Text>
            <Text variant="small">{t('appearance.pageNote')}</Text>
          </Box>
          <Host matchContents colorScheme={mode}>
            <ColorPicker selection={s.pageColor ?? colors.ground} onSelectionChange={(c) => s.setPageColor(toHex(parseHex(c)))} />
          </Host>
        </Box>
      </Box>

      <Box gap="sm">
        <Text variant="bodyStrong">{t('appearance.accent')}</Text>
        <Box flexDirection="row" flexWrap="wrap" gap="s" accessibilityRole="radiogroup" accessibilityLabel={t('appearance.accent')}>
          {PRESETS.map((c) => {
            const on = c === accent;
            return (
              <Pressable
                key={c}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={c}
                onPress={() => s.setAccent(c)}
                style={{ width: 44, height: 44, borderRadius: 22, borderWidth: on ? 2 : 0, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}
              >
                <Box width={34} height={34} borderRadius="pill" alignItems="center" justifyContent="center" style={{ backgroundColor: c }}>
                  {on ? <Glyph d={UI_PATHS.check} size={16} color="#FFFFFF" strokeWidth={3} /> : null}
                </Box>
              </Pressable>
            );
          })}
        </Box>
        <Box flexDirection="row" alignItems="center" gap="sm" backgroundColor="card" borderRadius="l" paddingVertical="sm" paddingHorizontal="m" style={{ borderWidth: custom ? 2 : 0, borderColor: colors.ink }}>
          <Box flex={1} gap="xs">
            <Text variant="bodyStrong">{t('appearance.anyColor')}</Text>
            <Text variant="small">{t('appearance.anyColorSub')}</Text>
          </Box>
          <Host matchContents colorScheme={mode}>
            <ColorPicker selection={accent} onSelectionChange={(c) => s.setAccent(toHex(parseHex(c)))} />
          </Host>
        </Box>
        <Text variant="small">{season && s.seasonal ? t('appearance.seasonalNow', { season: t(`seasons.${season.id}`) }) : t('appearance.accentNote')}</Text>
      </Box>

      <Box gap="sm">
        <Text variant="bodyStrong">{t('appearance.background')}</Text>
        <Box flexDirection="row" flexWrap="wrap" style={{ gap: 10 }} accessibilityRole="radiogroup" accessibilityLabel={t('appearance.background')}>
          {BACKGROUNDS.map((b) => {
            const on = b === s.background;
            return (
              <Pressable
                key={b}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={t(`backgrounds.${b}`)}
                onPress={() => s.setBackground(b)}
                style={{ width: '22.8%', gap: 6, alignItems: 'center' }}
              >
                <Box width="100%" height={96} borderRadius="m" overflow="hidden" backgroundColor="ground" style={{ borderWidth: on ? 2 : 1, borderColor: on ? colors.ink : colors.border }}>
                  <Backdrop id={b} width={80} height={96} />
                  <Box position="absolute" backgroundColor="card" borderRadius="s" style={{ left: 8, right: 8, top: 40, height: 18 }} />
                  <Box position="absolute" backgroundColor="accent" borderRadius="s" style={{ left: 8, width: 30, bottom: 10, height: 10 }} />
                </Box>
                <Text variant="tiny" color={on ? 'ink' : 'muted'} numberOfLines={1}>
                  {t(`backgrounds.${b}`)}
                </Text>
              </Pressable>
            );
          })}
        </Box>
      </Box>

      <Group>
        <SwitchRow title={t('appearance.seasonal')} sub={t('appearance.seasonalSub')} value={s.seasonal} onChange={s.setSeasonal} last />
      </Group>

      <Box gap="sm">
        <Text variant="bodyStrong">{t('appearance.icon')}</Text>
        {canChangeIcon ? (
          <>
            <Box flexDirection="row" gap="sm" accessibilityRole="radiogroup" accessibilityLabel={t('appearance.icon')}>
              {ICONS.map((i) => {
                const on = icon === i.name;
                return (
                  <Pressable
                    key={i.key}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={t(`appIcons.${i.key}`)}
                    onPress={() => void setIcon(i.name)}
                    style={{ flex: 1, alignItems: 'center', gap: 8, paddingVertical: 12, borderRadius: 16, backgroundColor: colors.card, borderWidth: on ? 2 : 1, borderColor: on ? colors.ink : colors.border }}
                  >
                    <Image source={i.image} style={{ width: 60, height: 60, borderRadius: 14 }} accessibilityIgnoresInvertColors />
                    <Text variant="small" color="ink" style={{ fontFamily: 'Onest_600SemiBold' }}>
                      {t(`appIcons.${i.key}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </Box>
            <Group>
              <SwitchRow title={t('appearance.autoIcon')} sub={t('appearance.autoIconSub')} value={s.autoSeasonIcon} onChange={s.setAutoSeasonIcon} last />
            </Group>
          </>
        ) : (
          <Text variant="small">{t('appearance.iconUnsupported')}</Text>
        )}
      </Box>
    </Screen>
  );
}
