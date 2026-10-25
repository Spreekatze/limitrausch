import { EVENT_TYPE } from '@/api/events';
import type { EventDifficulty, EventType, LabelOptions, StatusType } from '@limitrausch/contracts';
import { EVENT_DIFFICULTY, STATUS_TYPE } from '@limitrausch/contracts/eventSchema';

export const EVENT_DIFFICULTY_LABELS: Record<EventDifficulty, LabelOptions> = {
  [EVENT_DIFFICULTY.EASY]: { labels: { de: 'Einfach', en: 'Easy' } },
  [EVENT_DIFFICULTY.NORMAL]: { labels: { de: 'Normal', en: 'Normal' } },
  [EVENT_DIFFICULTY.HARD]: { labels: { de: 'Schwierig', en: 'Hard' } },
  [EVENT_DIFFICULTY.ULTIMATIV]: { labels: { de: 'Profi', en: 'Expert' } },
};

export const EVENT_TYPE_OPTIONS: Partial<Record<EventType, LabelOptions>> = {
  [EVENT_TYPE.TRIAL]: {
    labels: { de: 'Extrem-Prüfung', en: 'Extreme Trial' },
  },
  [EVENT_TYPE.RAID]: {
    labels: { de: 'Epischer Raid (Savage)', en: 'Savage Raid' },
  },
  [EVENT_TYPE.ULTIMATE]: {
    labels: { de: 'Fataler Raid (Ultimate)', en: 'Ultimate' },
  },
  [EVENT_TYPE.FIELD_OPERATION]: {
    labels: { de: 'Feldexkursion', en: 'Field Operation' },
  },
  [EVENT_TYPE.DEEP_DUNGEON]: {
    labels: { de: 'Tiefes Gewölbe', en: 'Deep Dungeon' },
  },
  [EVENT_TYPE.TREASUE_HUNT]: {
    labels: { de: 'Schatzkarten', en: 'Treasure Map' },
  },
  [EVENT_TYPE.V_C_Dungeon]: {
    labels: { de: 'Unstetes/Kurioses Gewölbe', en: 'Variant Dungeon / Criterion' },
  },
  [EVENT_TYPE.LIMITED_JOB]: {
    labels: { de: 'Beschränkter Job', en: 'Limited Job' },
  },
  [EVENT_TYPE.UNSYNC]: { labels: { de: 'Unsync', en: 'Unsync' } },
  [EVENT_TYPE.FATE]: { labels: { de: 'Fates', en: 'Fates' } },
  [EVENT_TYPE.MINE]: {
    labels: { de: 'MINE (alter Content)', en: 'MINE (old Content)' },
  },
  [EVENT_TYPE.PVP]: { labels: { de: 'PvP', en: 'PvP' } },
  [EVENT_TYPE.SERVER]: {
    labels: { de: 'Server-Event', en: 'Server event' },
  },
  [EVENT_TYPE.CHAOS]: {
    labels: { de: 'Chaotischer Allianz-Raid', en: 'Chaos Alliance Raid' },
  },
  [EVENT_TYPE.UNREAL]: {
    labels: { de: 'Traumprüfung', en: 'Unreal Trial' },
  },
};

export const EVENT_STATUS_LABEL: Record<StatusType, string> = {
  [STATUS_TYPE.ABSENCE]: 'Abwesend',
  [STATUS_TYPE.BENCH]: 'Bank',
  [STATUS_TYPE.LATE]: 'Spät',
  [STATUS_TYPE.TENTATIVE]: 'Vorläufig',
};
