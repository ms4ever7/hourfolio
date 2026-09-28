import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { durationParts } from '@/domain/format';
import { weekNudge } from '@/domain/goals';
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
      const remaining = durationParts(nudge.remaining)
        .map((p) => `${p.value} ${t(`units.${p.unit}`)}`)
        .join(' ');
      await Notifications.scheduleNotificationAsync({
        identifier: NUDGE_ID,
        content: { title: t('nudge.title', { name: assetName(nudge.asset) }), body: t('nudge.body', { remaining }) },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nudge.at },
      });
    };
    void sync();
    return () => {
      cancelled = true;
    };
  }, [on, assets, logs, t, assetName]);
}
