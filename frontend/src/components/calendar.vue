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
          >
            <q-card-section class="event-type" horizontal>
              <!-- <q-icon :name="`${getServerIconUrl(event)}`" /> -->
              <div>
                {{
                  event.eventType !== EVENT_TYPE.UNDEFINED
                    ? event.eventType
                    : formatEventTitle(event.title)[0]
                }}
              </div>
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
  </table>
</template>

<script setup lang="ts">
import type { Event } from '../api/events';
import { formatEventTime, formatEventTitle } from '../utils/calendar';
import { EVENT_DIFFICULTY, EVENT_TYPE } from '@limitrausch/contracts';

const now = new Date();
const props = defineProps<{
  eventsByDay: ReadonlyMap<string, Event[]>;
  viewMonthly: boolean;
  displayedWeeks: Date[][];
}>();

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
</script>
