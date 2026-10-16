import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput } from 'react-native';
import { AssetIcon, Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { BackButton, OnboardingFooter, PrimaryButton, Screen } from '@/components/ui';
import { CATALOG } from '@/domain/catalog';
import type { EnergyType } from '@/domain/types';
import { useOnboardingStore } from '@/store/onboarding-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAppTheme } from '@/theme/theme';

const TILE_GAP = 10;

type Filter = 'all' | Exclude<EnergyType, 'recovery'>;
const FILTERS: Filter[] = ['all', 'body', 'creative', 'mind'];

/** Add more assets after onboarding: presets from the same list, or one of your own. */
export default function AddAsset() {
  const { t } = useTranslation();
  const { colors, palette } = useAppTheme();
  const assets = usePortfolioStore((s) => s.assets);
  const drafts = useOnboardingStore((s) => s.drafts);
  const setDrafts = useOnboardingStore((s) => s.setDrafts);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  /** Three tiles per row: measured, because percentages plus the gaps overflow on narrow phones. */
  const [gridWidth, setGridWidth] = useState(0);
  const tile = gridWidth > 0 ? Math.floor((gridWidth - 2 * TILE_GAP) / 3) : undefined;

  // Starts empty: leftovers from onboarding must not come along. Custom ones added here live in the drafts.
  useEffect(() => setDrafts([]), [setDrafts]);

  const owned = useMemo(() => new Set(assets.flatMap((a) => (a.catalogId ? [a.catalogId] : []))), [assets]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((c) => {
      if (filter !== 'all' && c.energy !== filter) return false;
      if (!q) return true;
      return [t(`catalog.${c.id}`), ...c.keywords].some((w) => w.toLowerCase().includes(q));
    });
  }, [filter, query, t]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const customs = drafts.filter((d) => d.customName);
  const count = selected.length + customs.length;

  const next = () => {
    const picks = selected.flatMap((id) => {
      const c = CATALOG.find((x) => x.id === id);
      if (!c) return [];
      // Coming back from setup: keep what was already set for this pick.
      const kept = drafts.find((d) => d.catalogId === id);
      return kept ? [kept] : [{ catalogId: c.id, icon: c.icon, color: c.color, energy: c.energy, rhythm: c.rhythm, startingMinutes: 0 }];
    });
    setDrafts([...picks, ...customs]);
    router.push({ pathname: '/onboarding/setup', params: { step: '0', mode: 'add' } });
  };

  return (
    <Screen
      footer={
        <OnboardingFooter
          panel
          primary={<PrimaryButton label={t('addAsset.add', { count })} onPress={next} disabled={count === 0} />}
        />
      }
    >
      <Box flexDirection="row" alignItems="center">
        <BackButton onPress={() => router.back()} />
      </Box>

      <Box gap="s">
        <Text variant="title" accessibilityRole="header">
          {t('addAsset.title')}
        </Text>
        <Text variant="body">{t('addAsset.sub')}</Text>
      </Box>

      <Box flexDirection="row" alignItems="center" gap="sm" height={48} paddingHorizontal="sm" backgroundColor="card" borderRadius="m" borderWidth={1} borderColor="border">
        <Glyph d={UI_PATHS.search} size={18} color={colors.muted} strokeWidth={2} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('pick.search')}
          placeholderTextColor={colors.faint}
          accessibilityLabel={t('pick.search')}
          style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15, color: colors.ink }}
        />
      </Box>

      <Box flexDirection="row" flexWrap="wrap" gap="s">
        {FILTERS.map((f) => {
          const on = f === filter;
          return (
            <Pressable
              key={f}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setFilter(f)}
              style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', backgroundColor: on ? colors.inverse : colors.card, borderWidth: 1, borderColor: on ? colors.inverse : colors.border }}
            >
              <Text variant="label" color={on ? 'onInverse' : 'ink'} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                {f === 'all' ? t('pick.all') : t(`energy.${f}`)}
              </Text>
            </Pressable>
          );
        })}
      </Box>

      <Box flexDirection="row" flexWrap="wrap" style={{ gap: TILE_GAP }} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/onboarding/custom', params: { name: query, mode: 'add' } })}
          style={{ width: tile, height: 104, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.dashed, alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Box width={44} height={44} alignItems="center" justifyContent="center" style={{ borderRadius: 14, backgroundColor: colors.track }}>
            <Glyph d={UI_PATHS.plus} size={22} color={colors.ink} strokeWidth={2} />
          </Box>
          <Text variant="small" color="ink" textAlign="center" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {t('pick.custom')}
          </Text>
        </Pressable>
        {customs.map((d) => (
          <Box key={d.customName} height={104} backgroundColor="card" alignItems="center" justifyContent="center" gap="s" style={{ width: tile, borderRadius: 16, borderWidth: 2, borderColor: palette[d.color].main }}>
            <AssetIcon icon={d.icon} color={d.color} size={44} />
            <Text variant="small" color="ink" textAlign="center" numberOfLines={2} style={{ fontFamily: 'Inter_600SemiBold' }}>
              {d.customName}
            </Text>
          </Box>
        ))}
        {items.map((c) => {
          const have = owned.has(c.id);
          const on = selected.includes(c.id);
          const p = palette[c.color];
          return (
            <Pressable
              key={c.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on || have, disabled: have }}
              accessibilityLabel={have ? `${t(`catalog.${c.id}`)}, ${t('addAsset.added')}` : t(`catalog.${c.id}`)}
              disabled={have}
              onPress={() => toggle(c.id)}
              style={{ width: tile, height: 104, borderRadius: 16, backgroundColor: colors.card, borderWidth: on ? 2 : 1, borderColor: on ? p.main : colors.track, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 6, opacity: have ? 0.5 : 1 }}
            >
              <AssetIcon icon={c.icon} color={c.color} size={44} />
              <Text variant="small" color="ink" textAlign="center" numberOfLines={2} style={{ fontFamily: 'Inter_600SemiBold' }}>
                {t(`catalog.${c.id}`)}
              </Text>
              {on || have ? (
                <Box position="absolute" width={20} height={20} borderRadius="pill" alignItems="center" justifyContent="center" style={{ top: 6, right: 6, backgroundColor: have ? colors.muted : p.main }}>
                  <Glyph d={UI_PATHS.check} size={12} color={colors.card} strokeWidth={3.2} />
                </Box>
              ) : null}
            </Pressable>
          );
        })}
      </Box>
      {items.length === 0 ? <Text variant="caption">{t('pick.noMatch')}</Text> : null}
    </Screen>
  );
}
