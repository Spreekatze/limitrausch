<template>hi</template>

<script setup lang="ts">
import { getEventById } from '@/api/events';
import { useNotify } from '@/composable/useNotify';
import type { Event } from '@limitrausch/contracts';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const notify = useNotify();

const event = ref<Event | null>(null);

onMounted(async () => {
  try {
    event.value = await getEventById(String(route.query.id));
  } catch (error) {
    notify.error(error instanceof Error ? error.message : String(error));
  }
});
</script>
