import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput } from 'react-native';
import { AssetIcon, Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { BackButton, LanguageButton, OnboardingFooter, PrimaryButton, Screen } from '@/components/ui';
import { CATALOG, type CatalogItem } from '@/domain/catalog';
import type { EnergyType } from '@/domain/types';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useAppTheme } from '@/theme/theme';

type Filter = 'all' | Exclude<EnergyType, 'recovery'>;
const FILTERS: Filter[] = ['all', 'body', 'creative', 'mind'];

export default function Pick() {
  const { t } = useTranslation();
  const { colors, palette } = useAppTheme();
  const drafts = useOnboardingStore((s) => s.drafts);
  const setDrafts = useOnboardingStore((s) => s.setDrafts);
  const [selected, setSelected] = useState<string[]>(() =>
    drafts.flatMap((d) => (d.catalogId ? [d.catalogId] : [])),
  );
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CATALOG.filter((c) => {
      if (filter !== 'all' && c.energy !== filter) return false;
      if (!q) return true;
      return [t(`catalog.${c.id}`), ...c.keywords].some((w) => w.toLowerCase().includes(q));
    });
  }, [filter, query, t]);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const next = () => {
    const customs = drafts.filter((d) => d.customName);
    const picks = selected
      .map((id) => CATALOG.find((c) => c.id === id))
      .filter((c): c is CatalogItem => Boolean(c))
      .map((c) => ({ catalogId: c.id, icon: c.icon, color: c.color, energy: c.energy, rhythm: c.rhythm, startingMinutes: 0 }));
    setDrafts([...picks, ...customs]);
    router.push({ pathname: '/onboarding/setup', params: { step: '0' } });
  };

  const count = selected.length + drafts.filter((d) => d.customName).length;

  return (
    <Screen
      footer={
        <OnboardingFooter
          panel
          primary={<PrimaryButton label={t('common.continue')} onPress={next} disabled={count === 0} />}
          above={
            <Text variant="label" color="body">
              {t('pick.selected', { count })}
            </Text>
          }
        />
      }
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
        <BackButton onPress={() => router.back()} />
        <Box alignItems="center" gap="xs">
          <Text variant="small">{t('pick.step')}</Text>
          <Box flexDirection="row" gap="xs">
            <Box width={40} height={4} borderRadius="pill" backgroundColor="accent" />
            <Box width={40} height={4} borderRadius="pill" backgroundColor="dashed" />
          </Box>
        </Box>
        <LanguageButton />
      </Box>

      <Box gap="s">
        <Text variant="title" accessibilityRole="header">
          {t('pick.title')}
        </Text>
        <Text variant="body">{t('pick.sub')}</Text>
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
              style={{
                height: 36,
                paddingHorizontal: 14,
                borderRadius: 18,
                justifyContent: 'center',
                backgroundColor: on ? colors.inverse : colors.card,
                borderWidth: 1,
                borderColor: on ? colors.inverse : colors.border,
              }}
            >
              <Text variant="label" color={on ? 'onInverse' : 'ink'} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                {f === 'all' ? t('pick.all') : t(`energy.${f}`)}
              </Text>
            </Pressable>
          );
        })}
      </Box>

      <Box flexDirection="row" alignItems="center" gap="sm" padding="sm" borderRadius="l" style={{ backgroundColor: palette.sky.tint }}>
        <Box backgroundColor="card" style={{ borderRadius: 12 }}>
          <AssetIcon icon="moon" color="sky" size={40} />
        </Box>
        <Box flex={1} gap="xs">
          <Text variant="label" style={{ fontFamily: 'Inter_600SemiBold', color: colors.restInk }}>
            {t('pick.recoveryTitle')}
          </Text>
          <Text variant="small" style={{ color: colors.restSub }}>
            {t('pick.recoverySub')}
          </Text>
        </Box>
      </Box>

      <Box flexDirection="row" flexWrap="wrap" style={{ gap: 10 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/onboarding/custom', params: { name: query } })}
          style={{ width: '31.4%', height: 104, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.dashed, alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Box width={44} height={44} alignItems="center" justifyContent="center" style={{ borderRadius: 14, backgroundColor: colors.track }}>
            <Glyph d={UI_PATHS.plus} size={22} color={colors.ink} strokeWidth={2} />
          </Box>
          <Text variant="small" color="ink" textAlign="center" style={{ fontFamily: 'Inter_600SemiBold' }}>
            {t('pick.custom')}
          </Text>
        </Pressable>
        {drafts
          .filter((d) => d.customName)
          .map((d) => (
            <Box key={d.customName} width="31.4%" height={104} backgroundColor="card" alignItems="center" justifyContent="center" gap="s" style={{ borderRadius: 16, borderWidth: 2, borderColor: palette[d.color].main }}>
              <AssetIcon icon={d.icon} color={d.color} size={44} />
              <Text variant="small" color="ink" textAlign="center" numberOfLines={2} style={{ fontFamily: 'Inter_600SemiBold' }}>
                {d.customName}
              </Text>
            </Box>
          ))}
        {items.map((c) => {
          const on = selected.includes(c.id);
          const p = palette[c.color];
          return (
            <Pressable
              key={c.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={t(`catalog.${c.id}`)}
              onPress={() => toggle(c.id)}
              style={{
                width: '31.4%',
                height: 104,
                borderRadius: 16,
                backgroundColor: colors.card,
                borderWidth: on ? 2 : 1,
                borderColor: on ? p.main : colors.track,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingHorizontal: 6,
              }}
            >
              <AssetIcon icon={c.icon} color={c.color} size={44} />
              <Text variant="small" color="ink" textAlign="center" numberOfLines={2} style={{ fontFamily: 'Inter_600SemiBold' }}>
                {t(`catalog.${c.id}`)}
              </Text>
              {on ? (
                <Box position="absolute" width={20} height={20} borderRadius="pill" alignItems="center" justifyContent="center" style={{ top: 6, right: 6, backgroundColor: p.main }}>
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
