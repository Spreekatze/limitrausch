<template>
  <div class="weekly-export-controls" v-if="isAdmin">
    <q-btn
      color="primary"
      icon="download"
      label="Aktuelle Woche als Bild herunterladen"
      :loading="isExporting"
      @click="downloadWeekAsImage"
    />
    <p v-if="exportError" class="export-error">{{ exportError }}</p>
  </div>
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
            :class="`calendar-event--${getEventColor(event)}`"
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
import { computed, ref } from 'vue';
import type { Event } from '../api/events';
import { formatEventTime, formatEventTitle } from '../utils/calendar';
import { EVENT_DIFFICULTY } from '@limitrausch/contracts';
import { downloadWeeklyCalendarAsImage } from '../utils/calendar-export';
import { useAuthStore } from '@/stores/auth-store';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.isAdmin);
const now = new Date();
const props = defineProps<{ eventsByDay: ReadonlyMap<string, Event[]>; view: boolean }>();
const monthlyWeeksArray = computed(() => generateMonthlyWeekArray());
const isExporting = ref(false);
const exportError = ref<string | null>(null);

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

const displayedWeeks = computed(() => {
  if (props.view) {
    return monthlyWeeksArray.value;
  }
  const today = new Date();
  return monthlyWeeksArray.value.filter((week) =>
    week.some((day) => day.toDateString() === today.toDateString()),
  );
});

function isCurrentMonth(day: Date): boolean {
  return day.getFullYear() === now.getFullYear() && day.getMonth() === now.getMonth();
}

//TODO: Currently temporary fix for colors
function getEventColor(event: Event): string {
  if (event.endTime < Date.now() / 1000) return 'archived';
  if (event.eventDifficulty) {
    return String(event.eventDifficulty);
  }
  if (event.discordServer?.discordTextChannelId === '1408186147896819822')
    return 'difficulty-' + String(EVENT_DIFFICULTY.EASY);
  if (event.discordServer?.discordTextChannelId === '1408186073208852700')
    return 'difficulty-' + String(EVENT_DIFFICULTY.NORMAL);
  if (event.discordServer?.discordTextChannelId === '1408186117039067227')
    return 'difficulty-' + String(EVENT_DIFFICULTY.HARD);
  return 'difficulty-unknown';
}

async function downloadWeekAsImage(): Promise<void> {
  if (isExporting.value) {
    return;
  }

  isExporting.value = true;
  exportError.value = null;

  try {
    const today = new Date();
    const week = monthlyWeeksArray.value.filter((week) =>
      week.some((day) => day.toDateString() === today.toDateString()),
    );
    await downloadWeeklyCalendarAsImage(week[0]!, props.eventsByDay);
  } catch (err) {
    exportError.value = err instanceof Error ? err.message : String(err);
    console.error(err);
  } finally {
    isExporting.value = false;
  }
}
</script>
