<template>
  <h1>Events</h1>
  <table>
    <thead>
      <tr>
        <th>Montag</th>
        <th>Dienstag</th>
        <th>Mittwoch</th>
        <th>Donnerstag</th>
        <th>Freitag</th>
        <th>Samstag</th>
        <th>Sonntag</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { fetchRaidHelperEvents, type RaidHelperEventsResponse } from '../api/raid-helper';

const error = ref<string | null>(null);
const eventData = ref<RaidHelperEventsResponse | null>(null);

// function eventDate(unixTime: number): Date {
//   return new Date(unixTime * 1000);
// }

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
