import { useScrollToTop } from 'expo-router';
import { useId, useRef, useState, type ReactNode } from 'react';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Pressable, ScrollView, Switch, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { durationParts, formatHours } from '@/domain/format';
import type { Trend } from '@/domain/growth';
import { APP_LANGUAGES, LANGUAGE_BADGE } from '@/i18n/resources';
import { useSettingsStore } from '@/store/settings-store';
import { useAppTheme, type ThemeColor } from '@/theme/theme';
import { Backdrop } from './backdrop';
import { Glyph, UI_PATHS } from './icons';
import { Box, Text } from './primitives';

/** `scrollHint` fades the content out above the footer while there is more below the fold, and flashes the scroll bar once. */
export function Screen({ children, footer, scroll = true, scrollHint }: { children: ReactNode; footer?: ReactNode; scroll?: boolean; scrollHint?: boolean }) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [more, setMore] = useState(false);
  const flashed = useRef(false);
  const metrics = useRef({ offset: 0, content: 0, view: 0 });
  // Tapping the focused tab again scrolls back to the top.
  useScrollToTop(scrollRef);
  const flashIfMore = () => {
    const { offset, content, view } = metrics.current;
    const overflowing = content - view - offset > 48;
    setMore(overflowing);
    if (overflowing && scrollHint && !flashed.current && view > 0) {
      flashed.current = true;
      scrollRef.current?.flashScrollIndicators();
    }
  };
  const content = (
    <Box paddingHorizontal="l" gap="l" style={{ paddingTop: insets.top + 12, paddingBottom: footer ? 24 : insets.bottom + 32 }}>
      {children}
    </Box>
  );
  return (
    <Box flex={1} backgroundColor="ground">
      <Backdrop />
      {scroll ? (
        <Box flex={1}>
          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            scrollEventThrottle={32}
            onScroll={
              scrollHint
                ? (e) => {
                    metrics.current.offset = e.nativeEvent.contentOffset.y;
                    flashIfMore();
                  }
                : undefined
            }
            onContentSizeChange={
              scrollHint
                ? (_w, h) => {
                    metrics.current.content = h;
                    flashIfMore();
                  }
                : undefined
            }
            onLayout={
              scrollHint
                ? (e) => {
                    metrics.current.view = e.nativeEvent.layout.height;
                    flashIfMore();
                  }
                : undefined
            }
          >
            {content}
          </ScrollView>
          {scrollHint && more ? <ScrollFade color={colors.ground} /> : null}
        </Box>
      ) : (
        content
      )}
      {/* Keeps scrolled content from running under the status bar; the backdrop shows through it unchanged. */}
      <Box position="absolute" backgroundColor="ground" overflow="hidden" style={{ top: 0, left: 0, right: 0, height: insets.top }}>
        <Backdrop />
      </Box>
      {footer}
    </Box>
  );
}

function ScrollFade({ color }: { color: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <Box position="absolute" pointerEvents="none" style={{ left: 0, right: 0, bottom: 0, height: 36 }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0} />
            <Stop offset="0.5" stopColor={color} stopOpacity={0.55} />
            <Stop offset="1" stopColor={color} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </Box>
  );
}

export function Card({ children, gap = 'm', style }: { children: ReactNode; gap?: 'xs' | 's' | 'sm' | 'm'; style?: StyleProp<ViewStyle> }) {
  return (
    <Box backgroundColor="card" borderRadius="xl" padding="ml" gap={gap} style={style}>
      {children}
    </Box>
  );
}

/** A number of hours with a quiet unit: "114.5 h". */
export function Hours({
  minutes,
  variant = 'bodyStrong',
  unitSize = 12,
  color = 'ink',
  unitColor = 'muted',
}: {
  minutes: number;
  variant?: 'display' | 'mono' | 'bodyStrong' | 'heading';
  unitSize?: number;
  color?: ThemeColor;
  unitColor?: ThemeColor;
}) {
  const { t, i18n } = useTranslation();
  const big = variant === 'display';
  return (
    <Text variant={variant} color={color}>
      {formatHours(minutes, i18n.language)}
      <Text variant="bodyStrong" color={unitColor} style={{ fontSize: big ? 24 : unitSize }}>
        {' '}
        {t('units.h')}
      </Text>
    </Text>
  );
}

