<template>
  <q-card v-if="!guild"> Etwas lief schief. Der Discord Server wurde nicht gefunden. </q-card>
  <q-card v-if="guild" class="creation-card">
    <q-card-section class="creation-card__header row items-center relative-position">
      <div class="absolute-center">Erstelle ein Event</div>
      <q-avatar class="q-ml-auto">
        <q-icon :name="getGuildIconUrl(guild.id, guild.icon)" />
      </q-avatar>
    </q-card-section>
    <q-card-section>
      <q-form @submit="createEventFromForm">
        <div class="creation-form__event-type">
          <q-select
            v-model="type"
            label="Event-Typ *"
            :options="filteredTypeOptions"
            input-debounce="0"
            emit-value
            map-options
            outlined
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

        <q-input :model-value="title" label="Titel" filled @update:model-value="onTitleInput" />
        <q-input v-model.lazy="description" label="Beschreibung" type="textarea" filled />
        <!-- TODO: leader -->
        <!-- TODO: Coleaders -->
        <!-- TODO: Image -->
        <!-- TODO: isPublic -->
        <q-btn label="Event erstellen" type="submit" :disable="!creationAllowed" />
        <!-- TODO: reset button -->
      </q-form>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { createEvent } from '@/api/events';
import { useNotify } from '@/composable/useNotify';
import { useSearchOptions } from '@/composable/useSearchOptions';
import { EVENT_DIFFICULTY_LABELS, EVENT_TYPE_OPTIONS } from '@/constants/event-settings-labels';
import { GAME_CONTENT } from '@/constants/game-content';
import { useAuthStore } from '@/stores/auth-store';
import { getGuildIconUrl } from '@/utils/discordGuild';
import { createLocalizedSearchFields } from '@/utils/searchOptions';
import {
  type EventDiscordUser,
  type EventType,
  type EventDifficulty,
  type DiscordChannel,
} from '@limitrausch/contracts';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const route = useRoute();
const authStore = useAuthStore();
const notify = useNotify();
const { locale } = useI18n();
const guild = computed(() =>
  authStore.user?.userGuilds.find((guild) => guild.id === String(route.query.serverId)),
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
const contentOptions = computed(() =>
  GAME_CONTENT.filter((item) => item.types.includes(type.value!)).map((item) => ({
    value: item.value,
    ...createLocalizedSearchFields(item.labels, locale.value, item.aliases),
  })),
);
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

watch(generatedDifficulty, (value) => {
  if (!difficultyEdited.value) {
    difficulty.value = value;
  }
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

watch(generatedTitle, (value) => {
  if (!titleEdited.value) {
    title.value = value;
  }
});

const description = ref<string>('');
const imageUrl = ref<string>('');
const isPublic = ref<boolean>(false); //TODO: enable this as toggle when you enable the feature
const channel = ref<DiscordChannel | undefined>(undefined);
const leader = ref<EventDiscordUser | undefined>(undefined);
const coLeaders = ref<EventDiscordUser[] | undefined>(undefined);

const creationAllowed = computed(() =>
  Boolean(title.value && startTime.value && endTime.value && type.value),
);

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

async function createEventFromForm() {
  try {
    await createEvent({
      creator: {
        name: '',
        id: authStore.user!.id,
      },
      leader: leader.value,
      coLeaders: coLeaders.value,
      title: title.value,
      description: description.value,
      imageUrl: imageUrl.value,
      startTime: toUnixTimes(date.value, startTime.value, endTime.value).startTime,
      endTime: toUnixTimes(date.value, startTime.value, endTime.value).endTime,
      eventType: type.value!,
      eventDifficulty: difficulty.value,
      eventGoal: goal.value,
      isPublic: isPublic.value,
      discordServer: {
        id: guild.value!.id,
        name: guild.value!.name,
        icon: guild.value!.icon ?? undefined,
        textChannelId: channel.value?.id,
        textChannelName: channel.value?.name,
      },
    });
  } catch (error) {
    notify.error(error instanceof Error ? error.message : String(error));
  }
}
</script>
<style lang="scss">
.creation-card {
  margin: 5vh 2vw;
  padding: 1vw 2vw;
  width: 90vw;
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
}

.q-time__header {
  display: none;
}
</style>
