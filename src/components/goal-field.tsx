import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Text } from '@/components/primitives';
import { DurationPicker } from '@/components/duration-picker';
import { Duration, Segmented } from '@/components/ui';
import { DAY_GOAL_MAX, WEEK_GOAL_MAX, dailyFromWeekly } from '@/domain/goals';
import type { Asset } from '@/domain/types';

type GoalAsset = Pick<Asset, 'weeklyGoalMinutes' | 'dailyGoalMinutes' | 'planDays'>;
type Unit = 'week' | 'day';

/**
 * A goal as hours a week or minutes a day (20 min of reading). `onChange` gets a
 * patch for the asset; `applyGoalPatch` keeps the weekly total in line.
 */
export function GoalField({ asset, onChange, label }: { asset: GoalAsset; onChange: (patch: Partial<GoalAsset>) => void; label: string }) {
  const { t } = useTranslation();
  const weekly = asset.weeklyGoalMinutes ?? 0;
  const daily = asset.dailyGoalMinutes ?? 0;
  // Kept in state so a per-day goal stepped down to off stays on "per day".
  const [unit, setUnit] = useState<Unit>(daily > 0 ? 'day' : 'week');
  const value = unit === 'day' ? daily : weekly;
  // The weekly goal as it was when switching to per day: toggling back untouched must not drift by the 5-minute rounding.
  const before = useRef<{ weekly: number; daily: number } | null>(null);

  const set = (minutes: number) => {
    if (unit === 'day') onChange(minutes > 0 ? { dailyGoalMinutes: minutes } : { dailyGoalMinutes: undefined, weeklyGoalMinutes: undefined });
    else onChange({ weeklyGoalMinutes: minutes > 0 ? minutes : undefined });
  };
  const switchTo = (next: Unit) => {
    if (next === unit) return;
    setUnit(next);
    if (next === 'day') {
      const nextDaily = weekly > 0 ? dailyFromWeekly(weekly, asset) : 0;
      before.current = weekly > 0 ? { weekly, daily: nextDaily } : null;
      onChange(weekly > 0 ? { dailyGoalMinutes: nextDaily } : {});
    } else {
      const restore = before.current && before.current.daily === daily ? before.current.weekly : weekly;
      onChange({ weeklyGoalMinutes: restore > 0 ? restore : undefined });
    }
  };

  return (
    <Box gap="s">
      <Segmented
        label={label}
        value={unit}
        onChange={switchTo}
        options={[
          { value: 'week', label: t('goalField.perWeek') },
          { value: 'day', label: t('goalField.perDay') },
        ]}
      />
      <Box flexDirection="row" alignItems="center" justifyContent="center" gap="sm">
        <DurationPicker minutes={value} onChange={set} max={unit === 'day' ? DAY_GOAL_MAX : WEEK_GOAL_MAX} label={label} minWidth={140} testID="goal-time">
          {value === 0 ? (
            <Text variant="label" color="muted">
              {t('durationPicker.choose')}
            </Text>
          ) : (
            <Duration minutes={value} size={18} />
          )}
        </DurationPicker>
      </Box>
      {unit === 'day' && weekly > 0 ? (
        <Box flexDirection="row" alignItems="center" justifyContent="center" gap="xs">
          <Text variant="small">=</Text>
          <Duration minutes={weekly} size={13} quiet />
          <Text variant="small">{t('goalField.aWeek')}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
