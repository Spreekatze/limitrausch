<template>
  <div class="column align-center text-center">
    <!-- Remove this button once you enable login via Toolbar again -->
    <q-btn
      v-if="!authStore.loggedIn"
      flat
      class="app-header__button"
      label="Mit Discord anmelden"
      icon="login"
      @click="authStore.loginUser"
    />
    <q-btn
      v-if="authStore.loggedIn && !authStore.loading"
      flat
      class="app-header__button"
      label="Abmelden"
      icon="logout"
      @click="authStore.logoutCurrentUser"
    />
    <div v-if="authStore.loggedIn && !authStore.isAdmin" class="column align-center text-center">
      <p>Hier stehen später spannende Dinge für dich!</p>
      <p>Aktuell ist es aber nur für die Admins nützlich. :c</p>
    </div>
    <div v-else-if="authStore.loggedIn && authStore.isAdmin">
      <p>Spannende Dinge für die Admins</p>
      <q-btn
        class="app-header__button"
        label="Import von Aetheris"
        icon="admin_panel_settings"
        @click="importFromAetheris"
      />
      <p>{{ importMessage }}</p>
      <q-btn @click="createDialog = true">Event erstellen</q-btn>
    </div>
    <div v-else>
      <p>Aktuell nur für Admins nützlich.</p>
    </div>
  </div>
  <q-dialog v-model="createDialog">
    <q-card style="min-width: 350px">
      <q-select
        v-model="guild"
        label="Server"
        :options="filteredGuilds"
        option-label="name"
        option-value="id"
        emit-value
        map-options
        outlined
        use-input
        @filter="filterGuilds"
      >
        <template #option="scope">
          <q-item v-bind="scope.itemProps">
            <q-item-section avatar>
              <q-icon :name="getGuildIconUrl(scope.opt)" width="32px" height="32px" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ scope.opt.name }}</q-item-label>
            </q-item-section>
          </q-item>
        </template>
        <template #selected-item="scope">
          <q-item-section avatar>
            <q-icon :name="getGuildIconUrl(scope.opt)" width="32px" height="32px" />
          </q-item-section>
          <q-item-section>{{ scope.opt.name }}</q-item-section>
        </template>
      </q-select>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { importRaidHelperEvents } from '@/api/events';
import { useAuthStore } from '@/stores/auth-store';
import { type DiscordGuild, type RaidHelperImportResponse } from '@limitrausch/contracts';
import { ref } from 'vue';

const authStore = useAuthStore();
const importMessage = ref<RaidHelperImportResponse | null>(null);

const userGuilds = authStore.user?.userGuilds ?? [];
const filteredGuilds = ref<DiscordGuild[]>([...userGuilds]);
const createDialog = ref<boolean>(false);
const guild = ref<DiscordGuild | null>(null);

async function importFromAetheris() {
  importMessage.value = await importRaidHelperEvents('1408172814879559721');
}

function getGuildIconUrl(guild: DiscordGuild): string {
  console.log(guild);
  if (!guild) {
    return 'img:~/assets/icons/xiv.png';
  }
  if (!guild.icon) {
    return '';
  }
  const extension = guild.icon.startsWith('a_') ? 'gif' : 'png';
  return `img:https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${extension}?size=128`;
}

function filterGuilds(value: string, update: (callback: () => void) => void) {
  update(() => {
    const search = value.toLowerCase().trim();

    filteredGuilds.value = search
      ? userGuilds.filter((guild) => guild.name.toLowerCase().includes(search))
      : userGuilds;
  });
}
</script>
