import Svg, { Circle, G, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import type { HeatDay } from '@/domain/stats';
import { heatLevel } from '@/domain/stats';
import { useAppTheme } from '@/theme/theme';
import { Box, Text } from './primitives';

const MONO = 'Inter_500Medium';
const SANS = 'Inter_400Regular';

function niceStep(max: number): number {
  const raw = max / 3;
  const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  return [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
}

/** Cumulative hours this period (solid) against the previous one (dashed). */
export function CumulativeChart({
  width,
  current,
  previous,
  totalDays,
  labels,
  accessibilityLabel,
}: {
  width: number;
  current: number[];
  previous: number[] | null;
  /** Days in the whole period, so a half-finished month draws half-way across. */
  totalDays: number;
  labels: [string, string, string];
  accessibilityLabel: string;
}) {
  const { colors } = useAppTheme();
  const height = 168;
  const plotH = 140;
  const plotW = width - 8;
  const max = Math.max(1, ...current, ...(previous ?? []));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const x = (i: number, n: number) => (n <= 1 ? 0 : (i / (n - 1)) * plotW);
  const y = (v: number) => plotH - (v / top) * (plotH - 10);
  const pts = (vals: number[], n: number) => vals.map((v, i) => `${x(i, n).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const n = Math.max(totalDays, 2);
  const cur = pts(current, n);
  const lastX = x(current.length - 1, n);
  const lastY = y(current[current.length - 1] ?? 0);
  const grid = [1, 2, 3].map((k) => k * step).filter((v) => v <= top);
  return (
    <Svg width={width} height={height} accessibilityLabel={accessibilityLabel} accessibilityRole="image">
      {grid.map((v) => (
        <G key={v}>
          <Line x1={0} y1={y(v)} x2={width} y2={y(v)} stroke={colors.border} strokeWidth={1} />
          <SvgText x={0} y={y(v) < 16 ? y(v) + 13 : y(v) - 5} fontSize={10} fill={colors.faint} fontFamily={MONO}>
            {String(v)}
          </SvgText>
        </G>
      ))}
      <Line x1={0} y1={plotH} x2={width} y2={plotH} stroke={colors.axis} strokeWidth={1} />
      {previous && previous.length > 1 ? (
        <Polyline points={pts(previous, previous.length)} fill="none" stroke={colors.previous} strokeWidth={1.5} strokeDasharray="4 4" />
      ) : null}
      {current.length > 1 ? (
        <>
          <Path d={`M${cur.replace(/ /g, ' L')} L${lastX.toFixed(1)},${plotH} L0,${plotH} Z`} fill={colors.hours} fillOpacity={0.08} />
          <Polyline points={cur} fill="none" stroke={colors.hours} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        </>
      ) : null}
      <Circle cx={lastX} cy={lastY} r={5} fill={colors.hours} stroke={colors.ground} strokeWidth={2} />
      <SvgText x={0} y={160} fontSize={11} fill={colors.faint} fontFamily={SANS}>
        {labels[0]}
      </SvgText>
      <SvgText x={width / 2} y={160} fontSize={11} fill={colors.faint} fontFamily={SANS} textAnchor="middle">
        {labels[1]}
      </SvgText>
      <SvgText x={width} y={160} fontSize={11} fill={colors.faint} fontFamily={SANS} textAnchor="end">
        {labels[2]}
      </SvgText>
    </Svg>
  );
}

export function Donut({
  slices,
  size = 132,
  centerTop,
  centerBottom,
  accessibilityLabel,
}: {
  slices: { share: number; color: string }[];
  size?: number;
  centerTop: string;
  centerBottom: string;
  accessibilityLabel: string;
}) {
  const { colors } = useAppTheme();
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const gap = slices.length > 1 ? 2 : 0;
  // Each slice starts where the previous ones end.
  const starts = slices.map((_, i) => slices.slice(0, i).reduce((a, s) => a + s.share * c, 0));
  return (
    <Svg width={size} height={size} accessibilityLabel={accessibilityLabel} accessibilityRole="image">
      <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
        {slices.length === 0 ? <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.track} strokeWidth={16} fill="none" /> : null}
        {slices.map((s, i) => {
          const len = s.share * c;
          return (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={16}
              strokeDasharray={`${Math.max(len - gap, 0.5)} ${c}`}
              strokeDashoffset={-starts[i]}
            />
          );
        })}
      </G>
      <SvgText x={size / 2} y={size / 2 + 2} textAnchor="middle" fontSize={20} fontFamily="Inter_600SemiBold" fill={colors.ink}>
        {centerTop}
      </SvgText>
      <SvgText x={size / 2} y={size / 2 + 20} textAnchor="middle" fontSize={12} fontFamily="Inter_600SemiBold" fill={colors.hours}>
        {centerBottom}
      </SvgText>
    </Svg>
  );
}

export function Sparkline({ values, color, width = 48, height = 24 }: { values: number[]; color: string; width?: number; height?: number }) {
  if (values.length < 2) return <Box width={width} height={height} />;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * (width - 2) + 1).toFixed(1)},${(height - 2 - ((v - min) / (max - min || 1)) * (height - 4)).toFixed(1)}`)
    .join(' ');
  return (
    <Svg width={width} height={height}>
      <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

/** Weekly hours: current week in the asset color, earlier weeks softer, dashed average. */
export function WeeklyBars({
  width,
  minutes,
  color,
  soft,
  avgLabel,
  labels,
  breakLabel,
  accessibilityLabel,
}: {
  width: number;
  minutes: number[];
  color: string;
  soft: string;
  avgLabel: string;
  labels: [string, string, string];
  breakLabel: string;
  accessibilityLabel: string;
}) {
  const { colors } = useAppTheme();
  const plotH = 130;
  const n = minutes.length;
  const barW = Math.min(20, (width / n) * 0.62);
  const stepX = n > 1 ? (width - barW) / (n - 1) : 0;
  const max = Math.max(60, ...minutes);
  const h = (m: number) => (m / max) * (plotH - 20);
  const avg = minutes.reduce((a, b) => a + b, 0) / Math.max(n, 1);
  const avgY = plotH - h(avg);
  return (
    <Svg width={width} height={152} accessibilityLabel={accessibilityLabel} accessibilityRole="image">
      {minutes.map((m, i) => {
        const xPos = i * stepX;
        if (m === 0) {
          return <Rect key={i} x={xPos} y={plotH - 4} width={barW} height={4} rx={2} fill={colors.dashed} />;
        }
        return <Rect key={i} x={xPos} y={plotH - h(m)} width={barW} height={h(m)} rx={4} fill={i === n - 1 ? color : soft} />;
      })}
      {avg > 0 ? (
        <>
          <Line x1={0} y1={avgY} x2={width} y2={avgY} stroke={colors.ink} strokeOpacity={0.5} strokeDasharray="3 4" />
          <SvgText x={0} y={avgY - 5} fontSize={10} fill={colors.body} fontFamily={MONO}>
            {avgLabel}
          </SvgText>
        </>
      ) : null}
      {minutes.map((m, i) =>
        m === 0 && i < n - 1 ? (
          <SvgText key={`b${i}`} x={i * stepX + barW / 2} y={plotH - 10} fontSize={9} fill={colors.faint} textAnchor="middle" fontFamily={SANS}>
            {breakLabel}
          </SvgText>
        ) : null,
      )}
      <SvgText x={0} y={148} fontSize={11} fill={colors.faint} fontFamily={SANS}>
        {labels[0]}
      </SvgText>
      <SvgText x={width / 2} y={148} fontSize={11} fill={colors.faint} fontFamily={SANS} textAnchor="middle">
        {labels[1]}
      </SvgText>
      <SvgText x={width} y={148} fontSize={11} fill={colors.faint} fontFamily={SANS} textAnchor="end">
        {labels[2]}
      </SvgText>
    </Svg>
  );
}

export function StackedBar({ parts, accessibilityLabel }: { parts: { share: number; color: string }[]; accessibilityLabel: string }) {
  const visible = parts.filter((p) => p.share > 0);
  return (
    <Box flexDirection="row" height={16} gap="xs" accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
      {visible.map((p, i) => (
        <Box
          key={i}
          style={{
            flex: p.share,
            backgroundColor: p.color,
            borderTopLeftRadius: i === 0 ? 6 : 2,
            borderBottomLeftRadius: i === 0 ? 6 : 2,
            borderTopRightRadius: i === visible.length - 1 ? 6 : 2,
            borderBottomRightRadius: i === visible.length - 1 ? 6 : 2,
          }}
        />
      ))}
    </Box>
  );
}

export function Heatmap({ cells, weekdays }: { cells: (HeatDay | null)[]; weekdays: string[] }) {
  const { colors, heatSteps } = useAppTheme();
  const max = Math.max(0, ...cells.map((c) => c?.minutes ?? 0));
  const rows: (HeatDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return (
    <Box gap="s">
      <Box flexDirection="row" gap="s">
        {weekdays.map((w) => (
          <Text key={w} variant="tiny" textAlign="center" style={{ flex: 1 }}>
            {w}
          </Text>
        ))}
      </Box>
      {rows.map((row, r) => (
        <Box key={r} flexDirection="row" gap="s">
          {row.map((c, i) => {
            if (!c) return <Box key={i} style={{ flex: 1, height: 38 }} />;
            const level = heatLevel(c.minutes, max);
            const bg = c.future ? 'transparent' : c.restOnly ? colors.daysSoft : level === 0 ? colors.track : heatSteps[level - 1];
            const fg = c.restOnly ? colors.daysInk : level >= 3 ? colors.card : c.future ? colors.faint : colors.ink;
            return (
              <Box
                key={i}
                alignItems="center"
                justifyContent="center"
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 9,
                  backgroundColor: bg,
                  borderWidth: c.today ? 2 : c.future ? 1 : 0,
                  borderColor: c.today ? colors.ink : colors.dashed,
                  borderStyle: c.future ? 'dashed' : 'solid',
                }}
              >
                <Text style={{ fontFamily: MONO, fontSize: 11, color: fg }}>{c.date}</Text>
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
