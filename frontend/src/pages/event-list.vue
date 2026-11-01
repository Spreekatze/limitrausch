<template>
  <q-card class="event-list-card">
    <q-card-section class="titel"> Event-Management </q-card-section>
    <q-card-section class="guild-select row">
      <GuildSelect
        :model-value="selectedGuild"
        @update:model-value="selectGuild"
        :guilds="
          authStore.user?.manageableGuilds.filter(
            (guild) => guild.hasEventManagingRights === true,
          ) ?? []
        "
        placeholder="Server auswählen"
      />
      <q-btn :disable="!selectedGuild" @click="createEvent">Event erstellen</q-btn>
    </q-card-section>
    <q-card-section v-if="selectedGuild" class="event-list">
      <div v-if="loadError" class="text-negative q-pa-md">
        <q-icon name="error_outline" class="q-mr-sm" />
        Die Events konnten nicht geladen werden.

        <div class="text-caption">{{ loadError }}</div>

        <q-btn flat dense color="primary" label="Erneut versuchen" @click="reloadEvents" />
      </div>
      <q-table
        v-else
        class="event-table"
        row-key="id"
        flat
        dense
        bordered
        :loading="loading"
        :rows="eventsByGuild"
        :columns="columns"
        :filter="eventFilter"
        :pagination="{
          sortBy: 'date',
          descending: false,
          rowsPerPage: 0,
        }"
        no-data-label="Für diesen Server wurden noch keine Events erstellt."
        no-results-label="Kein Event für den Filter gefunden."
      >
        <template #top-right>
          <q-input
            v-model="eventFilter"
            placeholder="Rollen filtern"
            outlined
            dense
            clearable
            debounce="300"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              @click.stop="editEvent(props.row.id)"
            >
              <q-tooltip>Bearbeiten</q-tooltip>
            </q-btn>

            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              :loading="deletingEventId === props.row.id"
              @click.stop="confirmDelete(props.row)"
            >
              <q-tooltip>Löschen</q-tooltip>
            </q-btn>
          </q-td>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
  <q-dialog v-model="showDeleteDialog" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <span class="q-ml-sm"
          >Möchtest du das Event "{{ eventToBeDeleted?.title ?? '?unknown?' }}" wirklich
          löschen?</span
        >
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Abbrechen" v-close-popup />
        <q-btn
          flat
          label="Löschen"
          color="negative"
          :loading="deletingEventId !== null"
          :disable="deletingEventId !== null"
          @click="deleteEvent(eventToBeDeleted)"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import type { UserGuild, Event } from '@limitrausch/contracts';
import { computed, ref, watch } from 'vue';
import GuildSelect from '@/components/GuildSelect.vue';
import { useAuthStore } from '@/stores/auth-store';
import { useNotify } from '@/composable/useNotify';
import { deleteEventById, getEvents } from '@/api/events';
import { useRoute, useRouter } from 'vue-router';
import { formatEventDay, formatEventTime } from '@/utils/calendar';
import { getUserErrorMessage } from '@/utils/error-messages';
import { ApiError } from '@/api/apiError';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const notify = useNotify();
const selectedGuild = computed<UserGuild | null>(() => {
  const serverId = route.query.serverId;

  if (typeof serverId !== 'string') return null;

  return (
    authStore.user?.manageableGuilds.find(
      (guild) => guild.id === serverId && guild.hasEventManagingRights,
    ) ?? null
  );
});
let activeController: AbortController | null = null;

const eventsByGuild = ref<Event[]>([]);
const deletingEventId = ref<number | null>(null);
const eventFilter = ref<string>('');

const loading = ref<boolean>(false);
const loadError = ref<string | null>(null);
const showDeleteDialog = ref<boolean>(false);
const eventToBeDeleted = ref<Event>();

const columns = [
  {
    name: 'date',
    label: 'Datum',
    field: (row: Event) => row.startTime,
    format: (value: number) => formatEventDay(value),
    align: 'right' as const,
    headerStyle: 'width: 80px',
    sortable: true,
  },
  {
    name: 'time',
    label: 'Uhrzeit',
    field: (row: Event) => `${formatEventTime(row.startTime)} - ${formatEventTime(row.endTime)}`,
    align: 'left' as const,
    headerStyle: 'width: 120px',
  },
  {
    name: 'signUpCount',
    label: 'Anmeldungen',
    field: (row: Event) => row.signUpCount ?? 0,
    align: 'center' as const,
    headerStyle: 'width: 50px',
  },
  {
    name: 'name',
    label: 'Titel',
    field: 'title',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: '',
    field: 'id',
    align: 'right' as const,
    headerStyle: 'width: 100px',
  },
];

function selectGuild(guild: UserGuild | null) {
  const query = { ...route.query };

  if (guild) {
    query.serverId = guild.id;
  } else {
    delete query.serverId;
  }

  void router.replace({ query });
}

async function loadEvents(guildId: string) {
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;

  loading.value = true;
  loadError.value = null;

  try {
    const response = await getEvents(undefined, guildId, controller.signal);
    if (controller.signal.aborted) return;
    eventsByGuild.value = response.postedEvents;
  } catch (error) {
    if (controller.signal.aborted) return;
    loadError.value = getUserErrorMessage(error);
  } finally {
    // Only active request allowed to end load state
    if (activeController === controller) {
      loading.value = false;
      activeController = null;
    }
  }
}

// Watch for changes in the serverId query parameter and load events accordingly
watch(
  () => selectedGuild.value?.id,
  (guildId, _oldGuildId, onCleanup) => {
    onCleanup(() => {
      activeController?.abort();
    });

    eventsByGuild.value = [];
    eventFilter.value = '';
    loadError.value = null;

    if (!guildId) {
      activeController?.abort();
      activeController = null;
      loading.value = false;
      return;
    }

    void loadEvents(guildId);
  },
  { immediate: true },
);

// Watch for changes in the user's manageable guilds and ensure they still have access to the selected guild
watch(
  () => [route.query.serverId, authStore.user?.manageableGuilds] as const,
  ([serverId, guilds]) => {
    if (typeof serverId !== 'string') return;
    if (!guilds) return;

    const hasAccess = guilds.some((guild) => guild.id === serverId && guild.hasEventManagingRights);

    if (hasAccess) return;

    const query = { ...route.query };
    delete query.serverId;

    void router.replace({ query });

    notify.warning(getUserErrorMessage(new ApiError('INSUFFICIENT_PERMISSIONS', 403)));
  },
  { immediate: true },
);

function reloadEvents() {
  const serverId = route.query.serverId;

  if (typeof serverId !== 'string' || !selectedGuild.value) {
    return;
  }

  void loadEvents(serverId);
}

function createEvent() {
  void router.push({ name: '/createEvent', query: { serverId: selectedGuild.value?.id } });
}

function editEvent(id: number) {
  void router.push(`/event/${id}/edit`);
}

function confirmDelete(event: Event) {
  eventToBeDeleted.value = event;
  showDeleteDialog.value = true;
}

async function deleteEvent(event: Event | undefined) {
  if (!event) {
    return;
  }

  deletingEventId.value = event.id;

  try {
    await deleteEventById(event.id);

    eventsByGuild.value = eventsByGuild.value.filter((item) => item.id !== event.id);

    notify.success('Event erfolgreich gelöscht.');
  } catch (error: unknown) {
    notify.error(getUserErrorMessage(error));
  } finally {
    deletingEventId.value = null;
    eventToBeDeleted.value = undefined;
    showDeleteDialog.value = false;
  }
}
</script>
