<template>
  <div class="events-page">
    <div class="events-toolbar">
      <div class="page-title">
        <h3>Event-Kalendar</h3>
      </div>
      <div>
        <div class="weekly-export-controls" v-if="isAdmin">
          <q-btn
            color="primary"
            icon="download"
            label="Aktuelle Woche herunterladen"
            :loading="isExporting"
            @click="downloadWeekAsImage"
          />
          <p v-if="exportError" class="export-error">{{ exportError }}</p>
        </div>
        <q-select
          v-model="calendarViewMonthly"
          :options="calendarOptions"
          emit-value
          map-options
          outlined
          dense
          label="Ansicht"
          class="calendar-view-select"
        />
      </div>
    </div>
    <p v-if="error">{{ error }}</p>
    <ListCalendar
      v-if="$q.screen.width < 1170"
      :events-by-day="eventsByDay"
      :displayedWeeks="displayedWeeks"
    />
    <Calendar
      v-else
      :events-by-day="eventsByDay"
      :displayedWeeks="displayedWeeks"
      :viewMonthly="calendarViewMonthly"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getEvents, type Event } from '../api/events';
import { getMonthlyCalendarStartDate } from '../utils/calendar';
import Calendar from '@/components/Calendar.vue';
import { useAuthStore } from '@/stores/auth-store';
import { downloadWeeklyCalendarAsImage } from '../utils/calendar-export';
import ListCalendar from '@/components/ListCalendar.vue';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.isAdmin);
const isExporting = ref(false);
const exportError = ref<string | null>(null);

const now = new Date();
const calendarViewMonthly = ref<boolean>(true);
const calendarOptions: { label: string; value: boolean }[] = [
  { label: 'Aktueller Monat', value: true },
  { label: 'Aktuelle Woche', value: false },
];
const events = ref<Event[]>([]);
const error = ref<string | null>(null);
const eventsByDay = computed(() => {
  const groupedEvents = new Map<string, Event[]>();

  for (const event of events.value) {
    const key = new Date(event.startTime * 1000).toDateString();
    const dayEvents = groupedEvents.get(key) ?? [];
    dayEvents.push(event);
    groupedEvents.set(key, dayEvents);
  }

  for (const dayEvents of groupedEvents.values()) {
    dayEvents.sort((first, second) => first.startTime - second.startTime);
  }

  return groupedEvents;
});
const monthlyWeeksDateArray = computed(() => generateMonthlyWeekArray());
const displayedWeeks = computed(() => generateDisplayedWeekDates());

onMounted(() => {
  getEvents(getMonthlyCalendarStartDate())
    .then((response) => {
      events.value = response.postedEvents;
    })
    .catch((err: unknown) => {
      error.value = err instanceof Error ? err.message : String(err);
      console.error(err);
    });
});

async function downloadWeekAsImage(): Promise<void> {
  if (isExporting.value) {
    return;
  }

  isExporting.value = true;
  exportError.value = null;

  try {
    const today = new Date();
    const week = monthlyWeeksDateArray.value.filter((week) =>
      week.some((day) => day.toDateString() === today.toDateString()),
    );
    await downloadWeeklyCalendarAsImage(week[0]!, eventsByDay.value);
  } catch (err) {
    exportError.value = err instanceof Error ? err.message : String(err);
    console.error(err);
  } finally {
    isExporting.value = false;
  }
}

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

function generateDisplayedWeekDates() {
  if (calendarViewMonthly.value) {
    return monthlyWeeksDateArray.value;
  }
  return monthlyWeeksDateArray.value.filter((week) =>
    week.some((day) => day.toDateString() === now.toDateString()),
  );
}
</script>

<style lang="scss" scoped>
.events-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1500px;
  margin: 16px auto 16px;

  .page-title {
    flex-grow: 1;
    justify-content: center;
    display: flex;
    h3 {
      margin: 0;
    }
  }
}

.calendar-view-select {
  width: 180px;
}

@media (max-width: 480px) {
  .events-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .calendar-view-select {
    width: 100%;
  }
}
</style>
