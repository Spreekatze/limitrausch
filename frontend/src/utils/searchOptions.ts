import type { LocalizedLabels, LocalizedAliases } from '@limitrausch/contracts';
import type { Ref } from 'vue';

export interface SearchOption {
  value: string | number;
  label: LocalizedLabels;
  aliases?: LocalizedAliases;
}

export function filterOptions<T extends SearchOption>(
  input: string,
  update: (callback: () => void) => void,
  options: T[],
  filteredOptions: Ref<T[]>,
) {
  update(() => {
    const search = input.toLowerCase().trim();

    filteredOptions.value = options.filter((option) => {
      const label: string[] = option.label;
      const aliases: string[] = [...(option.aliases?.de ?? []), ...(option.aliases.en ?? [])];
      return [...label, ...aliases].some((text) => text.toLowerCase().includes(search));
    });
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
