<template>
  <div class="events-page">
    <div class="events-toolbar">
      <h1>Events</h1>
      <q-select
        v-model="calendarView"
        :options="calendarOptions"
        emit-value
        map-options
        outlined
        dense
        label="Ansicht"
        class="calendar-view-select"
      />
    </div>
    <p v-if="error">{{ error }}</p>
    <CalendarMonthly v-if="calendarView === 'monthly'" :events-by-day="eventsByDay" />
    <CalendarWeekly v-else :events-by-day="eventsByDay" />
  </div>
</template>

<script setup lang="ts">
import '../css/calendar.scss';
import { computed, onMounted, ref } from 'vue';
import CalendarMonthly from '../components/CalendarMonthly.vue';
import CalendarWeekly from '../components/CalendarWeekly.vue';
import { getEvents, type Event } from '../api/events';
import { getMonthlyCalendarStartDate } from '../utils/calendar';

type CalendarView = 'monthly' | 'weekly';

const calendarView = ref<CalendarView>('monthly');
const calendarOptions: { label: string; value: CalendarView }[] = [
  { label: 'Monatlich', value: 'monthly' },
  { label: 'Wöchentlich', value: 'weekly' },
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

onMounted(() => {
  void getEvents(getMonthlyCalendarStartDate())
    .then((response) => {
      events.value = response.postedEvents;
    })
    .catch((err: unknown) => {
      error.value = err instanceof Error ? err.message : String(err);
      console.error(err);
    });
});
</script>

<style lang="scss" scoped>
.events-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1500px;
  margin: 0 auto 16px;

  h1 {
    margin: 0;
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
