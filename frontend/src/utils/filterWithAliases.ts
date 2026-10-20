import type { Ref } from 'vue';

export interface SearchOption {
  value: string | number;
  label: string;
  aliases: string[];
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
        option.aliases.some((alias) => alias.toLowerCase().includes(search)),
    );
  });
}
