<template>
  <q-card>
    <q-card-section> Serverkonfiguration </q-card-section>
    <q-card-section>
      <GuildSelect v-model="guild" label="Server auswählen" />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { UserGuild } from '@limitrausch/contracts';
import { ref } from 'vue';
import GuildSelect from '@/components/GuildSelect.vue';

const guild = ref<UserGuild | null>(null);
</script>
