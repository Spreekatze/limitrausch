<template>
  <q-card>
    <q-card-section class="event-title">
      <div>
        {{
          hoveredEvent.eventType !== EVENT_TYPE.UNDEFINED
            ? hoveredEvent.eventType
            : formatEventTitle(hoveredEvent.title)[0]
        }}
      </div>
      <div>{{ hoveredEvent.title }}</div>
    </q-card-section>
    <q-separator />
    <div class="event-general-data">
      <q-card-section horizontal class="event-server">
        <div>
          <q-icon name="discord" />
        </div>
        <div>
          <q-icon
            class="server-icon"
            :name="`${getGuildIconUrl(hoveredEvent.discordServer?.id, hoveredEvent.discordServer?.icon)}`"
          />
          {{ hoveredEvent.discordServer?.name }}
        </div>
      </q-card-section>
      <q-card-section class="event-date" horizontal>
        <div>
          <q-icon name="event" />
        </div>
        <div>
          {{ formatEventDay(hoveredEvent.startTime) }},
          {{ formatEventTime(hoveredEvent.startTime) }} -
          {{ formatEventTime(hoveredEvent.endTime) }}
        </div>
      </q-card-section>
      <q-card-section class="event-leader" horizontal>
        <div>
          <q-icon>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 8L15 13.2L18 10.5L17.3 14H6.7L6 10.5L9 13.2L12 8M12 4L8.5 10L3 5L5 16H19L21 5L15.5 10L12 4M19 18H5V19C5 19.6 5.4 20 6 20H18C18.6 20 19 19.6 19 19V18Z"
              />
            </svg>
          </q-icon>
        </div>
        <div>
          {{ hoveredEvent.leader?.name }}
        </div>
      </q-card-section>
    </div>
    <q-separator />
    <q-card-section class="event-description">
      {{ hoveredEvent.description }}
    </q-card-section>
    <q-card-section class="event-image">
      <q-img :src="hoveredEvent.imageUrl" alt="Event image" />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { formatEventDay, formatEventTime, formatEventTitle } from '@/utils/calendar';
import { getGuildIconUrl } from '@/utils/discordGuild';
import { type Event, EVENT_TYPE } from '@limitrausch/contracts';

defineProps<{
  hoveredEvent: Event;
}>();
</script>
