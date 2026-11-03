<template>
  <div class="event-editor-page">
    <q-btn flat icon="arrow_back" label="Zurück" class="page-back-button" @click="goBack" />
    <q-card v-if="!guild && !isEditMode" class="creation-card">
      <q-card-section class="creation-card__header">Discord-Server auswählen</q-card-section>
      <q-card-section>
        <GuildSelect
          :model-value="null"
          :guilds="manageableGuilds"
          placeholder="Server auswählen"
          @update:model-value="selectGuild"
        />
      </q-card-section>
    </q-card>
    <q-card v-if="isEditMode && loading" class="creation-card">
      <q-card-section>Event wird geladen...</q-card-section>
    </q-card>
    <q-card v-if="isEditMode && !loading && loadError" class="creation-card">
      <q-card-section>{{ loadError }}</q-card-section>
    </q-card>
    <q-card v-if="isEditMode && !loading && eventToEdit && !guild" class="creation-card">
      <q-card-section>Für dieses Event fehlen die Serverdaten.</q-card-section>
    </q-card>
    <q-card v-if="guild" class="creation-card">
      <q-card-section class="creation-card__header row items-center relative-position">
        <div class="absolute-center">{{ isEditMode ? 'Event bearbeiten' : 'Event erstellen' }}</div>
        <q-avatar class="q-ml-auto">
          <q-icon :name="getGuildIconUrl(guild.id, guild.icon)" />
        </q-avatar>
      </q-card-section>
      <q-card-section>
        <q-form @submit="submitEvent">
          <div class="creation-form__event-type">
            <q-select
              v-model="type"
              label="Event-Typ *"
              :options="filteredTypeOptions"
              input-debounce="0"
              emit-value
              map-options
              outlined
              :disable="isEditMode"
              @filter="filterTypeOptions"
              @keydown.backspace="clearType"
            />
            <q-select
              v-model="content"
              label="Inhalt *"
              :options="filteredContentOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              use-input
              input-debounce="0"
              outlined
              :disable="isEditMode"
              @filter="filterContentOptions"
              @keydown.backspace="clearContent"
            />
            <q-input v-model.lazy="goal" label="Zielstellung" outlined />
            <q-select
              v-model="difficulty"
              label="Schwierigkeit"
              :options="difficultyLabels"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
            />
          </div>

          <div class="creation-form__time row">
            <q-input :model-value="formattedDate" label="Datum" outlined>
              <q-popup-proxy>
                <q-date v-model="date" mask="YYYY-MM-DD" today-btn minimal />
              </q-popup-proxy>
            </q-input>
            <q-input
              v-model="startTime"
              label="Startzeit"
              mask="##:##"
              placeholder="HH:mm"
              outlined
              @blur="startTime = correctTime(startTime)"
              @keydown.enter="startTime = correctTime(startTime)"
            />

            <q-input
              v-model="endTime"
              label="Endzeit"
              mask="##:##"
              placeholder="HH:mm"
              outlined
              @blur="endTime = correctTime(endTime)"
              @keydown.enter="startTime = correctTime(startTime)"
            />
          </div>

          <div class="creation-form__leader row">
            <GuildMemberSelect
              v-model="leaderSelection"
              :guild-id="guild?.id"
              label="Raidlead"
              placeholder="Discord-Namen eingeben. Leer lassen, wenn du selbst Raidlead bist."
              :limit="1"
            />
            <!-- <GuildMemberSelect
              v-model="coLeaders"
              :guild-id="guild?.id"
              label="Co-Leader"
              placeholder="Discord-Namen eingeben."
            /> -->
          </div>
          <div class="creation-form__channel row"></div>
          <q-input :model-value="title" label="Titel" filled @update:model-value="onTitleInput" />
          <q-input v-model.lazy="description" label="Beschreibung" type="textarea" filled />
          <!-- TODO: Image -->
          <!-- TODO: isPublic -->
          <q-btn v-if="!isEditMode" label="Formular zurücksetzen" @click="resetForm" />
          <q-btn
            :label="isEditMode ? 'Änderungen speichern' : 'Event erstellen'"
            type="submit"
            :disable="!creationAllowed || loading"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ApiError } from '@/api/apiError';
