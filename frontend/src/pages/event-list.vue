<template>
  <q-card class="event-list-card">
    <q-card-section class="titel"> Event-Management </q-card-section>
    <q-card-section class="guild-select row">
      <GuildSelect
        v-model="selectedGuild"
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
import { ref, watch } from 'vue';
import GuildSelect from '@/components/GuildSelect.vue';
import { useAuthStore } from '@/stores/auth-store';
import { useNotify } from '@/composable/useNotify';
import { deleteEventById, getEvents } from '@/api/events';
import { useRouter } from 'vue-router';
import { formatEventDay, formatEventTime } from '@/utils/calendar';

const authStore = useAuthStore();
const router = useRouter();
const notify = useNotify();
const selectedGuild = ref<UserGuild | null>(null);

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
    field: (row: Event) => formatEventDay(row.startTime),
    align: 'left' as const,
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
    name: 'name',
    label: 'Titel',
    field: 'title',
    align: 'left' as const,
  },
  {
    name: 'actions',
    label: '',
    field: 'id',
    align: 'right' as const,
    headerStyle: 'width: 100px',
  },
];

watch(
  () => selectedGuild.value?.id,
  async (guildId, _oldGuildId, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    eventsByGuild.value = [];
    loadError.value = null;

    if (!guildId) return;

    loading.value = true;

    try {
      const response = await getEvents(undefined, guildId);

      if (cancelled) return;

      eventsByGuild.value = response.postedEvents;
    } catch (error) {
      if (!cancelled) {
        loadError.value = error instanceof Error ? error.message : String(error);
      }
    } finally {
      if (!cancelled) {
        loading.value = false;
      }
    }
  },
);

function createEvent() {
  void router.push({ name: '/createEvent', query: { serverId: selectedGuild.value?.id } });
}

// Bearbeiten
function editEvent(id: number) {
  void router.push(`/event/${id}/edit`);
}

// Löschen mit Bestätigung
function confirmDelete(event: Event) {
  eventToBeDeleted.value = event;
  showDeleteDialog.value = true;
}

async function deleteEvent(event: Event | undefined) {
  if (!event) {
    return;
  }
  try {
    await deleteEventById(event.id);

    eventsByGuild.value = eventsByGuild.value.filter((item) => item.id !== event.id);

    notify.success('Event erfolgreich gelöscht.');
  } catch (error: unknown) {
    notify.error(error instanceof Error ? error.message : String(error));
  } finally {
    deletingEventId.value = null;
    eventToBeDeleted.value = undefined;
    showDeleteDialog.value = false;
  }
}

async function reloadEvents() {
  const guildId = selectedGuild.value?.id;

  if (!guildId) return;

  loading.value = true;
  loadError.value = null;

  try {
    const response = await getEvents(undefined, guildId);
    eventsByGuild.value = response.postedEvents;
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : String(error);
  } finally {
    loading.value = false;
  }
}
</script>