/**
 * "1 h 35 m". Hours stay ink and minutes carry the color (the accent unless `highlight` says
 * otherwise, such as an asset's color). At large sizes the hours unit steps back to grey.
 * `quiet` greys the whole thing, for the goal next to the progress.
 */
export function Duration({ minutes, size = 15, prefix = '', highlight = 'accentInk', quiet }: { minutes: number; size?: number; prefix?: string; highlight?: string; quiet?: boolean }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const big = size >= 24;
  const text = { fontFamily: 'Inter_600SemiBold', fontSize: size, lineHeight: Math.round(size * 1.25), letterSpacing: big ? -1 : 0 };
  const unit = { fontFamily: 'Inter_600SemiBold', fontSize: big ? size * 0.6 : size };
  return (
    <Text variant="bodyStrong" style={{ ...text, color: quiet ? colors.muted : colors.ink }}>
      {prefix}
      {durationParts(minutes).map((p, i) => {
        const minutesPart = p.unit === 'm';
        const color = quiet ? colors.muted : minutesPart ? (highlight in colors ? colors[highlight as ThemeColor] : highlight) : colors.ink;
        return (
          <Text key={p.unit} style={{ ...text, color }}>
            {i > 0 ? ' ' : ''}
            {p.value}
            <Text style={{ ...unit, color: big && !minutesPart && !quiet ? colors.muted : color }}>
              {big ? ' ' : ''}
              {t(`units.${p.unit}`)}
            </Text>
          </Text>
        );
      })}
    </Text>
  );
}

interface PressProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function RoundButton({ children, style, ...rest }: PressProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={4}
      style={({ pressed }) => [
        {
          minWidth: 44,
          height: 44,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6,
          paddingHorizontal: 12,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <RoundButton onPress={onPress} accessibilityLabel={t('common.back')} style={{ paddingHorizontal: 0 }}>
      <Glyph d={UI_PATHS.back} color={colors.ink} strokeWidth={2} />
    </RoundButton>
  );
}

/** Cycles EN → UA → PL. The choice is saved and applies app-wide. */
export function LanguageButton() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const next = APP_LANGUAGES[(APP_LANGUAGES.indexOf(language) + 1) % APP_LANGUAGES.length];
  return (
    <RoundButton onPress={() => setLanguage(next)} accessibilityLabel={t('common.changeLanguage')}>
      <Glyph d={UI_PATHS.globe} size={16} color={colors.ink} />
      <Text variant="label" style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
        {LANGUAGE_BADGE[language]}
      </Text>
    </RoundButton>
  );
}

export function PrimaryButton({ label, onPress, dark, disabled, icon }: { label: string; onPress: () => void; dark?: boolean; disabled?: boolean; icon?: string }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 16,
        backgroundColor: dark ? colors.inverse : colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 24,
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
      })}
    >
      {icon ? <Glyph d={icon} size={20} color={dark ? colors.onInverse : colors.onAccent} strokeWidth={2.2} /> : null}
      <Text variant="bodyStrong" color={dark ? 'onInverse' : 'onAccent'} style={{ fontSize: 16 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Text variant="label" color="body">
        {label}
      </Text>
    </Pressable>
  );
}

/** A roomy action button, filling its row or sharing it: `soft` for what changes things in place, `outline` for what opens an editor. */
export function ActionButton({ label, icon, tone, onPress }: { label: string; icon: string; tone: 'soft' | 'outline'; onPress: () => void }) {
  const { colors } = useAppTheme();
  const soft = tone === 'soft';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, height: 46, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 8, backgroundColor: soft ? colors.accentSoft : colors.ground, borderWidth: 1, borderColor: soft ? colors.accentSoft : colors.border, opacity: pressed ? 0.75 : 1 })}
    >
      <Glyph d={icon} size={16} color={soft ? colors.accentInk : colors.ink} strokeWidth={2} />
      <Text variant="label" numberOfLines={1} color={soft ? 'accentInk' : 'ink'} style={{ fontFamily: 'Inter_600SemiBold', flexShrink: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** A selectable option: dark outline when chosen. */
export function OptionButton({
  selected,
  onPress,
  children,
  role = 'radio',
  style,
  accessibilityLabel,
}: {
  selected: boolean;
  onPress: () => void;
  children: ReactNode;
  role?: 'radio' | 'checkbox';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 52,
          borderRadius: 14,
          backgroundColor: colors.card,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? colors.ink : colors.border,
          paddingHorizontal: selected ? 11 : 12,
          paddingVertical: 8,
          justifyContent: 'center',
          opacity: pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Box flexDirection="row" backgroundColor="track" padding="xs" gap="xs" style={{ borderRadius: 14 }} accessibilityLabel={label} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: on ? colors.card : 'transparent',
              boxShadow: on ? '0 1px 3px rgba(22,21,28,0.10)' : undefined,
            }}
          >
            <Text variant="label" color={on ? 'ink' : 'body'} numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </Box>
  );
}

