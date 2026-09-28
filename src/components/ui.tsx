import type { ReactNode } from 'react';
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

export function Screen({ children, footer, scroll = true }: { children: ReactNode; footer?: ReactNode; scroll?: boolean }) {
  const insets = useSafeAreaInsets();
  const content = (
    <Box paddingHorizontal="l" gap="l" style={{ paddingTop: insets.top + 12, paddingBottom: footer ? 24 : insets.bottom + 32 }}>
      {children}
    </Box>
  );
  return (
    <Box flex={1} backgroundColor="ground">
      <Backdrop />
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}
      {/* Keeps scrolled content from running under the status bar; the backdrop shows through it unchanged. */}
      <Box position="absolute" backgroundColor="ground" overflow="hidden" style={{ top: 0, left: 0, right: 0, height: insets.top }}>
        <Backdrop />
      </Box>
      {footer}
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

/** A number of hours with its unit in the hours color: "114.5 h". */
export function Hours({
  minutes,
  variant = 'mono',
  unitSize = 12,
  color = 'ink',
  unitColor = 'hours',
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
        {big ? ' ' : ' '}
        {t('units.h')}
      </Text>
    </Text>
  );
}

/** "1 h 35 m" with hours and minutes in their own colors. */
export function Duration({ minutes, size = 15, prefix = '' }: { minutes: number; size?: number; prefix?: string }) {
  const { t } = useTranslation();
  return (
    <Text variant="mono" style={{ fontSize: size }}>
      {prefix}
      {durationParts(minutes).map((p, i) => (
        <Text key={p.unit} variant="mono" style={{ fontSize: size }}>
          {i > 0 ? ' ' : ''}
          {p.value}
          <Text variant="bodyStrong" color={p.unit === 'h' ? 'hours' : 'minutes'} style={{ fontSize: size - 3 }}>
            {' '}
            {t(`units.${p.unit}`)}
          </Text>
        </Text>
      ))}
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
      <Text variant="label" style={{ fontFamily: 'Onest_600SemiBold', fontSize: 13 }}>
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
              boxShadow: on ? '0 1px 2px rgba(21,23,26,0.08)' : undefined,
            }}
          >
            <Text variant="label" color={on ? 'ink' : 'body'} numberOfLines={1} style={{ fontFamily: 'Onest_600SemiBold', fontSize: 13 }}>
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
      <Text variant="tiny" color={s.fg} style={{ fontFamily: 'Onest_600SemiBold' }}>
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
        <Text variant="small" style={{ fontFamily: 'Onest_600SemiBold', letterSpacing: 0.3, marginLeft: 4 }} accessibilityRole="header">
          {title.toLocaleUpperCase()}
        </Text>
      ) : null}
      <Box backgroundColor="card" borderRadius="xl" overflow="hidden">
        {children}
      </Box>
    </Box>
  );
}
