<template>
  <div v-if="eventsByDay.size === 0">Aktuell sind keine Events geplant.</div>
  <div v-else class="calendar-list">
    <template v-for="(week, weekIndex) in displayedWeeks" :key="weekIndex">
      <template v-for="day in week" :key="day.toDateString()">
        <template v-if="eventsByDay.get(day.toDateString())?.length">
          <q-item class="calendar-list__day">
            <q-item-section>
              <q-item-label>
                {{ formatDay(day) }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <template
            v-for="(event, eventIndex) in eventsByDay.get(day.toDateString()) ?? []"
            :key="event.id"
          >
            <q-item
              class="calendar-list__item"
              @mouseenter="showEventInfo($event, event)"
              @mousemove="updateEventInfoPosition"
              @mouseleave="hideEventInfo"
              @click="onEventClicked(event)"
            >
              <q-item-section side class="event__time">
                <div class="event__time__start">{{ formatEventTime(event.startTime) }}</div>
                <div class="event__time__end">{{ formatEventTime(event.endTime) }}</div>
              </q-item-section>
              <q-item-section>
                <q-item-label class="event__title" lines="2">
                  {{ getEventTitle(event) }}
                </q-item-label>
                <q-item-label class="event__guild">
                  <q-icon
                    class="server-icon"
                    :name="`${getGuildIconUrl(event.discordGuild?.id, event.discordGuild?.icon)}`"
                  />
                  {{ event.discordGuild?.name }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-separator
              v-if="eventIndex < eventsByDay.get(day.toDateString())!.length - 1"
              inset
            />
          </template>
        </template>
      </template>
    </template>
    <div
      v-if="hoveredEvent"
      class="event-hover-card"
      ref="hoverCard"
      :style="{
        left: `${hoverPosition.x}px`,
        top: `${hoverPosition.y}px`,
      }"
    >
      <calendar-hover :hovered-event="hoveredEvent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatEventTime, getEventTitle } from '@/utils/calendar';
import { type Event } from '@limitrausch/contracts';
import { nextTick, ref } from 'vue';
import CalendarHover from './CalendarHover.vue';
import { getGuildIconUrl } from '@/utils/discordGuild.js';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

defineProps<{
  eventsByDay: ReadonlyMap<string, Event[]>;
  displayedWeeks: Date[][];
}>();
const router = useRouter();

const hoverCard = ref<HTMLElement | null>(null);
const hoveredEvent = ref<Event | null>(null);
const hoverPosition = ref({ x: 0, y: 0 });
const { locale } = useI18n();
function formatDay(date: Date) {
  return date.toLocaleDateString(locale.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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

function onEventClicked(event: Event) {
  void router.push({ name: '/event', query: { id: event.id } });
}
</script>
