import { useEffect, useState } from 'react';
import { type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming, useReducedMotion } from 'react-native-reanimated';
import { sceneArt, stageIndex, type SceneId } from '@/domain/goals';
import type { SeasonId } from '@/domain/seasons';
import { Box, Text } from './primitives';

const SPRING = { damping: 18, stiffness: 120 };

/**
 * Weekly goal progress as a tiny scene: something runs, flies or grows toward
 * its goal. It only ever moves forward during a week, so nothing looks lost.
 */
export function GoalScene({
  scene,
  progress,
  color,
  tint,
  season,
  height = 44,
  accessibilityLabel,
}: {
  scene: SceneId;
  progress: number;
  color: string;
  tint: string;
  season: SeasonId | null;
  height?: number;
  accessibilityLabel?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const a11y = { accessibilityRole: 'progressbar' as const, accessibilityValue: { min: 0, max: 100, now: pct }, accessibilityLabel };

  if (scene === 'bar') {
    return (
      <Box height={8} borderRadius="pill" style={{ backgroundColor: tint }} {...a11y}>
        <Box height={8} borderRadius="pill" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: color }} />
      </Box>
    );
  }
  const art = sceneArt(scene, season);
  if (art.stages) return <GrowScene stages={art.stages} goal={art.goal} progress={progress} color={color} tint={tint} height={height} a11y={a11y} />;
  return <RunScene runner={art.runner} goal={art.goal} flip={art.flip} progress={progress} color={color} tint={tint} height={height} a11y={a11y} />;
}

type A11y = Record<string, unknown>;

function RunScene({ runner, goal, flip, progress, color, tint, height, a11y }: { runner: string; goal: string; flip?: boolean; progress: number; color: string; tint: string; height: number; a11y: A11y }) {
  const [width, setWidth] = useState(0);
  const size = height * 0.62;
  const done = progress >= 1;
  const reduce = useReducedMotion();
  const x = useSharedValue(0);
  const hop = useSharedValue(0);
  // The runner stops just short of the goal until the goal is met, then reaches it.
  const travel = Math.max(0, width - size * 2.1);
  const target = done ? travel + size * 0.6 : travel * Math.min(1, Math.max(0, progress));

  useEffect(() => {
    x.value = reduce ? target : withSpring(target, SPRING);
  }, [target, reduce, x]);

  useEffect(() => {
    if (!done || reduce) {
      hop.value = 0;
      return;
    }
    hop.value = withRepeat(withSequence(withTiming(-size * 0.28, { duration: 220 }), withTiming(0, { duration: 260 })), 3);
  }, [done, reduce, size, hop]);

  const runnerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: hop.value }] }));
  // Once the goal is met the trail runs all the way to it.
  const trailStyle = useAnimatedStyle(() => ({ width: done ? width : x.value + size / 2 }));

  return (
    <Box height={height} justifyContent="flex-end" onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} {...a11y}>
      <Box height={6} borderRadius="pill" style={{ backgroundColor: tint, marginBottom: 4 }}>
        <Animated.View style={[{ height: 6, borderRadius: 3, backgroundColor: color }, trailStyle]} />
      </Box>
      <Animated.View style={[{ position: 'absolute', left: 0, bottom: 6 }, runnerStyle]}>
        <Text style={{ fontSize: size, lineHeight: size * 1.2, transform: flip ? [{ scaleX: -1 }] : undefined }} allowFontScaling={false}>
          {runner}
        </Text>
      </Animated.View>
      <Box position="absolute" style={{ right: 0, bottom: 6 }}>
        <Text style={{ fontSize: size * 0.9, lineHeight: size * 1.1, opacity: done ? 1 : 0.9 }} allowFontScaling={false}>
          {goal}
        </Text>
      </Box>
    </Box>
  );
}

function GrowScene({ stages, goal, progress, color, tint, height, a11y }: { stages: string[]; goal: string; progress: number; color: string; tint: string; height: number; a11y: A11y }) {
  const stage = stageIndex(progress, stages.length);
  const done = progress >= 1;
  const reduce = useReducedMotion();
  const scale = useSharedValue(1);
  const clamped = Math.min(1, Math.max(0, progress));

  useEffect(() => {
    if (reduce) return;
    scale.value = withSequence(withTiming(0.8, { duration: 90 }), withSpring(1, SPRING));
  }, [stage, reduce, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const size = height * 0.7;

  return (
    <Box height={height} flexDirection="row" alignItems="flex-end" gap="sm" {...a11y}>
      <Animated.View style={[{ width: size * 1.2, alignItems: 'center' }, style]}>
        <Text style={{ fontSize: size * (0.6 + 0.4 * ((stage + 1) / stages.length)), lineHeight: size * 1.15 }} allowFontScaling={false}>
          {stages[stage]}
        </Text>
      </Animated.View>
      <Box flex={1} height={6} borderRadius="pill" style={{ backgroundColor: tint, marginBottom: 10 }}>
        <Box height={6} borderRadius="pill" style={{ width: `${Math.max(2, clamped * 100)}%`, backgroundColor: color }} />
      </Box>
      {done ? (
        <Text style={{ fontSize: size * 0.7, lineHeight: size }} allowFontScaling={false}>
          {goal}
        </Text>
      ) : null}
    </Box>
  );
}
