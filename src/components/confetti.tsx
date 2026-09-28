import { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

const COUNT = 36;

interface Piece {
  x: number;
  drift: number;
  delay: number;
  duration: number;
  size: number;
  spin: number;
  color: string;
  round: boolean;
}

function ConfettiPiece({ piece, height, t }: { piece: Piece; height: number; t: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const p = Math.min(1, Math.max(0, (t.value * 3200 - piece.delay) / piece.duration));
    return {
      opacity: p <= 0 || p >= 1 ? 0 : 1 - p * p,
      transform: [{ translateX: piece.x + piece.drift * p }, { translateY: -40 + p * (height + 80) }, { rotate: `${piece.spin * p}deg` }],
    };
  });
  return <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: piece.size, height: piece.round ? piece.size : piece.size * 0.45, borderRadius: piece.round ? piece.size : 2, backgroundColor: piece.color }, style]} />;
}

/** One falling burst of confetti. Nothing moves when the system asks for reduced motion. */
export function Confetti({ colors }: { colors: string[] }) {
  const { width, height } = useWindowDimensions();
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        x: (((i * 37) % 100) / 100) * width,
        drift: (((i * 53) % 21) - 10) * 6,
        delay: (i % 12) * 70,
        duration: 1700 + ((i * 29) % 900),
        size: 7 + (i % 4) * 2,
        spin: ((i % 2) * 2 - 1) * (240 + (i % 5) * 60),
        color: colors[i % colors.length],
        round: i % 3 === 0,
      })),
    [width, colors],
  );

  useEffect(() => {
    if (!reduce) t.value = withTiming(1, { duration: 3200, easing: Easing.linear });
  }, [reduce, t]);

  if (reduce) return null;
  return (
    <Animated.View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <ConfettiPiece key={i} piece={p} height={height} t={t} />
      ))}
    </Animated.View>
  );
}
