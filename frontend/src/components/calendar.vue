<template>
  <table class="calendar-table calendar-table--monthly">
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
    <tbody>
      <tr v-for="(week, weekIndex) in displayedWeeks" :key="weekIndex">
        <td
          v-for="day in week"
          :key="day.toISOString()"
          class="calendar-day"
          :class="{
            'calendar-day--today': isToday(day),
            'calendar-day--inactive': !isCurrentMonth(day),
          }"
        >
          <span
            class="calendar-day--number"
            :class="{
              'calendar-day--number--inactive': !isCurrentMonth(day),
              'calendar-day--number--today': isToday(day),
            }"
          >
            {{ day.getDate() }}
          </span>
          <q-card
            v-for="event in props.eventsByDay.get(day.toDateString()) ?? []"
            :key="event.id"
            class="calendar-event"
            :class="[
              `calendar-event--${getEventColor(event)}`,
              {
                'calendar-event--inactive': !isCurrentMonth(day),
                'calendar-event--today': isToday(day),
              },
            ]"
            @mouseenter="showEventInfo($event, event)"
            @mousemove="updateEventInfoPosition"
            @mouseleave="hideEventInfo"
          >
            <q-card-section class="event-type" horizontal>
              {{
                event.eventType !== EVENT_TYPE.UNDEFINED
                  ? event.eventType
                  : formatEventTitle(event.title)[0]
              }}
            </q-card-section>
            <q-card-section class="event-title" v-if="formatEventTitle(event.title).length > 1">
              {{ getEventTitle(event) }}
            </q-card-section>
            <q-card-actions>
              <q-icon class="server-icon" :name="`${getServerIconUrl(event)}`" />
              <div><q-icon name="schedule" /> {{ formatEventTime(event.startTime) }}</div>
            </q-card-actions>
          </q-card>
        </td>
      </tr>
    </tbody>
    <div
      v-if="hoveredEvent"
      class="event-hover-card"
      ref="hoverCard"
      :style="{
        left: `${hoverPosition.x}px`,
        top: `${hoverPosition.y}px`,
      }"
    >
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
              <q-icon class="server-icon" :name="`${getServerIconUrl(hoveredEvent)}`" />
              <div>{{ hoveredEvent.discordServer?.name }}</div>
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
    </div>
  </table>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Event } from '../api/events';
import { formatEventDay, formatEventTime, formatEventTitle } from '../utils/calendar';
import { EVENT_DIFFICULTY, EVENT_TYPE } from '@limitrausch/contracts';
import { nextTick } from 'vue';

const now = new Date();
const props = defineProps<{
  eventsByDay: ReadonlyMap<string, Event[]>;
  viewMonthly: boolean;
  displayedWeeks: Date[][];
}>();
const hoverCard = ref<HTMLElement | null>(null);
const hoveredEvent = ref<Event | null>(null);
const hoverPosition = ref({ x: 0, y: 0 });

function isCurrentMonth(day: Date): boolean {
  return day.getFullYear() === now.getFullYear() && day.getMonth() === now.getMonth();
}

function isToday(day: Date): boolean {
  return (
    day.getFullYear() === now.getFullYear() &&
    day.getMonth() === now.getMonth() &&
    day.getDate() === now.getDate()
  );
}

//TODO: Currently temporary fix for colors
function getEventColor(event: Event): string {
  if (event.endTime < Date.now() / 1000) return 'archived';
  if (event.eventDifficulty) {
    return String(event.eventDifficulty);
  }
  if (event.discordServer?.textChannelId === '1408186147896819822')
    return 'difficulty-' + String(EVENT_DIFFICULTY.EASY);
  if (event.discordServer?.textChannelId === '1408186073208852700')
    return 'difficulty-' + String(EVENT_DIFFICULTY.NORMAL);
  if (event.discordServer?.textChannelId === '1408186117039067227')
    return 'difficulty-' + String(EVENT_DIFFICULTY.HARD);
  return 'difficulty-unknown';
}

function getEventTitle(event: Event): string {
  // Temporary fix for aetheris server
  // TODO: remove upon changing to own event version
  if (
    event.eventType === EVENT_TYPE.UNDEFINED &&
    event.discordServer?.id === '1408172814879559721'
  ) {
    const formattedTitle = formatEventTitle(event.title);
    formattedTitle.shift();
    return formattedTitle.join(' - ');
  }
  return event.title;
}

function getServerIconUrl(event: Event): string {
  if (!event.discordServer) {
    return 'img:~/assets/icons/xiv.png';
  }
  if (!event.discordServer.icon) {
    return '';
  }
  const extension = event.discordServer.icon.startsWith('a_') ? 'gif' : 'png';
  return `img:https://cdn.discordapp.com/icons/${event.discordServer.id}/${event.discordServer.icon}.${extension}?size=128`;
}

async function showEventInfo(mouseEvent: MouseEvent, event: Event) {
  hoveredEvent.value = event;
  await nextTick();
  updateEventInfoPosition(mouseEvent);
}

function updateEventInfoPosition(mouseEvent: MouseEvent) {
  const card = hoverCard.value;
  if (!card) return;

  const padding = 12;
  const offsetX = 70;
  const offsetY = 16;

  const rect = card.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let x = mouseEvent.clientX + offsetX;
  let y = mouseEvent.clientY + offsetY;

  // If spilling over at right side
  if (x + rect.width > viewportWidth - padding) {
    x = mouseEvent.clientX - rect.width - offsetX;
  }
  // If spilling over at bottom
  if (y + rect.height > viewportHeight - padding) {
    y = mouseEvent.clientY - rect.height - offsetY;
  }

  // Dont spill at left or top
  x = Math.max(padding, Math.min(x, viewportWidth - rect.width - padding));
  y = Math.max(padding, Math.min(y, viewportHeight - rect.height - padding));

  hoverPosition.value = { x, y };
}

function hideEventInfo() {
  hoveredEvent.value = null;
}
</script>
