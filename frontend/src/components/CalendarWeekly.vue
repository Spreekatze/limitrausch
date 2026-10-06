<template>
  <div class="weekly-export-controls">
    <q-btn
      color="primary"
      icon="download"
      label="Als Bild herunterladen"
      :loading="isExporting"
      @click="downloadWeekAsImage"
    />
    <p v-if="exportError" class="export-error">{{ exportError }}</p>
  </div>
  <table class="calendar-table calendar-table--weekly">
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
      <tr>
        <td v-for="day in weekDays" :key="day.toISOString()" class="calendar-day">
          <span class="calendar-day--number">{{ day.getDate() }}</span>
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
import { computed, ref } from 'vue';
import type { Event } from '../api/events';
import { channelClassNames, formatEventTime, formatEventTitle } from '../utils/calendar';
import { downloadWeeklyCalendarAsImage } from '../utils/calendar-export';

const props = defineProps<{ eventsByDay: ReadonlyMap<string, Event[]> }>();
const now = new Date();
const isExporting = ref(false);
const exportError = ref<string | null>(null);

const weekDays = computed(() => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
});

async function downloadWeekAsImage(): Promise<void> {
  if (isExporting.value) {
    return;
  }

  isExporting.value = true;
  exportError.value = null;

  try {
    await downloadWeeklyCalendarAsImage(weekDays.value, props.eventsByDay);
  } catch (err) {
    exportError.value = err instanceof Error ? err.message : String(err);
    console.error(err);
  } finally {
    isExporting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.weekly-export-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 1500px;
  margin: 0 auto 12px;
}

.export-error {
  margin: 0;
  color: #b42318;
}
</style>
