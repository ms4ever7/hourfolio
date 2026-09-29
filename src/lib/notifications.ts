import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { checkInTimes, restingAsset } from '@/domain/day';
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
        content: { title: t('nudge.title', { name: assetName(nudge.asset) }), body: t('nudge.body', { remaining }), data: { url: '/(tabs)/goals' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: nudge.at },
      });
    };
    void sync();
    return () => {
      cancelled = true;
    };
  }, [on, assets, logs, t, assetName]);
}

const CHECK_IN_PREFIX = 'evening-';

/**
 * The evening check-in: an hour before bed, only on days with nothing logged yet.
 * A week of evenings is kept scheduled and recomputed whenever sessions change,
 * so logging anything today removes tonight's note. Every other evening suggests
 * the asset that has rested longest; the others are a plain invitation.
 */
export function useEveningCheckIn() {
  const { t } = useTranslation();
  const assetName = useAssetName();
  const on = useSettingsStore((s) => s.eveningCheckIn);
  const bed = useSettingsStore((s) => s.bedTime);
  const { assets, logs } = usePortfolio();

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
      await Promise.all(scheduled.filter((n) => n.identifier.startsWith(CHECK_IN_PREFIX)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
      if (!on || cancelled) return;
      const now = new Date();
      const resting = restingAsset(assets, logs, now);
      for (const [i, when] of checkInTimes(now, bed, logs).entries()) {
        const suggest = resting !== null && i % 2 === 1;
        await Notifications.scheduleNotificationAsync({
          identifier: `${CHECK_IN_PREFIX}${i}`,
          content: {
            title: suggest ? t('checkIn.restingTitle', { name: assetName(resting) }) : t('checkIn.title'),
            body: suggest ? t('checkIn.restingBody', { minutes: 20 }) : t('checkIn.body'),
            data: { url: '/log' },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
        });
      }
    };
    void sync();
    return () => {
      cancelled = true;
    };
  }, [on, bed, assets, logs, t, assetName]);
}

/** Tapping a reminder opens the screen it is about: the log sheet or the goals. */
export function useNotificationTaps() {
  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      const url = response?.notification.request.content.data?.url;
      if (typeof url !== 'string') return;
      // Handled once: without this, the same tap would reopen the screen on the next launch.
      Notifications.clearLastNotificationResponse();
      router.push(url as never);
    };
    void Notifications.getLastNotificationResponseAsync().then(open);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);
}