const TREND_STYLE: Record<Trend, { bg: ThemeColor; fg: ThemeColor; border: ThemeColor }> = {
  new: { bg: 'daysSoft', fg: 'days', border: 'daysSoft' },
  growing: { bg: 'hoursSoft', fg: 'hoursInk', border: 'hoursSoft' },
  steady: { bg: 'track', fg: 'body', border: 'track' },
  paused: { bg: 'card', fg: 'muted', border: 'dashed' },
};

/** Nothing for "steady": only a change is worth a label. */
export function TrendChip({ trend }: { trend: Trend }) {
  const { t } = useTranslation();
  if (trend === 'steady') return null;
  const s = TREND_STYLE[trend];
  return (
    <Box backgroundColor={s.bg} borderColor={s.border} borderWidth={1} borderRadius="pill" paddingHorizontal="s" style={{ paddingVertical: 1 }}>
      <Text variant="tiny" color={s.fg} style={{ fontFamily: 'Inter_600SemiBold' }}>
        {t(`trend.${trend}`)}
      </Text>
    </Box>
  );
}

export function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <Box flexDirection="row" justifyContent="space-between" alignItems="baseline">
      <Text variant="heading" accessibilityRole="header">
        {title}
      </Text>
      {right}
    </Box>
  );
}

/** An emoji on a soft accent tile, the leading icon of a list row. */
export function RowIcon({ emoji }: { emoji: string }) {
  return (
    <Box width={34} height={34} borderRadius="s" backgroundColor="accentSoft" alignItems="center" justifyContent="center">
      <Text style={{ fontSize: 18, lineHeight: 24 }} allowFontScaling={false}>
        {emoji}
      </Text>
    </Box>
  );
}

/** A row in a grouped list, like iOS Settings. */
export function ListRow({
  title,
  sub,
  value,
  left,
  onPress,
  danger,
  last,
}: {
  title: string;
  sub?: string;
  value?: string;
  left?: ReactNode;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={value}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 52,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: last ? 0 : 1,
        borderColor: colors.line,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {left}
      <Box flex={1} gap="xs">
        <Text variant="bodyStrong" style={{ color: danger ? colors.danger : colors.ink }}>
          {title}
        </Text>
        {sub ? <Text variant="small">{sub}</Text> : null}
      </Box>
      {value ? (
        <Text variant="label" color="muted" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <Glyph d={UI_PATHS.chevronRight} size={16} color={colors.faint} strokeWidth={2} />
    </Pressable>
  );
}

export function SwitchRow({ title, sub, value, onChange, disabled, last }: { title: string; sub?: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean; last?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <Box flexDirection="row" alignItems="center" gap="sm" paddingVertical="sm" paddingHorizontal="m" borderBottomWidth={last ? 0 : 1} borderColor="line" style={{ opacity: disabled ? 0.5 : 1 }}>
      <Box flex={1} gap="xs">
        <Text variant="bodyStrong">{title}</Text>
        {sub ? <Text variant="small">{sub}</Text> : null}
      </Box>
      <Switch value={value} onValueChange={onChange} disabled={disabled} accessibilityLabel={title} trackColor={{ true: colors.accent, false: colors.track }} ios_backgroundColor={colors.track} />
    </Box>
  );
}

/** The white-card group that holds list rows. */
export function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Box gap="s">
      {title ? (
        <Text variant="small" style={{ fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3, marginLeft: 4 }} accessibilityRole="header">
          {title.toLocaleUpperCase()}
        </Text>
      ) : null}
      <Box backgroundColor="card" borderRadius="xl" overflow="hidden">
        {children}
      </Box>
    </Box>
  );
}
