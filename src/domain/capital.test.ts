import { MAX_STARTING_HOURS, parseStartingMinutes } from './capital';

describe('parseStartingMinutes', () => {
  it('reads whole and decimal hours, with a comma or a dot', () => {
    expect(parseStartingMinutes('12')).toBe(720);
    expect(parseStartingMinutes('12.5')).toBe(750);
    expect(parseStartingMinutes('12,5')).toBe(750);
    expect(parseStartingMinutes(' 0 ')).toBe(0);
  });

  it('rejects anything that is not a number', () => {
    expect(parseStartingMinutes('')).toBeNull();
    expect(parseStartingMinutes('.')).toBeNull();
    expect(parseStartingMinutes('abc')).toBeNull();
    expect(parseStartingMinutes('-5')).toBeNull();
    expect(parseStartingMinutes('1.2.3')).toBeNull();
  });

  it('caps huge values', () => {
    expect(parseStartingMinutes('999999999')).toBe(MAX_STARTING_HOURS * 60);
  });
});
