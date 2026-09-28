/**
 * Ready-made profile pictures: an emoji character on a two-tone tile, like the
 * profile pickers on streaming services. Emoji come from the system font, so
 * nothing needs licensing and nothing ships as an image.
 */

export interface AvatarPreset {
  id: string;
  emoji: string;
  /** Gradient from top-left to bottom-right. */
  colors: [string, string];
}

export type AvatarGroup = 'animals' | 'characters' | 'nature';

export const AVATAR_GROUPS: { id: AvatarGroup; presets: AvatarPreset[] }[] = [
  {
    id: 'animals',
    presets: [
      { id: 'dog', emoji: '🐶', colors: ['#FFD27A', '#F2994A'] },
      { id: 'cat', emoji: '🐱', colors: ['#FFB4C6', '#E4578A'] },
      { id: 'fox', emoji: '🦊', colors: ['#FFC58F', '#E4572E'] },
      { id: 'panda', emoji: '🐼', colors: ['#D7F5E3', '#4DB384'] },
      { id: 'koala', emoji: '🐨', colors: ['#D9E4F5', '#7C93C9'] },
      { id: 'tiger', emoji: '🐯', colors: ['#FFE08A', '#F29D38'] },
      { id: 'lion', emoji: '🦁', colors: ['#FCE38A', '#D9912B'] },
      { id: 'frog', emoji: '🐸', colors: ['#DDF7A8', '#6F8C10'] },
      { id: 'monkey', emoji: '🐵', colors: ['#F5D6B8', '#8A6D3B'] },
      { id: 'penguin', emoji: '🐧', colors: ['#CFEAFF', '#1E96C8'] },
      { id: 'owl', emoji: '🦉', colors: ['#E8D9C4', '#7B5E3C'] },
      { id: 'octopus', emoji: '🐙', colors: ['#F8C9E6', '#C2388A'] },
      { id: 'unicorn', emoji: '🦄', colors: ['#E8DDFF', '#9B7BF0'] },
      { id: 'bunny', emoji: '🐰', colors: ['#FDE2EC', '#E88AAE'] },
      { id: 'bear', emoji: '🐻', colors: ['#F1D3B0', '#A0673A'] },
      { id: 'hamster', emoji: '🐹', colors: ['#FFE9C7', '#E0A55C'] },
    ],
  },
  {
    id: 'characters',
    presets: [
      { id: 'alien', emoji: '👾', colors: ['#D8CCFF', '#6246EA'] },
      { id: 'robot', emoji: '🤖', colors: ['#D6E2EA', '#4A6B82'] },
      { id: 'ghost', emoji: '👻', colors: ['#E4E6F0', '#8C92AC'] },
      { id: 'astronaut', emoji: '🧑‍🚀', colors: ['#1F2A5C', '#6246EA'] },
      { id: 'wizard', emoji: '🧙', colors: ['#3A2C6B', '#9B7BF0'] },
      { id: 'ninja', emoji: '🥷', colors: ['#3A3F47', '#15171A'] },
      { id: 'superhero', emoji: '🦸', colors: ['#FFB199', '#E4572E'] },
      { id: 'mermaid', emoji: '🧜', colors: ['#B8F0E6', '#1E96C8'] },
      { id: 'vampire', emoji: '🧛', colors: ['#5A1A2C', '#B3261E'] },
      { id: 'elf', emoji: '🧝', colors: ['#D2F0C0', '#3E8E41'] },
      { id: 'dragon', emoji: '🐲', colors: ['#C8F2D0', '#1F8A5B'] },
      { id: 'dino', emoji: '🦖', colors: ['#E1F5B8', '#6F8C10'] },
    ],
  },
  {
    id: 'nature',
    presets: [
      { id: 'sun', emoji: '🌞', colors: ['#FFF1A8', '#F2B95C'] },
      { id: 'moon', emoji: '🌝', colors: ['#2B3566', '#6F87E6'] },
      { id: 'cactus', emoji: '🌵', colors: ['#E3F5CF', '#6F8C10'] },
      { id: 'mushroom', emoji: '🍄', colors: ['#FFD6D1', '#E4572E'] },
      { id: 'wave', emoji: '🌊', colors: ['#CDEBFA', '#1E96C8'] },
      { id: 'planet', emoji: '🪐', colors: ['#F6E0C4', '#C2388A'] },
      { id: 'fire', emoji: '🔥', colors: ['#FFD8A8', '#E4572E'] },
      { id: 'blossom', emoji: '🌸', colors: ['#FFE3EE', '#E88AAE'] },
    ],
  },
];

export const AVATAR_PRESETS: AvatarPreset[] = AVATAR_GROUPS.flatMap((g) => g.presets);

export type Avatar = { kind: 'preset'; id: string } | { kind: 'photo'; file: string };

export const DEFAULT_AVATAR: Avatar = { kind: 'preset', id: 'fox' };

export function avatarPreset(id: string): AvatarPreset {
  return AVATAR_PRESETS.find((p) => p.id === id) ?? AVATAR_PRESETS[0];
}
