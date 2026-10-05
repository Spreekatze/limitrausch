<template>
  <q-toolbar>
    <router-link to="/">
      <q-avatar size="42px">
        <img src="/limit_break.png" alt="Limitrausch logo" />
      </q-avatar>
    </router-link>
    <q-toolbar-title class="app-header__title">Limitrausch</q-toolbar-title>
    <q-btn flat class="app-header__button" label="Event-Übersicht" icon="event" to="/events" />
    <q-btn
      flat
      class="app-header__button"
      :icon="darkMode ? 'brightness_4' : 'brightness_7'"
      @click="
        () => {
          darkMode = !darkMode;
        }
      "
    />
    <!-- <q-btn
      flat
      class="app-header__button"
      label="Admin-Login"
      icon="admin_panel_settings"
      to="/admin"
    /> -->
  </q-toolbar>
</template>

<script setup lang="ts">
import { Dark } from 'quasar';
import { ref, watch } from 'vue';

const darkModeStorageKey = 'limitrausch-dark-mode';
const darkMode = ref(localStorage.getItem(darkModeStorageKey) === 'false' ? false : true);

Dark.set(darkMode.value);

watch(darkMode, (isDark) => {
  Dark.set(isDark);
  localStorage.setItem(darkModeStorageKey, String(isDark));
});
</script>
