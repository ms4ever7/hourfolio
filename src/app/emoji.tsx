import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, SectionList, TextInput, useWindowDimensions } from 'react-native';
import { Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { EMOJI_GROUPS, emojiInGroup, searchEmoji } from '@/domain/emoji';
import { deletePhoto } from '@/lib/photos';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useOnboardingStore } from '@/store/onboarding-store';
import { useSettingsStore } from '@/store/settings-store';
import { useAppTheme } from '@/theme/theme';

const COLUMNS = 8;
const PAD = 16;
const HEADER = 34;

function rows(list: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < list.length; i += COLUMNS) out.push(list.slice(i, i + COLUMNS));
  return out;
}

/** The whole emoji keyboard, in its groups, with search in the app language. */
export default function EmojiPicker() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const { assetId, draft: draftParam } = useLocalSearchParams<{ assetId?: string; draft?: string }>();
  const draftIndex = draftParam === undefined ? undefined : Number(draftParam);
  const asset = usePortfolioStore((s) => s.assets.find((a) => a.id === assetId));
  const updateAsset = usePortfolioStore((s) => s.updateAsset);
  const draft = useOnboardingStore((s) => (draftIndex === undefined ? undefined : s.drafts[draftIndex]));
  const updateDraft = useOnboardingStore((s) => s.updateDraft);
  const recent = useSettingsStore((s) => s.recentEmoji);
  const addRecent = useSettingsStore((s) => s.addRecentEmoji);
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState(0);
  const listRef = useRef<SectionList<string[]>>(null);
  const cell = Math.floor((width - PAD * 2) / COLUMNS);

  const sections = useMemo(
    () => [
      ...(recent.length ? [{ key: 'recent', title: t('emoji.recent'), data: rows(recent) }] : []),
      ...EMOJI_GROUPS.map((g) => ({ key: g.key, title: t(`emoji.groups.${g.key}`), data: rows(emojiInGroup(g.id)) })),
    ],
    [recent, t],
  );
  const results = useMemo(() => searchEmoji(query, i18n.language), [query, i18n.language]);

  // Every header and row has a known height, so a tab can jump to a section that isn't
  // rendered yet. SectionList counts a header and a footer slot around each section's rows.
  const layout = useMemo(() => {
    const out: { length: number; offset: number }[] = [];
    let offset = 0;
    for (const section of sections) {
      out.push({ length: HEADER, offset });
      offset += HEADER;
      for (let i = 0; i < section.data.length; i++) {
        out.push({ length: cell, offset });
        offset += cell;
      }
      out.push({ length: 0, offset });
    }
    return out;
  }, [sections, cell]);

  const pick = (emoji: string) => {
    const target = asset ?? draft;
    if (target?.face?.kind === 'photo') deletePhoto(target.face.file);
    if (asset) updateAsset(asset.id, { face: { kind: 'emoji', emoji } });
    else if (draftIndex !== undefined) updateDraft(draftIndex, { face: { kind: 'emoji', emoji } });
    addRecent(emoji);
    router.back();
  };

  const face = (asset ?? draft)?.face;
  const selected = face?.kind === 'emoji' ? face.emoji : null;
  const renderRow = (row: string[]) => (
    <Box flexDirection="row" style={{ paddingHorizontal: PAD }}>
      {row.map((e) => (
        <Pressable
          key={e}
          accessibilityRole="button"
          accessibilityLabel={e}
          onPress={() => pick(e)}
          style={({ pressed }) => ({ width: cell, height: cell, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: e === selected ? colors.accentSoft : pressed ? colors.track : 'transparent' })}
        >
          <Text style={{ fontSize: cell * 0.56, lineHeight: cell * 0.8 }} allowFontScaling={false}>
            {e}
          </Text>
        </Pressable>
      ))}
    </Box>
  );

  const jumpTo = (key: string, index: number) => {
    setActiveGroup(index);
    const sectionIndex = sections.findIndex((s) => s.key === key);
    if (sectionIndex < 0) return;
    listRef.current?.scrollToLocation({ sectionIndex, itemIndex: 0, viewOffset: 0, animated: false });
  };

  return (
    <Box flex={1} backgroundColor="ground" style={{ paddingTop: 20 }}>
      <Box paddingHorizontal="m" gap="sm" paddingBottom="s">
        <Text variant="title" style={{ fontSize: 24 }} accessibilityRole="header">
          {t('emoji.title')}
        </Text>
        <Box flexDirection="row" alignItems="center" gap="sm" height={44} paddingHorizontal="sm" backgroundColor="card" borderRadius="m" borderWidth={1} borderColor="border">
          <Glyph d={UI_PATHS.search} size={18} color={colors.muted} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('emoji.search')}
            placeholderTextColor={colors.faint}
            accessibilityLabel={t('emoji.search')}
            autoCorrect={false}
            clearButtonMode="while-editing"
            style={{ flex: 1, fontFamily: 'Inter_400Regular', fontSize: 16, color: colors.ink }}
          />
        </Box>
      </Box>

      {query.trim() ? (
        <FlatList
          data={rows(results)}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => renderRow(item)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <Text variant="caption" style={{ padding: PAD }}>
              {t('emoji.noMatch')}
            </Text>
          }
        />
      ) : (
        <>
          <SectionList
            ref={listRef}
            sections={sections}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => renderRow(item)}
            renderSectionHeader={({ section }) => (
              <Box backgroundColor="ground" justifyContent="flex-end" style={{ height: HEADER, paddingHorizontal: PAD, paddingBottom: 4 }}>
                <Text variant="small" style={{ fontFamily: 'Inter_600SemiBold' }}>
                  {section.title.toLocaleUpperCase()}
                </Text>
              </Box>
            )}
            onViewableItemsChanged={({ viewableItems }) => {
              const key = viewableItems[0]?.section?.key;
              const i = EMOJI_GROUPS.findIndex((g) => g.key === key);
              if (i >= 0) setActiveGroup(i);
            }}
            getItemLayout={(_, index) => ({ ...layout[index], index })}
            initialNumToRender={12}
            stickySectionHeadersEnabled
            keyboardShouldPersistTaps="handled"
          />
          <Box flexDirection="row" justifyContent="space-around" backgroundColor="card" borderTopWidth={1} borderColor="line" style={{ paddingTop: 6, paddingBottom: 28 }}>
            {EMOJI_GROUPS.map((g, i) => (
              <Pressable
                key={g.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: i === activeGroup }}
                accessibilityLabel={t(`emoji.groups.${g.key}`)}
                onPress={() => jumpTo(g.key, i)}
                style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: i === activeGroup ? colors.accentSoft : 'transparent' }}
              >
                <Text style={{ fontSize: 20, lineHeight: 26, opacity: i === activeGroup ? 1 : 0.55 }}>{g.icon}</Text>
              </Pressable>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}
