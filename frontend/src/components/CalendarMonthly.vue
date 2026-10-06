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
      <tr v-for="(week, weekIndex) in monthlyWeeksArray" :key="weekIndex">
        <td v-for="day in week" :key="day.toISOString()" class="calendar-day">
          <span
            class="calendar-day--number"
            :class="{ 'calendar-day--number--inactive': !isCurrentMonth(day) }"
          >
            {{ day.getDate() }}
          </span>
          <div
            v-for="event in props.eventsByDay.get(day.toDateString()) ?? []"
            :key="event.id"
            class="calendar-event"
            :class="`calendar-event--${channelClassNames[event.discordTextChannelId ?? ''] ?? 'other'}`"
          >
            <small>
              {{ formatEventTime(event.startTime) }} {{ formatEventTitle(event.title)[0] }}
            </small>
            <br />
            <strong>
              <span v-if="formatEventTitle(event.title).length > 1">
                {{ formatEventTitle(event.title)[1] }} - {{ formatEventTitle(event.title)[2] }}
              </span>
            </strong>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Event } from '../api/events';
import { channelClassNames, formatEventTime, formatEventTitle } from '../utils/calendar';

const now = new Date();
const props = defineProps<{ eventsByDay: ReadonlyMap<string, Event[]> }>();
const monthlyWeeksArray = computed(() => generateMonthlyWeekArray());

function generateMonthlyWeekArray(): Date[][] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const leadingDays = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarLength = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  const dates = Array.from(
    { length: calendarLength },
    (_, index) => new Date(year, month, index - leadingDays + 1),
  );

  return Array.from({ length: calendarLength / 7 }, (_, weekIndex) =>
    dates.slice(weekIndex * 7, (weekIndex + 1) * 7),
  );
}

function isCurrentMonth(day: Date): boolean {
  return day.getFullYear() === now.getFullYear() && day.getMonth() === now.getMonth();
}
</script>
