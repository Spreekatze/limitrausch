import type { LocalizedLabels, LocalizedAliases } from '@/constants/event-settings-labels';
import type { Ref } from 'vue';

export interface SearchOption {
  value: string | number;
  label: string;
  aliases?: string[];
}

export function filterOptions<T extends SearchOption>(
  input: string,
  update: (callback: () => void) => void,
  options: T[],
  filteredOptions: Ref<T[]>,
) {
  update(() => {
    const search = input.toLowerCase().trim();

    filteredOptions.value = options.filter(
      (option) =>
        option.label.toLowerCase().includes(search) ||
        (option.aliases ?? []).some((alias) => alias.toLowerCase().includes(search)),
    );
  });
}

export function createLocalizedSearchFields(
  labels: LocalizedLabels,
  locale: string,
  aliases?: LocalizedAliases,
) {
  return {
    label: labels[locale.startsWith('de') ? 'de' : 'en'],
    aliases: [...Object.values(labels), ...Object.values(aliases ?? {}).flat()],
  };
}
