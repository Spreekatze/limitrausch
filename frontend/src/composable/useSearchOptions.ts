import { filterOptions, type SearchOption } from '@/utils/searchOptions';
import { type ComputedRef, ref, watch } from 'vue';

export function useSearchOptions(options: ComputedRef<SearchOption[]>) {
  const filteredOptions = ref<SearchOption[]>(options.value);

  watch(options, (newOptions) => {
    filteredOptions.value = newOptions;
  });

  function filter(input: string, update: (callback: () => void) => void) {
    filterOptions(input, update, options.value, filteredOptions);
  }

  return { filteredOptions, filter };
}
