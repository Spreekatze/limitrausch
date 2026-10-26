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
        <div style="font-style: italic">Termin:</div>
        <div>
          {{ formatEventDay(event.startTime) }}, {{ formatEventTime(event.startTime) }} -
          {{ formatEventTime(event.endTime) }}
        </div>
      </q-card-section>
      <q-card-section class="event-leader" horizontal>
        <div style="font-style: italic">Raidlead:</div>
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
      <!-- <div class="event-signups_looking">Gesucht:</div> -->
      <!-- <div>
        Angemeldet: {{ signUpsByStatus?.Normal?.length }} + ( {{ signUpsByStatus?.Bench?.length }} )
      </div> -->
      <div class="signup-category">
        <template v-for="{ signups, status } in signUpsByStatus" :key="status">
          <section class="signup-list">
            <p>
              {{ t(`event.signUpStatus.${status}`) }}
            </p>
            <q-card class="signup-card" v-for="signUp in signups ?? []" :key="signUp.id">
              <q-card-section class="firstPrio row">
                <q-img class="signup-icon" :src="getJobIcon(signUp.jobFirstPrio?.id)" />
                <div>{{ signUp.name }}</div>
              </q-card-section>
              <q-card-section class="flex" v-if="signUp.jobFlexSecondPrio">
                <template v-for="job in signUp.jobFlexSecondPrio ?? []" :key="job.id">
                  Flex:
                  <q-img class="signup-icon" :src="getJobIcon(job.id)" />
                </template>
              </q-card-section>
            </q-card>
          </section>
        </template>
      </div>
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
import { EVENT_TYPE, type Event, STATUS_TYPE } from '@limitrausch/contracts';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const route = useRoute();
const notify = useNotify();
const { t } = useI18n();

const loading = ref<boolean>(false);

const event = ref<Event | null>(null);
type SignUpStatus = NonNullable<NonNullable<Event['signUps']>[number]['status']> | 'Registered';
const statusOrder: SignUpStatus[] = [
  'Registered',
  STATUS_TYPE.TENTATIVE,
  STATUS_TYPE.LATE,
  STATUS_TYPE.BENCH,
  STATUS_TYPE.ABSENCE,
];

const signUpsByStatus = computed(() => {
  const signUps = event.value?.signUps ?? [];

  const grouped = Object.groupBy(signUps, (signUp) => signUp.status ?? 'Registered');

  return statusOrder.map((status) => ({
    status,
    signups: grouped[status] ?? [],
  }));
});

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
