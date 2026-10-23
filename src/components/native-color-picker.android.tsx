import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { Box, Text } from '@/components/primitives';
import { PrimaryButton } from '@/components/ui';
import { hsvToRgb, parseHex, rgbToHsv, toHex, type Hsv } from '@/domain/color';
import { useAppTheme } from '@/theme/theme';

const TRACK = 28;
const hexOf = (c: Hsv) => toHex(hsvToRgb(c));
const HUES = [0, 60, 120, 180, 240, 300, 360];

/** A horizontal slider on a gradient track; `value` is 0–1 and `stops` color the track. */
function GradientSlider({ value, onChange, stops, label }: { value: number; onChange: (v: number) => void; stops: string[]; label: string }) {
  const { colors } = useAppTheme();
  const [width, setWidth] = useState(0);
  const set = (x: number) => width > 0 && onChange(Math.min(1, Math.max(0, x / width)));
  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(Math.min(1, Math.max(0, value + (e.nativeEvent.actionName === 'increment' ? 0.05 : -0.05))))}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => set(e.nativeEvent.locationX)}
      onResponderMove={(e) => set(e.nativeEvent.locationX)}
      style={{ height: 44, justifyContent: 'center' }}
    >
      <View pointerEvents="none" style={{ height: TRACK, borderRadius: TRACK / 2, overflow: 'hidden' }}>
        {width > 0 ? (
          <Svg width={width} height={TRACK}>
            <Defs>
              <LinearGradient id="g" x1="0" y1="0" x2="1" y2="0">
                {stops.map((c, i) => (
                  <Stop key={i} offset={i / (stops.length - 1)} stopColor={c} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect width={width} height={TRACK} fill="url(#g)" />
          </Svg>
        ) : null}
      </View>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: value * width - 11, width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: '#FFFFFF', elevation: 3, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }}
      />
      <View pointerEvents="none" style={{ position: 'absolute', left: value * width - 11, width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: colors.border }} />
    </View>
  );
}

/** A color picker for Android, which has no system one: a swatch that opens hue, saturation and brightness sliders. */
export function NativeColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState<Hsv>(() => rgbToHsv(parseHex(value)));
  const start = () => {
    setColor(rgbToHsv(parseHex(value)));
    setOpen(true);
  };
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel={t('appearance.pickColor')} onPress={start} hitSlop={6} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: colors.border, backgroundColor: value }} />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <Pressable accessibilityLabel={t('common.cancel')} onPress={() => setOpen(false)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} />
          <View style={{ backgroundColor: colors.ground, borderRadius: 24, padding: 20, gap: 8 }}>
            <Box height={56} borderRadius="l" style={{ backgroundColor: hexOf(color), borderWidth: 1, borderColor: colors.border }} alignItems="center" justifyContent="center">
              <Text variant="bodyStrong" style={{ color: color.v > 0.7 && color.s < 0.5 ? '#15171A' : '#FFFFFF' }}>
                {hexOf(color)}
              </Text>
            </Box>
            <GradientSlider label={t('appearance.pickColor')} value={color.h / 360} onChange={(v) => setColor({ ...color, h: v * 360 })} stops={HUES.map((h) => hexOf({ h, s: 1, v: 1 }))} />
            <GradientSlider label={t('appearance.pickColor')} value={color.s} onChange={(v) => setColor({ ...color, s: v })} stops={[hexOf({ ...color, s: 0 }), hexOf({ ...color, s: 1 })]} />
            <GradientSlider label={t('appearance.pickColor')} value={color.v} onChange={(v) => setColor({ ...color, v })} stops={[hexOf({ ...color, v: 0 }), hexOf({ ...color, v: 1 })]} />
            <PrimaryButton
              label={t('common.done')}
              onPress={() => {
                onChange(hexOf(color));
                setOpen(false);
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

export const HAS_NATIVE_COLOR_PICKER = true;
