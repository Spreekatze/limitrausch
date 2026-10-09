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

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EVENT_TYPE.TEST]: '',
  [EVENT_TYPE.UNDEFINED]: '',
  [EVENT_TYPE.TRIAL]: 'Extrem-Prüfung',
  [EVENT_TYPE.RAID]: 'Epischer Raid',
  [EVENT_TYPE.ULTIMATE]: 'Fataler Raid',
  [EVENT_TYPE.SQENIX_EVENT]: 'SE - Event',
  [EVENT_TYPE.FIELD_OPERATION]: 'Feldexkursion',
  [EVENT_TYPE.DEEP_DUNGEON]: 'Tiefes Gewölbe',
  [EVENT_TYPE.TREASUE_HUNT]: 'Schatzkarten',
  [EVENT_TYPE.V_C_Dungeon]: 'Unstetes/Kurioses Gewölbe',
  [EVENT_TYPE.LIMITED_JOB]: 'Beschränkter Job',
  [EVENT_TYPE.UNSYNC]: 'Unsync',
  [EVENT_TYPE.FATE]: 'Fates',
  [EVENT_TYPE.MINE]: 'MINE (alter Content)',
  [EVENT_TYPE.PVP]: 'PvP',
  [EVENT_TYPE.SERVER]: 'Server-Event',
};

export const EVENT_STATUS_LABEL: Record<StatusType, string> = {
  [STATUS_TYPE.ABSENCE]: 'Abwesend',
  [STATUS_TYPE.BENCH]: 'Bank',
  [STATUS_TYPE.LATE]: 'Spät',
  [STATUS_TYPE.TENTATIVE]: 'Vorläufig',
};
