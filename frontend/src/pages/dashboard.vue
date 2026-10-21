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
    </div>
    <div v-else>
      <p>Aktuell nur für Admins nützlich.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { importRaidHelperEvents } from '@/api/events';
import { useAuthStore } from '@/stores/auth-store';
import { type RaidHelperImportResponse } from '@limitrausch/contracts';
import { ref } from 'vue';

const authStore = useAuthStore();
const importMessage = ref<RaidHelperImportResponse | null>(null);

async function importFromAetheris() {
  importMessage.value = await importRaidHelperEvents('1408172814879559721');
}
</script>
