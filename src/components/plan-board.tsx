import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Box, Text } from '@/components/primitives';
import type { PlannedSession } from '@/domain/plan';
import { useAppTheme } from '@/theme/theme';

export interface BoardDay {
  key: string;
  sessions: PlannedSession[];
  /** Whether a session can be dropped on this day. */
  drop: boolean;
}

interface Layout {
  y: number;
  height: number;
}

interface Props {
  days: BoardDay[];
  /** Called when a session is dropped on another day; the caller merges it with the same asset there. */
  onMove: (id: string, day: string) => void;
  header: (day: BoardDay) => ReactNode;
  /** One session; `handle` is the grip to place in it, or null when it cannot be dragged. */
  row: (session: PlannedSession, handle: ReactNode) => ReactNode;
  footer?: (day: BoardDay) => ReactNode;
  /** Whether a session can be picked up. */
  canDrag: (session: PlannedSession) => boolean;
  /** Label for the grip, read out by screen readers. */
  gripLabel: (session: PlannedSession) => string;
  earlierLabel: string;
  laterLabel: string;
  /** No card of its own per day, for a board that already sits in a card. */
  plain?: boolean;
}

/**
 * The week as day cards. A session is picked up by its grip (⠿) and dropped on
 * another day, which highlights while it is over it. Screen readers get
 * "earlier" and "later" actions on the grip instead of a drag.
 */
export function PlanBoard({ days, onMove, header, row, footer, canDrag, gripLabel, earlierLabel, laterLabel, plain }: Props) {
  const dayLayouts = useRef<Record<string, Layout>>({});
  const rowLayouts = useRef<Record<string, Layout>>({});
  const [hover, setHover] = useState<string | null>(null);
  const [lifted, setLifted] = useState<string | null>(null);

  const dayOf = (id: string) => days.find((d) => d.sessions.some((s) => s.id === id));

  /** The droppable day nearest to a point in the board's coordinates. */
  const dayAt = (y: number): string | null => {
    let best: string | null = null;
    let bestGap = Infinity;
    for (const d of days) {
      const l = dayLayouts.current[d.key];
      if (!d.drop || !l) continue;
      const gap = y < l.y ? l.y - y : y > l.y + l.height ? y - (l.y + l.height) : 0;
      if (gap < bestGap) {
        best = d.key;
        bestGap = gap;
      }
    }
    return best;
  };

  const centre = (id: string, shift: number) => {
    const day = dayOf(id);
    const r = rowLayouts.current[id];
    const d = day && dayLayouts.current[day.key];
    return d && r ? d.y + r.y + r.height / 2 + shift : null;
  };

  const begin = (id: string) => setLifted(id);
  const over = (id: string, shift: number) => {
    const c = centre(id, shift);
    const next = c === null ? null : dayAt(c);
    setHover((h) => (h === next ? h : next));
  };
  const cancel = () => {
    setHover(null);
    setLifted(null);
  };
  const drop = (id: string, shift: number) => {
    const c = centre(id, shift);
    const target = c === null ? null : dayAt(c);
    setHover(null);
    setLifted(null);
    if (target && target !== dayOf(id)?.key) onMove(id, target);
  };
  /** The next droppable day in a direction, for the screen reader actions. */
  const step = (id: string, direction: 1 | -1) => {
    const from = days.findIndex((d) => d.sessions.some((s) => s.id === id));
    for (let i = from + direction; i >= 0 && i < days.length; i += direction) {
      if (days[i].drop) return onMove(id, days[i].key);
    }
  };

  return (
    <GestureHandlerRootView>
      <Box gap="sm">
        {days.map((d) => (
          <DayCard key={d.key} plain={plain} highlighted={hover === d.key} raised={lifted !== null && dayOf(lifted)?.key === d.key} onLayout={(l) => (dayLayouts.current[d.key] = l)}>
            {header(d)}
            {d.sessions.map((s) => (
              <DraggableRow
                key={s.id}
                enabled={canDrag(s)}
                label={gripLabel(s)}
                earlierLabel={earlierLabel}
                laterLabel={laterLabel}
                onLayout={(l) => (rowLayouts.current[s.id] = l)}
                onBegin={() => begin(s.id)}
                onOver={(shift) => over(s.id, shift)}
                onDrop={(shift) => drop(s.id, shift)}
                onCancel={cancel}
                onStep={(direction) => step(s.id, direction)}
                render={(handle) => row(s, handle)}
              />
            ))}
            {footer?.(d)}
          </DayCard>
        ))}
      </Box>
    </GestureHandlerRootView>
  );
}

function DayCard({ children, highlighted, raised, plain, onLayout }: { children: ReactNode; highlighted: boolean; raised: boolean; plain?: boolean; onLayout: (l: Layout) => void }) {
  const { colors } = useAppTheme();
  return (
    <View
      onLayout={(e) => onLayout(e.nativeEvent.layout)}
      style={{ gap: plain ? 4 : 8, padding: plain ? 4 : 16, borderRadius: 24, borderWidth: 1.5, borderColor: highlighted ? colors.accent : 'transparent', backgroundColor: highlighted ? colors.accentSoft : plain ? 'transparent' : colors.card, zIndex: raised ? 10 : 0 }}
    >
      {children}
    </View>
  );
}

interface RowProps {
  enabled: boolean;
  label: string;
  earlierLabel: string;
  laterLabel: string;
  onLayout: (l: Layout) => void;
  onBegin: () => void;
  onOver: (shift: number) => void;
  onDrop: (shift: number) => void;
  /** The gesture ended without a drop (the scroll view or the system took it over). */
  onCancel: () => void;
  onStep: (direction: 1 | -1) => void;
  render: (handle: ReactNode) => ReactNode;
}

function DraggableRow({ enabled, label, earlierLabel, laterLabel, onLayout, onBegin, onOver, onDrop, onCancel, onStep, render }: RowProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const shift = useSharedValue(0);
  const raised = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() => {
      raised.value = withTiming(1, { duration: 120 });
      scheduleOnRN(onBegin);
    })
    .onUpdate((e) => {
      shift.value = e.translationY;
      scheduleOnRN(onOver, e.translationY);
    })
    .onEnd((e) => {
      scheduleOnRN(onDrop, e.translationY);
    })
    .onFinalize((_e, success) => {
      shift.value = withSpring(0, { damping: 18, stiffness: 220 });
      raised.value = withTiming(0, { duration: 120 });
      if (!success) scheduleOnRN(onCancel);
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: shift.value }, { scale: 1 + 0.03 * raised.value }],
    zIndex: raised.value > 0 ? 20 : 0,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18 * raised.value,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  }));

  const handle = enabled ? (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={t('plan.dragHint')}
        accessibilityActions={[
          { name: 'earlier', label: earlierLabel },
          { name: 'later', label: laterLabel },
        ]}
        onAccessibilityAction={(e) => onStep(e.nativeEvent.actionName === 'later' ? 1 : -1)}
        hitSlop={6}
        style={{ width: 28, height: 44, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text variant="heading" color="faint" style={{ fontSize: 22, lineHeight: 26 }}>
          ⠿
        </Text>
      </View>
    </GestureDetector>
  ) : null;

  return (
    <Animated.View onLayout={(e) => onLayout(e.nativeEvent.layout)} style={style}>
      {render(handle)}
    </Animated.View>
  );
}
