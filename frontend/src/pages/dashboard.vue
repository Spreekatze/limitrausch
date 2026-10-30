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
      <q-btn v-if="hasAdminRightsSomewhere" label="Server-Konfigurationen" to="/guild"></q-btn>
    </div>
    <div v-else-if="authStore.loggedIn && authStore.isAdmin">
      <p>Spannende Dinge für die Admins sind grad auskommentiert</p>
      <!-- <q-btn
        class="app-header__button"
        label="Import von Aetheris"
        icon="admin_panel_settings"
        @click="importFromAetheris"
      />
      <q-input outlined v-model="eventId" label="ID eines Raid-Helper Events" />
      <q-btn label="Import Event" @click="importRaidHelperEventById" />
      <q-btn label="Import Events eines Users" @click="importRaidHelperEventsByUser" /> -->
    </div>
    <div v-else>
      <p>Aktuell nur für Admins nützlich.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// import {
//   importRaidHelperEvent,
//   importRaidHelperEventsByServer,
//   importRaidHelperEventsByUser,
// } from '@/api/events';
// import { useNotify } from '@/composable/useNotify';
// import { type RaidHelperImportResponse } from '@limitrausch/contracts';
// import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth-store';
import { computed } from 'vue';

const authStore = useAuthStore();
const hasAdminRightsSomewhere = computed(
  () => authStore.user?.manageableGuilds.some((guild) => guild.isAdminOrOwner) ?? false,
);

// const hasEventManagingRightsSomewhere = computed(
//   () => authStore.user?.manageableGuilds.some((guild) => guild.hasEventManagingRights) ?? false,
// );

// const notify = useNotify();
// const importMessage = ref<RaidHelperImportResponse | null>(null);

// async function importFromAetheris() {
//   try {
//     importMessage.value = await importRaidHelperEventsByServer('1408172814879559721');
//     notify.success(JSON.stringify(importMessage.value));
//   } catch (error) {
//     importMessage.value = null;
//     notify.error(error instanceof Error ? error.message : 'Import fehlgeschlagen.');
//   }
// }

// const eventId = ref<string>();
// async function importRaidHelperEventById() {
//   if (!eventId.value) {
//     return;
//   }
//   try {
//     importMessage.value = await importRaidHelperEvent(eventId.value);
//     notify.success(JSON.stringify(importMessage.value));
//   } catch (error) {
//     importMessage.value = null;
//     notify.error(error instanceof Error ? error.message : 'Import fehlgeschlagen.');
//   }
// }
</script>
