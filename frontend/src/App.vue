<template>
  <q-layout view="hHh lpr fFf">
    <q-header elevated class="app-header" height-hint="98">
      <Toolbar />
    </q-header>

    <q-page-container>
      <router-view />
      <KofiButton />
    </q-page-container>
    <Footer />
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useNotify } from './composable/useNotify';
import { useAuthStore } from './stores/auth-store.js';
import { getUserErrorMessage } from './utils/error-messages';
import Toolbar from './components/Toolbar.vue';
import Footer from './components/Footer.vue';
import KofiButton from './components/KofiButton.vue';
const authStore = useAuthStore();
const notify = useNotify();

onMounted(() => {
  authStore.initAuth().catch((error) => {
    notify.error(getUserErrorMessage(error));
  });
});
</script>
