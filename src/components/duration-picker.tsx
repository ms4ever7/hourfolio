import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Glyph, UI_PATHS } from '@/components/icons';
import { Box, Text } from '@/components/primitives';
import { PrimaryButton } from '@/components/ui';
import { useAppTheme } from '@/theme/theme';

const ITEM = 44;
const ROWS = 5;
const MINUTE_STEP = 5;

/** A scrolling column of whole numbers that snaps to one; the middle row is the picked one. */
function Wheel({ values, value, onChange, unit, label }: { values: number[]; value: number; onChange: (v: number) => void; unit: string; label: string }) {
  const { colors } = useAppTheme();
  const ref = useRef<ScrollView>(null);
  const index = Math.max(0, values.indexOf(value));
  useEffect(() => {
    ref.current?.scrollTo({ y: index * ITEM, animated: false });
    // Only on open: later changes come from scrolling or taps that already moved the wheel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const settle = (y: number) => onChange(values[Math.min(values.length - 1, Math.max(0, Math.round(y / ITEM)))]);
  return (
    <Box flex={1} alignItems="center">
      <View style={{ height: ITEM * ROWS, width: '100%' }}>
        <View pointerEvents="none" style={{ position: 'absolute', left: 8, right: 8, top: ITEM * 2, height: ITEM, borderRadius: 12, backgroundColor: colors.accentSoft }} />
        <ScrollView
          ref={ref}
          accessibilityLabel={label}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM}
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: ITEM * 2 }}
          onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.y)}
          onScrollEndDrag={(e) => settle(e.nativeEvent.contentOffset.y)}
        >
          {values.map((v, i) => (
            <Pressable
              key={v}
              accessibilityRole="button"
              accessibilityLabel={`${v} ${unit}`}
              accessibilityState={{ selected: v === value }}
              onPress={() => {
                ref.current?.scrollTo({ y: i * ITEM, animated: true });
                onChange(v);
              }}
              style={{ height: ITEM, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text variant="heading" color={v === value ? 'accentInk' : 'muted'}>
                {`${v} ${unit}`}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Box>
  );
}

const range = (from: number, to: number, step = 1) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);

/**
 * Wraps a duration in a field-like pill (with a chevron, so it reads as tappable) that opens a sheet with hour and minute wheels, so any length
 * can be picked rather than stepped to. Minutes come in 5s; `min` and `max` are in minutes.
 */
export function DurationPicker({ minutes, onChange, min = 0, max = 24 * 60, label, compact, minWidth, testID, children }: { minutes: number; onChange: (minutes: number) => void; min?: number; max?: number; label: string; compact?: boolean; minWidth?: number; testID?: string; children: ReactNode }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState(0);
  const [mins, setMins] = useState(0);
  const start = () => {
    const rounded = Math.round(minutes / MINUTE_STEP) * MINUTE_STEP;
    setHours(Math.floor(rounded / 60));
    setMins(rounded % 60);
    setOpen(true);
  };
  const clamp = (h: number, m: number) => Math.min(max, Math.max(min, h * 60 + m));
  const done = () => {
    onChange(clamp(hours, mins));
    setOpen(false);
  };
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        testID={testID}
        onPress={start}
        hitSlop={compact ? 6 : 0}
        style={({ pressed }) => ({
          minWidth,
          height: compact ? 32 : 44,
          paddingHorizontal: compact ? 10 : 16,
          borderRadius: compact ? 16 : 22,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        {children}
        <Glyph d={UI_PATHS.chevronDown} size={compact ? 12 : 14} color={colors.muted} strokeWidth={2.4} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <Pressable accessibilityLabel={t('common.cancel')} onPress={() => setOpen(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
          <View style={{ backgroundColor: colors.ground, borderRadius: 24, padding: 20, gap: 16 }}>
            <Text variant="bodyStrong" style={{ textAlign: 'center' }}>
              {label}
            </Text>
            <Box flexDirection="row" gap="sm">
              <Wheel values={range(0, Math.floor(max / 60))} value={hours} onChange={setHours} unit={t('units.h')} label={t('durationPicker.hours')} />
              <Wheel values={range(0, 55, MINUTE_STEP)} value={mins} onChange={setMins} unit={t('units.m')} label={t('durationPicker.minutes')} />
            </Box>
            <PrimaryButton label={t('common.done')} onPress={done} />
          </View>
        </View>
      </Modal>
    </>
  );
}
