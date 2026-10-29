<template>
  <q-card class="server-configuration-card">
    <q-card-section> Serverkonfiguration </q-card-section>
    <q-card-section>
      <GuildSelect v-model="guild" label="Server auswählen" />
    </q-card-section>
    <q-card-section>
      <q-select
        v-model="roleIdsBannedFromParticipating"
        :options="roles"
        label="Von der Teilnahme ausgeschlossene Rollen"
        option-label="name"
        option-value="id"
        emit-value
        map-options
        multiple
        use-input
        use-chips
        clearable
        :loading="loading"
        :disable="!guild || loading"
      />

      <q-select
        v-model="roleIdsAllowedToManageEvents"
        :options="roles"
        label="Rollen mit Eventverwaltungsrechten"
        option-label="name"
        option-value="id"
        emit-value
        map-options
        multiple
        use-input
        use-chips
        clearable
        :loading="loading"
        :disable="!guild || loading"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { DiscordRoleOption, UserGuild } from '@limitrausch/contracts';
import { ref, watch } from 'vue';
import GuildSelect from '@/components/GuildSelect.vue';
import { getGuildConfigById } from '@/api/guild';

const guild = ref<UserGuild | null>(null);

const roles = ref<DiscordRoleOption[]>([]);
const roleIdsBannedFromParticipating = ref<string[]>([]);
const roleIdsAllowedToManageEvents = ref<string[]>([]);
const loading = ref(false);

watch(
  () => guild.value?.id,
  async (guildId, _oldGuildId, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    roles.value = [];
    roleIdsBannedFromParticipating.value = [];
    roleIdsAllowedToManageEvents.value = [];

    if (!guildId) return;

    loading.value = true;

    try {
      const response = await getGuildConfigById(guildId);

      if (cancelled) return;

      roles.value = response.roles;

      roleIdsBannedFromParticipating.value =
        response.guildConfig.roleIDsBannedFromParticipating ?? [];

      roleIdsAllowedToManageEvents.value = response.guildConfig.roleIDsAllowedToManageEvents ?? [];
    } catch (error) {
      if (!cancelled) {
        console.error('Serverkonfiguration konnte nicht geladen werden.', error);
      }
    } finally {
      if (!cancelled) {
        loading.value = false;
      }
    }
  },
);
</script>
