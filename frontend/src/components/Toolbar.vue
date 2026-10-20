<template>
  <q-toolbar>
    <router-link to="/">
      <q-avatar size="42px">
        <img src="/Limitrausch.ico" alt="Limitrausch logo" />
      </q-avatar>
    </router-link>
    <q-toolbar-title class="app-header__title">Limitrausch</q-toolbar-title>
    <template v-if="$q.screen.gt.xs">
      <q-btn
        v-if="authStore.loggedIn"
        flat
        class="app-header__button"
        label="Dashboard"
        icon="dashboard"
        to="/dashboard"
      />
      <q-btn flat class="app-header__button" label="Event-Übersicht" icon="event" to="/events" />

      <!-- TODO: when you enable the below: remove login button from dashboard and enable beforeEach on Router -->
      <!-- <q-btn
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
    :label="authStore.user?.username"
    icon="logout"
    @click="authStore.logoutCurrentUser"
    /> -->
    </template>
    <template v-else>
      <q-btn flat round icon="menu">
        <q-menu hover auto-close>
          <q-list>
            <q-item clickable v-if="authStore.loggedIn">
              <q-item-section>Dashboard</q-item-section>
            </q-item>
            <!-- <q-item clickable>
              <q-item-section>Guides</q-item-section>
            </q-item> -->
            <q-item clickable to="/events">
              <q-item-section>Eventkalender</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </template>
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
    <q-btn flat :label="locale.startsWith('de') ? 'DE' : 'EN'" @click="toggleLanguage" />
  </q-toolbar>
</template>

<script setup lang="ts">
import { Dark } from 'quasar';
import { ref, watch } from 'vue';
import { useAuthStore } from '@/stores/auth-store';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const { locale } = useI18n();

const darkModeStorageKey = 'limitrausch-dark-mode';
const darkMode = ref(localStorage.getItem(darkModeStorageKey) === 'false' ? false : true);

Dark.set(darkMode.value);

watch(darkMode, (isDark) => {
  Dark.set(isDark);
  localStorage.setItem(darkModeStorageKey, String(isDark));
});

function toggleLanguage() {
  locale.value = locale.value.startsWith('de') ? 'en-US' : 'de-DE';
}
</script>
