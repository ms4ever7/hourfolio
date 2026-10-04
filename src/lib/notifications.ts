import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { checkInTimes, restingAsset } from '@/domain/day';
import { planReminders } from '@/domain/plan';
import { durationParts } from '@/domain/format';
import { weekNudge } from '@/domain/goals';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useSettingsStore } from '@/store/settings-store';
import { useAssetName } from './labels';
import { usePortfolio } from './usePortfolio';

const NUDGE_ID = 'week-nudge';

/**
 * Reminder syncs run one after another. A sync that started for older data
 * stops scheduling as soon as it is cancelled, and the next one starts only
 * after it has finished, so a stale reminder can't land after a newer sync cleared it.
 */
let syncing: Promise<unknown> = Promise.resolve();
const enqueue = (job: () => Promise<void>) => {
  syncing = syncing.then(job, job);
};

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
      if (cancelled) return;
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
    enqueue(sync);
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
      if (cancelled) return;
      const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
      await Promise.all(scheduled.filter((n) => n.identifier.startsWith(CHECK_IN_PREFIX)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
      if (!on || cancelled) return;
      const now = new Date();
      const resting = restingAsset(assets, logs, now);
      for (const [i, when] of checkInTimes(now, bed, logs).entries()) {
        if (cancelled) return;
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
    enqueue(sync);
    return () => {
      cancelled = true;
    };
  }, [on, bed, assets, logs, t, assetName]);
}

const PLAN_PREFIX = 'plan-';

/**
 * A note in the afternoon listing the sessions the plan has for today and
 * tomorrow that are not done yet. Recomputed whenever the plan or the logs
 * change, so logging a session takes it off the list (and the note, once empty).
 */
export function usePlanReminders() {
  const { t } = useTranslation();
  const assetName = useAssetName();
  const on = useSettingsStore((s) => s.planReminders);
  const wake = useSettingsStore((s) => s.wakeTime);
  const bed = useSettingsStore((s) => s.bedTime);
  const plans = usePortfolioStore((s) => s.plans);
  const { assets, logs } = usePortfolio();

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      if (cancelled) return;
      const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
      await Promise.all(scheduled.filter((n) => n.identifier.startsWith(PLAN_PREFIX)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
      if (!on || cancelled) return;
      for (const r of planReminders(plans, logs, new Date(), wake, bed)) {
        if (cancelled) return;
        const names = [...new Set(r.sessions.map((s) => assets.find((a) => a.id === s.assetId)).filter((a) => a !== undefined).map(assetName))];
        await Notifications.scheduleNotificationAsync({
          identifier: `${PLAN_PREFIX}${r.day}`,
          content: { title: t('plan.reminderTitle'), body: names.join(', '), data: { url: '/log' } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at },
        });
      }
    };
    enqueue(sync);
    return () => {
      cancelled = true;
    };
  }, [on, wake, bed, plans, assets, logs, t, assetName]);
}

/**
 * Tapping a reminder opens the screen it is about: the log sheet or the goals.
 * Waits for `ready` (the root stack is mounted) so a tap that launched the app
 * from a cold start isn't lost, and ignores taps before onboarding is done.
 */
export function useNotificationTaps(ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      const url = response?.notification.request.content.data?.url;
      if (typeof url !== 'string' || !useSettingsStore.getState().onboarded) return;
      try {
        router.push(url as never);
        // Handled once: without this, the same tap would reopen the screen on the next launch.
        Notifications.clearLastNotificationResponse();
      } catch {
        // Not navigable yet; the response stays for the next launch.
      }
    };
    void Notifications.getLastNotificationResponseAsync().then(open);
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [ready]);
}
