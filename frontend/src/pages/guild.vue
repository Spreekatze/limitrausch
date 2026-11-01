<template>
  <q-card class="guild-configuration-card">
    <q-card-section class="titel"> Serverkonfiguration </q-card-section>
    <q-card-section class="guild-select">
      <GuildSelect
        v-model="guild"
        :guilds="
          authStore.user?.manageableGuilds.filter((guild) => guild.isAdminOrOwner === true) ?? []
        "
        placeholder="Server auswählen"
      />
    </q-card-section>
    <q-card-section class="config">
      <q-table
        class="role-table"
        row-key="id"
        flat
        dense
        bordered
        title="Rollenberechtigungen"
        :loading="loading"
        :rows="roles"
        :columns="roleColumns"
        :filter="roleFilter"
        no-data-label="Gilde nicht gewählt oder deiner Gilde fehlt der Discord-Bot."
        no-results-label="Dem Filter entspricht keine Rolle."
        virtual-scroll
        :rows-per-page-options="[0]"
      >
        <template #top-right>
          <q-input
            v-model="roleFilter"
            placeholder="Rollen filtern"
            outlined
            dense
            clearable
            debounce="300"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>

        <template #header-cell="props">
          <q-th :props="props">
            <div
              class="row items-center no-wrap"
              :class="props.col.align === 'center' ? 'justify-center' : ''"
            >
              {{ props.col.label }}

              <q-icon
                v-if="columnTooltips[props.col.name]"
                name="info"
                size="16px"
                class="q-ml-xs cursor-help text-grey-7"
              >
                <q-tooltip>
                  {{ columnTooltips[props.col.name] }}
                </q-tooltip>
              </q-icon>
            </div>
          </q-th>
        </template>

        <template #body-cell-allowed="props">
          <q-td :props="props" class="text-center">
            <q-checkbox
              :model-value="roleIDsAllowedToManageEvents.includes(props.row.id)"
              :disable="!guild || loading || isSaving"
              @update:model-value="(checked) => setRolePermission(props.row.id, 'allowed', checked)"
            />
          </q-td>
        </template>

        <template #body-cell-banned="props">
          <q-td :props="props" class="text-center">
            <q-checkbox
              :model-value="roleIDsBannedFromParticipating.includes(props.row.id)"
              :disable="!guild || loading || isSaving"
              @update:model-value="(checked) => setRolePermission(props.row.id, 'banned', checked)"
            />
          </q-td>
        </template>

        <template #no-data="{ icon, message, filter }">
          <div class="full-width row flex-center q-gutter-sm text-grey-7">
            <q-spinner v-if="loading" size="2em" color="primary" />
            <q-icon v-else size="2em" name="sentiment_dissatisfied" />
            <span> {{ message }} </span>
            <q-icon v-if="!loading" size="2em" :name="filter ? 'filter_b_and_w' : icon" />
          </div>
        </template>

        <template #loading>
          <q-inner-loading showing color="primary" />
        </template>
      </q-table>

      <q-btn
        label="Speichern"
        :loading="isSaving"
        :disable="isSaving || !guild || loading"
        @click="saveConfig"
        class="q-mt-md"
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
import { getUserErrorMessage } from '@/utils/error-messages';
import type { QTableColumn } from 'quasar';

const authStore = useAuthStore();
const notify = useNotify();
const guild = ref<UserGuild | null>(null);

const roles = ref<DiscordRoleOption[]>([]);
const roleIDsBannedFromParticipating = ref<string[]>([]);
const roleIDsAllowedToManageEvents = ref<string[]>([]);
const roleFilter = ref('');

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
        notify.error(getUserErrorMessage(error));
      }
    } finally {
      if (!cancelled) {
        loading.value = false;
      }
    }
  },
);

const roleColumns: QTableColumn[] = [
  {
    name: 'name',
    label: 'Rolle',
    field: 'name',
    align: 'left',
    sortable: true,
    headerStyle: 'width: 70%',
  },
  {
    name: 'allowed',
    label: 'Event-Manager',
    field: 'id',
    align: 'center',
    headerStyle: 'width: 15%',
  },
  {
    name: 'banned',
    label: 'Teilnahme-Verbot',
    field: 'id',
    align: 'center',
    headerStyle: 'width: 15%',
  },
];
const columnTooltips: Record<string, string> = {
  allowed: 'Mitglieder mit dieser Rolle dürfen Events verwalten.',
  banned: 'Mitglieder mit dieser Rolle dürfen nicht an Events teilnehmen.',
};

type RolePermission = 'allowed' | 'banned';
function setRolePermission(roleId: string, permission: RolePermission, checked: boolean): void {
  if (permission === 'allowed') {
    if (checked) {
      if (!roleIDsAllowedToManageEvents.value.includes(roleId)) {
        roleIDsAllowedToManageEvents.value = [...roleIDsAllowedToManageEvents.value, roleId];
      }

      roleIDsBannedFromParticipating.value = roleIDsBannedFromParticipating.value.filter(
        (id) => id !== roleId,
      );
    } else {
      roleIDsAllowedToManageEvents.value = roleIDsAllowedToManageEvents.value.filter(
        (id) => id !== roleId,
      );
    }
  } else {
    if (checked) {
      if (!roleIDsBannedFromParticipating.value.includes(roleId)) {
        roleIDsBannedFromParticipating.value = [...roleIDsBannedFromParticipating.value, roleId];
      }

      roleIDsAllowedToManageEvents.value = roleIDsAllowedToManageEvents.value.filter(
        (id) => id !== roleId,
      );
    } else {
      roleIDsBannedFromParticipating.value = roleIDsBannedFromParticipating.value.filter(
        (id) => id !== roleId,
      );
    }
  }
}

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
    notify.error(getUserErrorMessage(error));
  } finally {
    isSaving.value = false;
  }
}
</script>
