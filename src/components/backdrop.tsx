import { useId } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { BackgroundId } from '@/domain/backgrounds';
import { useSettingsStore } from '@/store/settings-store';
import { useAppTheme } from '@/theme/theme';

/** The page background behind every screen: plain, or a quiet pattern in the accent color. */
export function Backdrop({ id: override, width: w, height: h }: { id?: BackgroundId; width?: number; height?: number }) {
  const picked = useSettingsStore((s) => s.background);
  const { colors, mode } = useAppTheme();
  const win = useWindowDimensions();
  const uid = useId().replace(/:/g, '');
  const id = override ?? picked;
  const width = w ?? win.width;
  const height = h ?? win.height;
  const c = colors.accent;
  // Patterns stay faint so text on the page keeps its contrast.
  const a = mode === 'dark' ? 0.16 : 0.1;

  if (id === 'plain') return null;
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id={`${uid}glow`} cx="0.9" cy="0" r="0.9">
          <Stop offset="0" stopColor={c} stopOpacity={a * 3} />
          <Stop offset="1" stopColor={c} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={`${uid}fade`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c} stopOpacity={a * 2.2} />
          <Stop offset="0.6" stopColor={c} stopOpacity={0} />
        </LinearGradient>
        <Pattern id={`${uid}dots`} width={22} height={22} patternUnits="userSpaceOnUse">
          <Circle cx={11} cy={11} r={1.6} fill={c} fillOpacity={a * 2} />
        </Pattern>
        <Pattern id={`${uid}grid`} width={28} height={28} patternUnits="userSpaceOnUse">
          <Path d="M28 0H0V28" fill="none" stroke={c} strokeOpacity={a * 1.4} strokeWidth={1} />
        </Pattern>
        <Pattern id={`${uid}waves`} width={80} height={28} patternUnits="userSpaceOnUse">
          <Path d="M0 14 C20 4 40 24 60 14 S80 4 80 14" fill="none" stroke={c} strokeOpacity={a * 1.6} strokeWidth={1.4} />
        </Pattern>
        <Pattern id={`${uid}hours`} width={64} height={64} patternUnits="userSpaceOnUse">
          <Circle cx={32} cy={32} r={12} fill="none" stroke={c} strokeOpacity={a * 1.5} strokeWidth={1.4} />
          <Path d="M32 32 L39 28" stroke={c} strokeOpacity={a * 1.8} strokeWidth={1.4} strokeLinecap="round" />
        </Pattern>
      </Defs>
      {id === 'glow' ? <Rect width={width} height={height} fill={`url(#${uid}glow)`} /> : null}
      {id === 'sunrise' ? <Rect width={width} height={height} fill={`url(#${uid}fade)`} /> : null}
      {id === 'dots' || id === 'grid' || id === 'waves' || id === 'hours' ? <Rect width={width} height={height} fill={`url(#${uid}${id})`} /> : null}
      {id === 'bubbles' ? (
        <G>
          <Circle cx={width * 0.95} cy={height * 0.06} r={width * 0.34} fill={c} fillOpacity={a * 0.9} />
          <Circle cx={width * 0.05} cy={height * 0.42} r={width * 0.22} fill={c} fillOpacity={a * 0.6} />
          <Circle cx={width * 0.8} cy={height * 0.78} r={width * 0.28} fill={c} fillOpacity={a * 0.5} />
        </G>
      ) : null}
    </Svg>
  );
}
