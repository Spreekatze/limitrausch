<template>
  <q-card class="event-card" v-if="event">
    <q-card-section class="event-title">
      <div>
        {{ event.eventType !== EVENT_TYPE.UNDEFINED ? event.eventType : '' }}
      </div>
      <div>{{ getEventTitle(event) }}</div>
    </q-card-section>

    <q-separator />

    <q-card-section class="event-general-data">
      <q-card-section class="event-server row">
        <div>Discord:</div>
        <div>
          <q-icon
            class="server-icon"
            :name="`${getGuildIconUrl(event.discordServer?.id, event.discordServer?.icon)}`"
          />
          {{ event.discordServer?.name }}
        </div>
      </q-card-section>
      <q-card-section class="event-date" horizontal>
        <div>Termin:</div>
        <div>
          {{ formatEventDay(event.startTime) }}, {{ formatEventTime(event.startTime) }} -
          {{ formatEventTime(event.endTime) }}
        </div>
      </q-card-section>
      <q-card-section class="event-leader" horizontal>
        <div>Raidlead:</div>
        <div>
          {{ event.leader?.name }}
        </div>
      </q-card-section>
    </q-card-section>

    <q-separator />
    <q-card-section class="event-description">
      <div class="event-description__text">
        {{ event.description }}
      </div>
      <q-img class="event-description__image" :src="event.imageUrl" alt="Event image" />
    </q-card-section>

    <q-separator />

    <q-card-section class="event-signups">
      <div>Anmeldungen</div>
      <div>Angemeldet: {{ event.signUpCount }}</div>
      <div v-for="signUp in event.signUps" :key="signUp.id">
        <q-img class="signup-icon" :src="getJobIcon(signUp.jobFirstPrio.id)" />
      </div>
      <div>Gesucht:</div>
    </q-card-section>
  </q-card>
  <q-card v-if="!loading && !event">
    <p>Etwas lief schief. :/</p>
  </q-card>
</template>

<script setup lang="ts">
import { getEventById } from '@/api/events';
import { useNotify } from '@/composable/useNotify';
import { getJobIcon } from '@/constants/job-icons';
import { formatEventDay, formatEventTime, getEventTitle } from '@/utils/calendar';
import { getGuildIconUrl } from '@/utils/discordGuild';
import { EVENT_TYPE, type Locale, type Event } from '@limitrausch/contracts';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const route = useRoute();
const notify = useNotify();
const { locale } = useI18n();

const currentLocale = computed<Locale>(() => (locale.value === 'en' ? 'en' : 'de'));

const event = ref<Event | null>(null);
const loading = ref<boolean>(false);

onMounted(async () => {
  loading.value = true;
  try {
    event.value = await getEventById(String(route.query.id));
    loading.value = false;
  } catch (error) {
    notify.error(error instanceof Error ? error.message : String(error));
  }
});
</script>
