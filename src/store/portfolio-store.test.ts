import { RECOVERY_ID } from '@/domain/types';
import { usePortfolioStore, type NewAsset } from './portfolio-store';

const guitar: NewAsset = { catalogId: 'guitar', icon: 'guitar', color: 'magenta', energy: 'creative', rhythm: 'fewPerWeek', startingMinutes: 0, weeklyGoalMinutes: 60 };

describe('portfolio store', () => {
  beforeEach(() => usePortfolioStore.getState().reset());

  it('keeps its saved-data version at 1 and passes any other version through instead of dropping the data', () => {
    // zustand discards saved data of another version when `migrate` is missing. Bump the version only with a real migration.
    const options = usePortfolioStore.persist.getOptions();
    expect(options.version).toBe(1);
    const saved = { assets: [{ id: 'x' }], logs: [], plans: [], badges: [] };
    expect(options.migrate?.(saved, 0)).toEqual(saved);
    expect(options.migrate?.(saved, 2)).toEqual(saved);
  });

  it('sets a portfolio up once; a second setup must not replace hobbies that have history', () => {
    const s = usePortfolioStore.getState();
    s.setUpPortfolio([guitar]);
    const ids = usePortfolioStore.getState().assets.map((a) => a.id);
    expect(ids).toHaveLength(2);
    expect(ids[1]).toBe(RECOVERY_ID);
    s.setUpPortfolio([]);
    expect(usePortfolioStore.getState().assets.map((a) => a.id)).toEqual(ids);
  });

  it('removing a hobby takes its logs, plan sessions, hour badges and goal history with it; recovery stays', () => {
    const s = usePortfolioStore.getState();
    s.setUpPortfolio([]);
    const id = s.addAsset(guitar);
    s.logTime({ assetId: id, day: '2026-09-28', minutes: 60 });
    s.logTime({ assetId: RECOVERY_ID, day: '2026-09-28', minutes: 30 });
    s.setPlan({
      weekFrom: '2026-09-28',
      sessions: [
        { id: 'p1', assetId: id, day: '2026-09-29', minutes: 30 },
        { id: 'p2', assetId: RECOVERY_ID, day: '2026-09-29', minutes: 30 },
      ],
      short: [{ assetId: id, minutes: 30 }],
    });
    s.recordBadges([
      { id: `hours:${id}:50`, day: '2026-09-28', weekFrom: '2026-09-28' },
      { id: 'firstHour', day: '2026-09-28', weekFrom: '2026-09-28' },
    ]);
    s.recordWeekGoals('2026-09-28', { goals: [{ assetId: id, minutes: 60 }], hobbies: [id] });

    s.removeAsset(RECOVERY_ID);
    expect(usePortfolioStore.getState().logs).toHaveLength(2);

    s.removeAsset(id);
    const after = usePortfolioStore.getState();
    expect(after.assets.map((a) => a.id)).toEqual([RECOVERY_ID]);
    expect(after.logs.map((l) => l.assetId)).toEqual([RECOVERY_ID]);
    expect(after.plans[0].sessions.map((x) => x.id)).toEqual(['p2']);
    expect(after.plans[0].short).toEqual([]);
    expect(after.badges.map((b) => b.id)).toEqual(['firstHour']);
    expect(after.weekGoals).toEqual([{ weekFrom: '2026-09-28', goals: [], hobbies: [] }]);
  });

  it('records a week’s goals and only rewrites them when they change; badges are never recorded twice', () => {
    const s = usePortfolioStore.getState();
    s.recordWeekGoals('2026-09-28', { goals: [{ assetId: 'a', minutes: 60 }], hobbies: ['a'] });
    const before = usePortfolioStore.getState().weekGoals;
    s.recordWeekGoals('2026-09-28', { goals: [{ assetId: 'a', minutes: 60 }], hobbies: ['a'] });
    expect(usePortfolioStore.getState().weekGoals).toBe(before);
    s.recordWeekGoals('2026-09-21', { goals: [], hobbies: ['a'] });
    s.recordWeekGoals('2026-09-28', { goals: [{ assetId: 'a', minutes: 90 }], hobbies: ['a'] });
    expect(usePortfolioStore.getState().weekGoals.map((w) => [w.weekFrom, w.goals[0]?.minutes])).toEqual([['2026-09-21', undefined], ['2026-09-28', 90]]);

    s.recordBadges([{ id: 'firstHour', day: '2026-09-28', weekFrom: '2026-09-28' }]);
    s.recordBadges([{ id: 'firstHour', day: '2026-09-29', weekFrom: '2026-09-28' }]);
    expect(usePortfolioStore.getState().badges).toEqual([{ id: 'firstHour', day: '2026-09-28', weekFrom: '2026-09-28' }]);
  });

  it('ignores a log edit that is not a positive number and keeps logs whole minutes', () => {
    const s = usePortfolioStore.getState();
    s.logTime({ assetId: RECOVERY_ID, day: '2026-09-28', minutes: 30 });
    const [entry] = usePortfolioStore.getState().logs;
    s.updateLog(entry.id, 0);
    s.updateLog(entry.id, Number.NaN);
    expect(usePortfolioStore.getState().logs[0].minutes).toBe(30);
    s.updateLog(entry.id, 44.6);
    expect(usePortfolioStore.getState().logs[0].minutes).toBe(45);
  });
});
