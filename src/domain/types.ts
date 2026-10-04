export type EnergyType = 'body' | 'creative' | 'mind' | 'recovery';

export const ENERGY_TYPES: EnergyType[] = ['body', 'creative', 'mind', 'recovery'];

/** How often the user means to do an asset. Momentum decays relative to it. */
export type Rhythm = 'daily' | 'fewPerWeek' | 'weekly' | 'whenever';

export const RHYTHMS: Rhythm[] = ['daily', 'fewPerWeek', 'weekly', 'whenever'];

export type PaletteKey =
  | 'magenta'
  | 'violet'
  | 'vermilion'
  | 'sky'
  | 'olive'
  | 'brown'
  | 'slate'
  | 'grey';

export type IconKey =
  | 'guitar'
  | 'keys'
  | 'wave'
  | 'mic'
  | 'headphones'
  | 'pencil'
  | 'camera'
  | 'vase'
  | 'dumbbell'
  | 'route'
  | 'leaf'
  | 'mountain'
  | 'ball'
  | 'code'
  | 'ai'
  | 'book'
  | 'speech'
  | 'pawn'
  | 'candles'
  | 'cards'
  | 'tv'
  | 'gamepad'
  | 'moon'
  | 'pot'
  | 'star';

/**
 * What stands for an asset instead of its line icon: an emoji, or a photo the
 * user took (their guitar, their bike). Photos are file names in the app's
 * document folder, not full paths, because iOS moves that folder on updates.
 */
export type AssetFace = { kind: 'emoji'; emoji: string } | { kind: 'photo'; file: string };

/** Anything the user invests time in: a hobby, a skill, or recovery. */
export interface Asset {
  id: string;
  /** Set for catalog assets; their display name comes from translations. */
  catalogId?: string;
  /** Set for custom assets the user named themselves. */
  customName?: string;
  icon: IconKey;
  /** Shown instead of `icon` when set. */
  face?: AssetFace;
  color: PaletteKey;
  energy: EnergyType;
  rhythm: Rhythm;
  /** Hours put in before the app, so capital starts where the user really is. */
  startingMinutes: number;
  weeklyGoalMinutes?: number;
  /** Weekdays the planner may use for it, 0 = Monday … 6 = Sunday. Every day when unset. */
  planDays?: number[];
  /** Shortest and longest planned session, in minutes. Defaults come from the energy type. */
  sessionMinutes?: { min: number; max: number };
  createdAt: string;
}

export interface LogEntry {
  id: string;
  assetId: string;
  /** Local calendar day, `YYYY-MM-DD`. */
  day: string;
  minutes: number;
  note?: string;
  createdAt: string;
}

/** Recovery is in every portfolio: rest counts as an investment. */
export const RECOVERY_ID = 'recovery';
