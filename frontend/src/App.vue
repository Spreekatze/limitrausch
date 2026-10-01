<template>
  <q-layout view="hHh lpr fFf">
    <q-header elevated class="app-header" height-hint="98">
      <Toolbar />
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import Toolbar from './components/Toolbar.vue';
</script>
