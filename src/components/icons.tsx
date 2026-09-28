import { Image } from 'expo-image';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import type { AssetFace, IconKey, PaletteKey } from '@/domain/types';
import { photoUri } from '@/lib/photos';
import { useAppTheme } from '@/theme/theme';
import { Box, Text } from './primitives';

/** Stroke icons on a 24×24 grid, one path each. */
export const ICON_PATHS: Record<IconKey, string> = {
  guitar: 'M13 11l7-7M18.5 2.5l3 3M11 10.5c-1.5-1.5-4.5-1.2-6 .8-1 1.3-.6 2.7-1.5 3.8-1.2 1.4-.8 3.6.9 4.8 1.6 1.4 3.6 1.3 4.8.1 1.1-1 2.4-.5 3.8-1.5 2-1.5 2.3-4.5.8-6zM8.5 15.5h.01',
  keys: 'M3 5h18v14H3zM7.5 14v5M12 14v5M16.5 14v5M6 5v9h3V5M10.5 5v9h3V5M15 5v9h3V5',
  wave: 'M4 12h2M8 8v8M12 5v14M16 9v6M20 11v2',
  mic: 'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3M8 21h8',
  headphones: 'M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H5a1 1 0 0 1-1-1zM20 15h-3v5h2a1 1 0 0 0 1-1z',
  pencil: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 10a3.5 3.5 0 1 0 .01 0',
  vase: 'M9 3h6M10 3v3c-3 1-5 4-5 7 0 4 3 8 7 8s7-4 7-8c0-3-2-6-5-7V3M7 13h10',
  dumbbell: 'M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12',
  route: 'M6 16.5a1.5 1.5 0 1 0 .01 0M18 4.5a1.5 1.5 0 1 0 .01 0M7.5 18h6.5a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6.5',
  leaf: 'M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l7-7',
  mountain: 'M3 20l6-10 4 6 3-4 5 8z',
  ball: 'M12 3a9 9 0 1 0 .01 0M12 7l4 3-1.5 4.5h-5L8 10zM12 3v4M16 10l4.5-1.5M14.5 14.5l2.5 4M9.5 14.5l-2.5 4M8 10L3.5 8.5',
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  ai: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
  book: 'M4 19V5a2 2 0 0 1 2-2h13v14H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h13v-4',
  speech: 'M4 5h16v11H9l-5 4zM8 9h8M8 12h5',
  pawn: 'M8 20h8M9 20l1-5h4l1 5M10.5 15l-.5-4h4l-.5 4M12 5a3 3 0 1 0 .01 0',
  candles: 'M7 4v4M7 16v4M5 8h4v8H5zM17 3v5M17 14v5M15 8h4v6h-4z',
  cards: 'M9 3h10a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 6.5l-3.2 1a1 1 0 0 0-.6 1.3l3.6 11a1 1 0 0 0 1.3.6l4-1.4M14 7.5l1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1-1.5-1.4 2-.3z',
  tv: 'M4 7h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1zM8 3l4 4 4-4M10.5 10.5v5l4-2.5z',
  gamepad: 'M7 8h10a4 4 0 0 1 4 4v1a3 3 0 0 1-5.4 1.8L14.5 14h-5l-1.1.8A3 3 0 0 1 3 13v-1a4 4 0 0 1 4-4zM7.5 10.5v3M6 12h3M15.5 11.5h.01M17.5 13h.01',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  pot: 'M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM2 10h20M9 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z',
};

/** UI glyphs that are not asset icons. */
export const UI_PATHS = {
  back: 'M15 18l-6-6 6-6',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12l5 5 9-10',
  globe: 'M12 3a9 9 0 1 0 .01 0M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  search: 'M11 4a7 7 0 1 0 .01 0M20 20l-4-4',
  portfolio: 'M12 3a9 9 0 1 0 9 9h-9z',
  analytics: 'M5 20v-8M12 20V5M19 20v-5',
  settings: 'M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4',
  target: 'M12 3a9 9 0 1 0 .01 0M12 7a5 5 0 1 0 .01 0M12 11a1 1 0 1 0 .01 0',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  user: 'M12 4a4 4 0 1 0 .01 0M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6',
  pencil: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 2-2 5 5M15.5 8.5a1.5 1.5 0 1 0 .01 0',
  share: 'M12 15V3M8 7l4-4 4 4M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7',
  close: 'M6 6l12 12M18 6L6 18',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
} as const;

export function Glyph({ d, size = 20, color, strokeWidth = 1.8 }: { d: string; size?: number; color: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={d} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** An asset's icon, emoji or photo on its tinted tile. */
export function AssetIcon({ icon, color, face, size = 40 }: { icon: IconKey; color: PaletteKey; face?: AssetFace; size?: number }) {
  const { palette } = useAppTheme();
  const p = palette[color];
  const radius = size * 0.3;
  if (face?.kind === 'photo') {
    // A thin ring in the asset color keeps photos tied to their color everywhere else.
    return (
      <Box width={size} height={size} style={{ borderRadius: radius, borderWidth: Math.max(1.5, size / 28), borderColor: p.main, padding: 1.5, backgroundColor: p.tint }}>
        <Image source={{ uri: photoUri(face.file) }} style={{ flex: 1, borderRadius: radius - 3 }} contentFit="cover" accessibilityIgnoresInvertColors />
      </Box>
    );
  }
  return (
    <Box width={size} height={size} alignItems="center" justifyContent="center" style={{ backgroundColor: p.tint, borderRadius: radius }}>
      {face?.kind === 'emoji' ? (
        <Text style={{ fontSize: size * 0.52, lineHeight: size * 0.66 }} allowFontScaling={false}>
          {face.emoji}
        </Text>
      ) : (
        <Glyph d={ICON_PATHS[icon]} size={size * 0.55} color={p.main} strokeWidth={size > 56 ? 1.6 : 1.8} />
      )}
    </Box>
  );
}

const MARK_SEGMENTS: [string, number][] = [
  ['#6246EA', 0.34],
  ['#C2388A', 0.26],
  ['#E4572E', 0.22],
  ['#1E96C8', 0.18],
];

/** The app icon's mark: a portfolio donut that is also a clock face. Same geometry as the icon. */
export function BrandMark({ size = 28 }: { size?: number }) {
  const r = 300;
  const circ = 2 * Math.PI * r;
  const gap = 26;
  const starts = MARK_SEGMENTS.map((_, i) => MARK_SEGMENTS.slice(0, i).reduce((a, [, s]) => a + s * circ, 0));
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024" accessibilityElementsHidden>
      <Path d="M224 0h576a224 224 0 0 1 224 224v576a224 224 0 0 1-224 224H224A224 224 0 0 1 0 800V224A224 224 0 0 1 224 0z" fill="#15171A" />
      {MARK_SEGMENTS.map(([color, share], i) => (
        <Circle
          key={color}
          cx={512}
          cy={512}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={132}
          strokeDasharray={`${share * circ - gap} ${circ}`}
          strokeDashoffset={-starts[i] - gap / 2}
          rotation={-90}
          origin="512, 512"
        />
      ))}
      <Line x1={512} y1={512} x2={681.7} y2={414} stroke="#FFFFFF" strokeWidth={50} strokeLinecap="round" />
      <Circle cx={512} cy={512} r={46} fill="#FFFFFF" />
    </Svg>
  );
}
