<template>
  <q-select
    :model-value="modelValue"
    :label="label"
    :options="filteredGuilds"
    option-label="name"
    option-value="id"
    outlined
    use-input
    @filter="filterGuilds"
    @update:model-value="emit('update:modelValue', $event)"
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
    label?: string;
  }>(),
  {
    label: 'Server auswählen',
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
</script>
