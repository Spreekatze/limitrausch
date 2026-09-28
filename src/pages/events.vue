<template>
  <h1>Events</h1>
  <p v-if="error">{{ error }}</p>
  <p>{{ eventData?.eventsOverall }}</p>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchRaidHelperEvents, type RaidHelperEventsResponse } from '../api/raid-helper';

const error = ref<string | null>(null);
const eventData = ref<RaidHelperEventsResponse | null>(null);

async function loadData() {
  eventData.value = await fetchRaidHelperEvents();
}

onMounted(() => {
  void loadData().catch((err: unknown) => {
    error.value = err instanceof Error ? err.message : String(err);
    console.error(err);
  });
});
</script>
