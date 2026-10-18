<template>
  <q-card style="width: 50vw; justify-self: center">
    <q-form>
      <q-input v-model.lazy="title" label="Titel" />
      <q-input v-model.lazy="description" label="Beschreibung" type="textarea" />
      <q-select v-model="type" label="Typ" :options="typeLabels" emit-value />
    </q-form>
  </q-card>
</template>

<script setup lang="ts">
import { EVENT_DIFFICULTY_LABELS, EVENT_TYPE_LABELS } from '@/constants/event-settings-labels';
import { EventDiscordUser, Event, EventType, EventDifficulty } from '@limitrausch/contracts';
import { computed, ref } from 'vue';

const leader = ref<EventDiscordUser | null>(null);
const coLeaders = ref<EventDiscordUser[] | null>(null);
const title = ref<string | null>(null);
const description = ref<string | null>(null);
const imageUrl = ref<string | null>(null);
const startTime = ref<number | null>(null);
const endTime = ref<number | null>(null);
const type = ref<EventType | null>(null);
const typeLabels = computed(() =>
  Object.entries(EVENT_TYPE_LABELS)
    .filter(([, label]) => label !== '')
    .map(([value, label]) => ({
      label,
      value: Number(value),
    })),
);
const difficulty = ref<EventDifficulty | null>(null);
const difficultyLabels = computed(() =>
  Object.entries(EVENT_DIFFICULTY_LABELS)
    .filter(([, label]) => label !== '')
    .map(([value, label]) => ({
      label,
      value: Number(value),
    })),
);
const eventGoal = ref<string | null>(null);
// const isPublic = ref<boolean>(false);
</script>
