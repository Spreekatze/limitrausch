import {
  EVENT_DIFFICULTY,
  type EventType,
  type EventDifficulty,
  EVENT_TYPE,
  type StatusType,
  STATUS_TYPE,
} from '@limitrausch/contracts';

export const EVENT_DIFFICULTY_LABELS: Record<EventDifficulty, string> = {
  [EVENT_DIFFICULTY.EASY]: 'Einfach',
  [EVENT_DIFFICULTY.NORMAL]: 'Normal',
  [EVENT_DIFFICULTY.HARD]: 'Schwierig',
  [EVENT_DIFFICULTY.ULTIMATIV]: 'Profi',
};

interface EventTypeOption {
  labels: {
    de: string;
    en: string;
  };
  aliases: {
    de: string[];
    en: string[];
  };
}

export const EVENT_TYPE_OPTIONS: Partial<Record<EventType, EventTypeOption>> = {
  [EVENT_TYPE.TRIAL]: {
    labels: { de: 'Extrem-Prüfung', en: 'Extreme Trial' },
    aliases: { de: [], en: [] },
  },
  [EVENT_TYPE.RAID]: {
    labels: { de: 'Epischer Raid (Savage)', en: 'Savage Raid' },
    aliases: { de: [], en: [] },
  },
  [EVENT_TYPE.ULTIMATE]: {
    labels: { de: 'Fataler Raid (Ultimate)', en: 'Ultimate' },
    aliases: { de: [], en: [] },
  },
  [EVENT_TYPE.FIELD_OPERATION]: {
    labels: { de: 'Feldexkursion', en: 'Field Operation' },
    aliases: { de: [], en: [] },
  },
  [EVENT_TYPE.DEEP_DUNGEON]: {
    labels: { de: 'Tiefes Gewölbe', en: 'Deep Dungeon' },
    aliases: { de: [], en: [] },
  },
  [EVENT_TYPE.TREASUE_HUNT]: {
    labels: { de: 'Schatzkarten', en: 'Treasure Map' },
    aliases: { de: [], en: [] },
  },
  [EVENT_TYPE.V_C_Dungeon]: {
    labels: { de: 'Unstetes/Kurioses Gewölbe', en: 'Variant Dungeon / Criterion' },
    aliases: { de: [], en: [] },
  },
  [EVENT_TYPE.LIMITED_JOB]: {
    labels: { de: 'Beschränkter Job', en: 'Limited Job' },
    aliases: { de: [], en: [] },
  },
  [EVENT_TYPE.UNSYNC]: { labels: { de: 'Unsync', en: 'Unsync' }, aliases: { de: [], en: [] } },
  [EVENT_TYPE.FATE]: { labels: { de: 'Fates', en: 'Fates' }, aliases: { de: [], en: [] } },
  [EVENT_TYPE.MINE]: {
    labels: { de: 'MINE (alter Content)', en: 'MINE (old Content)' },
    aliases: { de: [], en: [] },
  },
  [EVENT_TYPE.PVP]: { labels: { de: 'PvP', en: 'PvP' }, aliases: { de: [], en: [] } },
  [EVENT_TYPE.SERVER]: {
    labels: { de: 'Server-Event', en: 'Server event' },
    aliases: { de: [], en: [] },
  },
  [EVENT_TYPE.CHAOS]: {
    labels: { de: 'Chaotischer Allianz-Raid', en: 'Chaos Alliance Raid' },
    aliases: { de: [], en: [] },
  },
  [EVENT_TYPE.UNREAL]: {
    labels: { de: 'Traumprüfung', en: 'Unreal Trial' },
    aliases: { de: [], en: [] },
  },
};

export const EVENT_STATUS_LABEL: Record<StatusType, string> = {
  [STATUS_TYPE.ABSENCE]: 'Abwesend',
  [STATUS_TYPE.BENCH]: 'Bank',
  [STATUS_TYPE.LATE]: 'Spät',
  [STATUS_TYPE.TENTATIVE]: 'Vorläufig',
};
