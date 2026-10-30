<template>
  <q-select
    :model-value="modelValue"
    :placeholder="modelValue ? undefined : placeholder"
    :options="filteredGuilds"
    option-label="name"
    option-value="id"
    outlined
    use-input
    clearable
    @filter="filterGuilds"
    @update:model-value="onGuildSelected"
  >
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <q-icon
            :name="getGuildIconUrl(scope.opt.id, scope.opt.icon)"
            width="32px"
            height="32px"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt.name }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
    <template #selected-item="scope">
      <q-item-section avatar>
        <q-icon :name="getGuildIconUrl(scope.opt.id, scope.opt.icon)" width="32px" height="32px" />
      </q-item-section>
      <q-item-section>{{ scope.opt.name }}</q-item-section>
    </template>
    <template #no-option>
      <q-item>
        <q-item-section class="text-grey text-center">
          {{ search ? 'Keine passende Gilde gefunden.' : 'Keine Gilden verfügbar.' }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import type { UserGuild } from '@limitrausch/contracts';
import { computed, ref } from 'vue';
import { getGuildIconUrl } from '@/utils/discordGuild';

const props = withDefaults(
  defineProps<{
    modelValue: UserGuild | null;
    guilds: UserGuild[];
    placeholder?: string;
  }>(),
  {
    placeholder: 'Server auswählen',
  },
);

const emit = defineEmits<{
  'update:modelValue': [guild: UserGuild | null];
}>();

const search = ref('');
const filteredGuilds = computed(() => {
  const normalizedSearch = search.value.toLowerCase().trim();

  return normalizedSearch
    ? props.guilds.filter((guild) => guild.name.toLowerCase().includes(normalizedSearch))
    : props.guilds;
});

function filterGuilds(value: string, update: (callback: () => void) => void) {
  update(() => {
    search.value = value;
  });
}

function onGuildSelected(guild: UserGuild | null) {
  emit('update:modelValue', guild);
  search.value = '';

  // Suchfeld nach Auswahl verlassen
  requestAnimationFrame(() => {
    const input = document.activeElement;

    if (input instanceof HTMLElement) {
      input.blur();
    }
  });
}
</script>