import { createEventOnGuild, getEventById, updateEventById } from '@/api/events';
import GuildMemberSelect from '@/components/GuildMemberSelect.vue';
import GuildSelect from '@/components/GuildSelect.vue';
import { useNotify } from '@/composable/useNotify';
import { useSearchOptions } from '@/composable/useSearchOptions';
import { EVENT_DIFFICULTY_LABELS, EVENT_TYPE_OPTIONS } from '@/constants/event-settings-labels';
import { GAME_CONTENT } from '@/constants/game-content';
import { useAuthStore } from '@/stores/auth-store';
import { getGuildIconUrl } from '@/utils/discordGuild';
import { getUserErrorMessage } from '@/utils/error-messages';
import { createLocalizedSearchFields } from '@/utils/searchOptions';
import {
  API_ERROR_CODES,
  type DiscordChannel,
  type Event,
  type EventDiscordUser,
  type EventDifficulty,
  type EventType,
  type UserGuild,
} from '@limitrausch/contracts';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

definePage({
  path: '/event/:mode',
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const notify = useNotify();
const { locale } = useI18n();

const eventToEdit = ref<Event | null>(null);
const loading = ref(false);
const loadError = ref<string | null>(null);
const isEditMode = computed(() => route.params.mode === 'bearbeiten');
const manageableGuilds = computed(
  () => authStore.user?.manageableGuilds.filter((item) => item.hasEventManagingRights) ?? [],
);
const guild = computed(() =>
  isEditMode.value
    ? eventToEdit.value?.discordGuild
    : manageableGuilds.value.find((item) => item.id === String(route.query.serverId)),
);

const date = ref<string>('');
const startTime = ref<string>('');
const endTime = ref<string>('');
const formattedDate = computed(() =>
  date.value
    ? new Intl.DateTimeFormat(locale.value, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(`${date.value}T12:00:00`))
    : '',
);

const type = ref<EventType | undefined>(undefined);
const typeOptions = computed(() =>
  Object.entries(EVENT_TYPE_OPTIONS)
    .filter(([, item]) => item.labels.de !== '' || item.labels.en !== '')
    .map(([value, item]) => ({
      value: Number(value) as EventType,
      ...createLocalizedSearchFields(item.labels, locale.value, item.aliases),
    })),
);
const { filteredOptions: filteredTypeOptions, filter: filterTypeOptions } =
  useSearchOptions(typeOptions);

const content = ref<string | undefined>(undefined);
const contentOptions = computed(() => {
  const options = GAME_CONTENT.filter((item) => item.types.includes(type.value!)).map((item) => ({
    value: item.value,
    ...createLocalizedSearchFields(item.labels, locale.value, item.aliases),
  }));
  if (content.value && !options.some((option) => option.value === content.value)) {
    options.push({
      value: content.value,
      ...createLocalizedSearchFields({ de: content.value, en: content.value }, locale.value),
    });
  }
  return options;
});
const { filteredOptions: filteredContentOptions, filter: filterContentOptions } =
  useSearchOptions(contentOptions);

const goal = ref<string | undefined>(undefined);
const difficulty = ref<EventDifficulty | undefined>(undefined);
const difficultyLabels = computed(() =>
  Object.entries(EVENT_DIFFICULTY_LABELS)
    .filter(([, item]) => item.labels.de !== '' || item.labels.en !== '')
    .map(([value, item]) => ({
      value: Number(value),
      ...createLocalizedSearchFields(item.labels, locale.value),
    })),
);
const difficultyEdited = ref<boolean>(false);
const generatedDifficulty = computed(() => {
  if (!type.value || !content.value) return undefined;
  return GAME_CONTENT.find((item) => item.value === content.value)?.difficulty?.[type.value];
});

const title = ref<string>('');
const titleEdited = ref<boolean>(false);
const generatedTitle = computed(() => {
  if (!type.value || !content.value) return '';
  if (!goal.value) {
    return content.value;
  }
  return `${content.value} - ${goal.value}`;
});

const description = ref<string>('');
const imageUrl = ref<string>('');
const isPublic = ref<boolean>(false); //TODO: enable this as toggle when you enable the feature
const channel = ref<DiscordChannel | undefined>(undefined);
const leader = ref<EventDiscordUser | undefined>(undefined);
const coLeaders = ref<EventDiscordUser[]>([]);
const leaderSelection = computed<EventDiscordUser[]>({
  get: () => (leader.value ? [leader.value] : []),
  set: (value) => {
    leader.value = value[0];
  },
});

const creationAllowed = computed(() =>
  Boolean(title.value && startTime.value && endTime.value && type.value),
);

watch(
  () => [route.params.mode, route.query.eventId] as const,
  async ([mode, eventId], _previous, onCleanup) => {
    let cancelled = false;
    onCleanup(() => {
      cancelled = true;
    });

    loading.value = false;
    resetForm();

    if (mode === 'neu') {
      if (eventId !== undefined) {
        const query = { ...route.query };
        delete query.eventId;
        void router.replace({ query });
      }
      return;
    }

    if (mode !== 'bearbeiten') {
      void router.replace({ path: '/event/neu', query: route.query });
      return;
    }

    const parsedEventId =
      typeof eventId === 'string' && /^\d+$/.test(eventId) ? Number(eventId) : NaN;
    if (!Number.isSafeInteger(parsedEventId) || parsedEventId <= 0) {
      const query = { ...route.query };
      delete query.eventId;
      void router.replace({ path: '/event/neu', query });
      return;
    }

    loading.value = true;
    try {
      const event = await getEventById(String(parsedEventId));
      if (!cancelled) {
        setFormFromEvent(event);
      }
    } catch (error) {
      if (cancelled) return;

      if (error instanceof ApiError && error.code === API_ERROR_CODES.NOT_FOUND) {
        const query = { ...route.query };
        delete query.eventId;
        void router.replace({ path: '/event/neu', query });
        notify.warning('Das Event wurde nicht gefunden. Du kannst ein neues Event erstellen.');
      } else {
        loadError.value = getUserErrorMessage(error);
        notify.error(loadError.value);
      }
    } finally {
      if (!cancelled) {
        loading.value = false;
      }
    }
  },
  { immediate: true },
);

watch(generatedDifficulty, (value) => {
  if (!difficultyEdited.value) {
    difficulty.value = value;
  }
});

watch(generatedTitle, (value) => {
  if (!titleEdited.value) {
    title.value = value;
  }
});

function selectGuild(selectedGuild: UserGuild | null) {
  const query = { ...route.query };

  if (selectedGuild) {
    query.serverId = selectedGuild.id;
  } else {
    delete query.serverId;
  }

  void router.replace({ query });
}

function goBack() {
  if (window.history.state.back) {
    router.back();
    return;
  }

  const guildId = eventToEdit.value?.discordGuild?.id ?? route.query.serverId;
  if (typeof guildId === 'string') {
    void router.push({ name: '/event-list', query: { serverId: guildId } });
  } else {
    void router.push({ name: '/dashboard' });
  }
}

function resetForm() {
  eventToEdit.value = null;
  loadError.value = null;
  date.value = '';
  startTime.value = '';
  endTime.value = '';
  type.value = undefined;
  content.value = undefined;
  goal.value = undefined;
  difficulty.value = undefined;
  difficultyEdited.value = false;
  title.value = '';
  titleEdited.value = false;
  description.value = '';
  imageUrl.value = '';
  isPublic.value = false;
  channel.value = undefined;
  leader.value = undefined;
  coLeaders.value = [];
}

function setFormFromEvent(event: Event) {
  eventToEdit.value = event;
  type.value = event.eventType;
  content.value = event.eventContent;
  goal.value = event.eventGoal;
  difficulty.value = event.eventDifficulty;
  difficultyEdited.value = true;
  title.value = event.title ?? '';
  titleEdited.value = title.value.trim() !== '';
  description.value = event.description ?? '';
  imageUrl.value = event.imageUrl ?? '';
  isPublic.value = event.isPublic;
  leader.value = event.leader;
  coLeaders.value = event.coLeaders ?? [];
  channel.value =
    event.discordGuild?.textChannelId && event.discordGuild.textChannelName
      ? {
          id: event.discordGuild.textChannelId,
          name: event.discordGuild.textChannelName,
        }
      : undefined;

  const start = new Date(event.startTime * 1000);
  const end = new Date(event.endTime * 1000);
  date.value = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(
    start.getDate(),
  ).padStart(2, '0')}`;
  startTime.value = `${String(start.getHours()).padStart(2, '0')}:${String(
    start.getMinutes(),
  ).padStart(2, '0')}`;
  endTime.value = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(
    2,
    '0',
  )}`;
}

function correctTime(value: string): string {
  const parts = value.split(':');

  let hour = Number(parts[0]);
  let minute = Number(parts[1]);

  if (!parts[0] || !Number.isFinite(hour)) {
    hour = 0;
  }

  if (!parts[1] || !Number.isFinite(minute)) {
    minute = 0;
  }

  hour = Math.max(0, Math.min(hour, 23));
  minute = Math.max(0, Math.min(minute, 59));

  minute = Math.floor(minute / 5) * 5;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function toUnixTimes(date: string, startTime: string, endTime: string) {
  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(`${date}T${endTime}:00`);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return {
    startTime: Math.floor(start.getTime() / 1000),
    endTime: Math.floor(end.getTime() / 1000),
  };
}

function clearContent(event: KeyboardEvent) {
  if (event.target instanceof HTMLInputElement && !event.target.value) {
    content.value = undefined;
  }
}

function clearType(event: KeyboardEvent) {
  if (event.target instanceof HTMLInputElement && !event.target.value) {
    type.value = undefined;
  }
}

function onTitleInput(value: string | number | null) {
  title.value = String(value ?? '');
  titleEdited.value = title.value.trim() !== '';
}

async function submitEvent() {
  const guildData = guild.value;
  if (!guildData) {
    notify.error('Bitte wähle einen Discord-Server aus.');
    return;
  }

  const creator = authStore.user;
  if (!creator) {
    notify.error(getUserErrorMessage(API_ERROR_CODES.UNAUTHORIZED));
    return;
  }

  try {
    const times = toUnixTimes(date.value, startTime.value, endTime.value);
    if (isEditMode.value && eventToEdit.value) {
      await updateEventById(eventToEdit.value.id, {
        title: title.value,
        description: description.value,
        imageUrl: imageUrl.value,
        startTime: times.startTime,
        endTime: times.endTime,
        eventType: type.value!,
        eventContent: content.value ?? '',
        eventDifficulty: difficulty.value,
        eventGoal: goal.value ?? '',
        isPublic: isPublic.value,
        leader: leader.value,
        coLeaders: coLeaders.value,
      });
    } else {
      await createEventOnGuild(
        {
          creator: {
            name: creator.username,
            id: creator.id,
          },
          leader: leader.value ?? {
            name: creator.username,
            id: creator.id,
          },
          coLeaders: coLeaders.value,
          title: title.value,
          description: description.value,
          imageUrl: imageUrl.value,
          startTime: times.startTime,
          endTime: times.endTime,
          eventType: type.value!,
          eventContent: content.value,
          eventDifficulty: difficulty.value,
          eventGoal: goal.value,
          isPublic: isPublic.value,
          discordGuild: {
            id: guildData.id,
            name: guildData.name,
            icon: guildData.icon ?? undefined,
            textChannelId: channel.value?.id,
            textChannelName: channel.value?.name,
          },
        },
        guildData.id,
      );
    }
    await router.push({ name: '/event-list', query: { serverId: guildData.id } });
  } catch (error) {
    notify.error(getUserErrorMessage(error));
  }
}
</script>

<style lang="scss">
.event-editor-page {
  width: 90vw;
  margin: 5vh auto;
}

.creation-card {
  margin: 0;
  padding: 1vw 2vw;
  width: 100%;
  justify-self: center;

  &__header {
    // text-align: center;
    font-size: 30px;

    .q-avatar__content {
      font-size: 40px;
    }
  }
  .q-field {
    margin: 10px;
  }

  .creation-form__event-type {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;

    > * {
      flex: 1 1 250px;
      min-width: 0;
    }
  }

  .creation-form__leader {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;

    > * {
      flex: 1 1 250px;
      min-width: 0;
    }
  }
}

.q-time__header {
  display: none;
}
</style>
