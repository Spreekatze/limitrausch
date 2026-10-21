import {
  EVENT_DIFFICULTY,
  EVENT_TYPE,
  type EventDifficulty,
  type EventType,
} from '@limitrausch/contracts';
import type { LocalizedLabels, LocalizedAliases } from './event-settings-labels';

interface GameContent {
  value: string;
  types: EventType[];
  patch: string;
  labels: LocalizedLabels;
  aliases: LocalizedAliases;
  difficulty?: Partial<Record<EventType, EventDifficulty>>;
}

export const CURRENT_PATCH = '7.5';

export const EXPANSION = {
  2: 'A Realm Reborn',
  3: 'Heavensward',
  4: 'Stormblood',
  5: 'Shadowbringers',
  6: 'Endwalker',
  7: 'Dawntrail',
  8: 'Evercold',
};

export const GAME_CONTENT: GameContent[] = [
  {
    value: 'Enuo',
    types: [EVENT_TYPE.TRIAL],
    patch: '7.5',
    labels: {
      de: 'Enuo',
      en: 'Enuo',
    },
    aliases: {
      de: ['Ex7'],
      en: ['The Unmaking'],
    },
    difficulty: {
      [EVENT_TYPE.TRIAL]: EVENT_DIFFICULTY.HARD,
      [EVENT_TYPE.MINE]: EVENT_DIFFICULTY.HARD,
      [EVENT_TYPE.UNSYNC]: EVENT_DIFFICULTY.NORMAL,
    },
  },
  {
    value: 'Zelenia',
    types: [EVENT_TYPE.TRIAL],
    patch: '7.2',
    labels: {
      de: 'Zelenia',
      en: 'Zelenia',
    },
    aliases: {
      de: ['Ex4'],
      en: ['Recollection'],
    },
  },
  {
    value: 'M1S',
    types: [EVENT_TYPE.RAID],
    patch: '7.01',
    labels: {
      de: 'R1S',
      en: 'M1S',
    },
    aliases: {
      de: ['Schwarze Katze', 'Halbschwergewicht R1 (episch)'],
      en: ['Black Cat', 'AAC Light-heavyweight M1 (Savage)'],
    },
  },
];
