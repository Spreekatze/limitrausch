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
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth-store';
import { getGuildIconUrl } from '@/utils/discordGuild';

withDefaults(
  defineProps<{
    modelValue: UserGuild | null;
    label?: string;
  }>(),
  {
    label: 'Server auswählen',
  },
);

const emit = defineEmits<{
  'update:modelValue': [guild: UserGuild | null];
}>();

const userGuilds = useAuthStore().user?.manageableGuilds ?? [];
const filteredGuilds = ref<UserGuild[]>([...userGuilds]);

function filterGuilds(value: string, update: (callback: () => void) => void) {
  update(() => {
    const search = value.toLowerCase().trim();

    filteredGuilds.value = search
      ? userGuilds.filter((guild) => guild.name.toLowerCase().includes(search))
      : userGuilds;
  });
}
</script>
