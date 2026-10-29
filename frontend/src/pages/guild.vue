<template>
  <q-card class="server-configuration-card">
    <q-card-section> Serverkonfiguration </q-card-section>
    <q-card-section>
      <GuildSelect
        v-model="guild"
        :guilds="authStore.user?.manageableGuilds ?? []"
        label="Server auswählen"
      />
    </q-card-section>
    <q-card-section>
      <q-select
        v-model="roleIDsBannedFromParticipating"
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
        v-model="roleIDsAllowedToManageEvents"
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

      <q-btn
        label="Speichern"
        :loading="isSaving"
        :disable="isSaving || !guild"
        @click="saveConfig"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { DiscordRoleOption, UserGuild } from '@limitrausch/contracts';
import { ref, watch } from 'vue';
import GuildSelect from '@/components/GuildSelect.vue';
import { getGuildConfigById, saveGuildConfig } from '@/api/guild';
import { useAuthStore } from '@/stores/auth-store';
import { useNotify } from '@/composable/useNotify';

const authStore = useAuthStore();
const notify = useNotify();
const guild = ref<UserGuild | null>(null);

const roles = ref<DiscordRoleOption[]>([]);
const roleIDsBannedFromParticipating = ref<string[]>([]);
const roleIDsAllowedToManageEvents = ref<string[]>([]);
const loading = ref(false);
const isSaving = ref(false);

watch(
  () => guild.value?.id,
  async (guildId, _oldGuildId, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    roles.value = [];
    roleIDsBannedFromParticipating.value = [];
    roleIDsAllowedToManageEvents.value = [];

    if (!guildId) return;

    loading.value = true;

    try {
      const response = await getGuildConfigById(guildId);

      if (cancelled) return;

      roles.value = response.guildRoles;

      roleIDsBannedFromParticipating.value =
        response.guildConfig?.roleIDsBannedFromParticipating ?? [];

      roleIDsAllowedToManageEvents.value = response.guildConfig?.roleIDsAllowedToManageEvents ?? [];
    } catch (error) {
      if (!cancelled) {
        notify.error(error instanceof Error ? error.message : String(error));
      }
    } finally {
      if (!cancelled) {
        loading.value = false;
      }
    }
  },
);

async function saveConfig(): Promise<void> {
  if (!guild.value || isSaving.value) return;

  isSaving.value = true;

  try {
    await saveGuildConfig(guild.value.id, {
      id: guild.value.id,
      name: guild.value.name,
      icon: guild.value.icon,
      roleIDsAllowedToManageEvents: roleIDsAllowedToManageEvents.value,
      roleIDsBannedFromParticipating: roleIDsBannedFromParticipating.value,
    });

    notify.success('Konfiguration erfolgreich gespeichert.');
  } catch (error: unknown) {
    notify.error(error instanceof Error ? error.message : String(error));
  } finally {
    isSaving.value = false;
  }
}
</script>
