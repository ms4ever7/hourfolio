import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { durationParts } from '@/domain/format';
import { startOfWeek } from '@/domain/dates';
import { weekNudge, type Nudge } from '@/domain/goals';
import { useSettingsStore } from '@/store/settings-store';
import { useAssetName } from './labels';
import { usePortfolio } from './usePortfolio';

const NUDGE_ID = 'week-nudge';

// Show the reminder as a banner even if the app happens to be open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

/** Asks for permission. Local reminders only: nothing goes through a server. */
export async function allowNotifications(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

type T = (key: string, options?: Record<string, unknown>) => string;

function nudgeContent(nudge: Nudge, t: T, name: string) {
  const remaining = durationParts(nudge.remaining)
    .map((p) => `${p.value} ${t(`units.${p.unit}`)}`)
    .join(' ');
  return { title: t('nudge.title', { name }), body: t('nudge.body', { remaining }) };
}

/**
 * Keeps one reminder scheduled for Sunday evening when a weekly goal is nearly
 * met. It is recomputed whenever sessions change, so its text is always current,
 * and removed when there is nothing worth saying.
 */
export function useWeekNudge() {
  const { t } = useTranslation();
  const assetName = useAssetName();
  const on = useSettingsStore((s) => s.nudges);
  const { assets, logs } = usePortfolio();

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      await Notifications.cancelScheduledNotificationAsync(NUDGE_ID).catch(() => undefined);
      const nudge = on ? weekNudge(assets, logs, new Date()) : null;
      if (!nudge || cancelled) return;
      await Notifications.scheduleNotificationAsync({
        identifier: NUDGE_ID,
        content: nudgeContent(nudge, t, assetName(nudge.asset)),
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nudge.at },
      });
    };
    void sync();
    return () => {
      cancelled = true;
    };
  }, [on, assets, logs, t, assetName]);
}

/**
 * Development only: sends this week's reminder in 10 seconds instead of on
 * Sunday, with the same text. When no weekly goal is nearly met it sends a
 * sample (25 minutes left) for one of the user's assets, so there is always
 * something to see. Resolves to whether the reminder was real or a sample.
 */
export function useTestNudge() {
  const { t } = useTranslation();
  const assetName = useAssetName();
  const { assets, logs } = usePortfolio();
  return async (): Promise<'real' | 'sample' | null> => {
    // Monday 00:00 of this week: same week, but before the Sunday cut-off.
    const real = weekNudge(assets, logs, startOfWeek(new Date()));
    const asset = assets.find((a) => a.weeklyGoalMinutes) ?? assets[0];
    const nudge: Nudge | null = real ?? (asset ? { asset, remaining: 25, at: new Date() } : null);
    if (!nudge) return null;
    await Notifications.scheduleNotificationAsync({
      content: nudgeContent(nudge, t, assetName(nudge.asset)),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 10 },
    });
    return real ? 'real' : 'sample';
  };
}
