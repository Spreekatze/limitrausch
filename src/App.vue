<template>
  <q-layout view="hHh lpr fFf">
    <q-header elevated class="app-header" height-hint="98">
      <q-toolbar>
        <router-link to="/">
          <q-avatar size="42px">
            <img src="/AE.png" alt="Aetheris logo" />
          </q-avatar>
        </router-link>
        <q-btn
          flat
          class="app-header__button"
          label="Event-Übersicht"
          icon="event"
          to="/events"
        />
        <q-btn
          flat
          class="app-header__button"
          label="Discord"
          icon="discord"
          :href="discordLink"
          target="_blank"
        />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
const discordLink: string = 'https://discord.gg/aetherisde';
</script>
