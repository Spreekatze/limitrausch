<template>
  <q-select
    :model-value="modelValue"
    :label="label"
    :options="search.options"
    option-label="name"
    multiple
    use-chips
    use-input
    input-debounce="500"
    :loading="search.loading"
    :max-values="limit"
    outlined
    :placeholder="modelValue.length ? undefined : placeholder"
    @update:model-value="updateModel"
    @input-value="updateSearchInput"
    @filter="filterOptions"
  >
    <template #selected-item="{ opt, index, removeAtIndex }">
      <q-chip dense removable @remove="removeAtIndex(index)">
        {{ opt.name }}
      </q-chip>
    </template>
    <template #loading>
      <q-spinner size="sm" color="primary" />
    </template>
    <template #no-option>
      <q-item v-if="!search.loading">
        <q-item-section class="text-grey text-center">
          {{
            search.query.length < 2
              ? 'Mindestens zwei Zeichen eingeben.'
              : 'Keine passenden Mitglieder gefunden.'
          }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { searchGuildMembers } from '@/api/events';
import { useNotify } from '@/composable/useNotify';
import { getUserErrorMessage } from '@/utils/error-messages';
import type { EventDiscordUser } from '@limitrausch/contracts';
import { onBeforeUnmount, reactive, watch } from 'vue';

const props = defineProps<{
  modelValue: EventDiscordUser[];
  guildId?: string;
  label: string;
  placeholder: string;
  limit?: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: EventDiscordUser[]];
}>();

const notify = useNotify();

const search = reactive<{
  options: EventDiscordUser[];
  query: string;
  loading: boolean;
  controller: AbortController | undefined;
}>({
  options: [],
  query: '',
  loading: false,
  controller: undefined,
});

watch(
  () => props.guildId,
  () => clearSearch(),
);

onBeforeUnmount(clearSearch);

function updateModel(value: EventDiscordUser[] | null) {
  emit('update:modelValue', value ?? []);
}

function updateSearchInput(value: string) {
  search.controller?.abort();
  search.controller = undefined;
  search.query = value.trim();
  search.options = [];
  search.loading = search.query.length >= 2 && Boolean(props.guildId);
}

async function filterOptions(
  query: string,
  update: (callback: () => void) => void,
  abort: () => void,
) {
  search.controller?.abort();
  search.controller = undefined;
  search.query = query.trim();

  update(() => {
    search.options = [];
  });

  if (search.query.length < 2 || !props.guildId) {
    search.loading = false;
    abort();
    return;
  }

  const controller = new AbortController();
  search.controller = controller;
  search.loading = true;

  try {
    const members = await searchGuildMembers(props.guildId, search.query, controller.signal);
    if (controller.signal.aborted) return;

    update(() => {
      search.options = members;
    });
  } catch (error) {
    if (controller.signal.aborted) return;

    update(() => {
      search.options = [];
    });
    notify.error(getUserErrorMessage(error));
  } finally {
    if (search.controller === controller) {
      search.controller = undefined;
      search.loading = false;
    }
  }
}

function clearSearch() {
  search.controller?.abort();
  search.controller = undefined;
  search.query = '';
  search.options = [];
  search.loading = false;
}
</script>
