import { dayKey, startOfWeek } from './dates';
import { buildDemo } from './demo';

describe('buildDemo', () => {
  const today = new Date(2026, 9, 7);
  const { assets, plan } = buildDemo(today);

  it('plans the current week from the demo goals', () => {
    expect(plan.weekFrom).toBe(dayKey(startOfWeek(today)));
    const planned = (id: string) => plan.sessions.filter((s) => s.assetId === id).reduce((n, s) => n + s.minutes, 0);
    for (const a of assets.filter((x) => x.weeklyGoalMinutes)) expect(planned(a.id)).toBe(a.weeklyGoalMinutes);
  });

  it('keeps Sunday free and every session inside the week', () => {
    const monday = startOfWeek(today);
    expect(plan.sessions.every((s) => s.day >= dayKey(monday) && s.day < dayKey(new Date(2026, 9, 11)))).toBe(true);
  });
});
