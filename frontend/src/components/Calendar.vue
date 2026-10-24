<template>
  <table class="calendar-table" :class="{ 'calendar-table--weekly': !viewMonthly }">
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
          :key="day.toDateString()"
          class="calendar-day"
          :class="{
            'calendar-day--today': isToday(day),
            'calendar-day--inactive': !isCurrentMonth(day),
          }"
        >
          <span
            class="calendar-day__number"
            :class="{
              'calendar-day__number--inactive': !isCurrentMonth(day),
              'calendar-day__number--today': isToday(day),
            }"
          >
            {{ day.getDate() }}
          </span>
          <div class="calender-event-list__wrapper">
            <div
              class="calender-event-list"
              :ref="(el) => setScrollElement(day.toDateString(), el)"
              @scroll="updateScrollState(day.toDateString())"
              :style="{ maxHeight: eventListMaxHeight }"
            >
              <q-card
                v-for="event in eventsByDay.get(day.toDateString()) ?? []"
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
                @click="onEventClicked(event)"
              >
                <q-card-section class="event-title" v-if="formatEventTitle(event.title).length > 1">
                  {{ getEventTitle(event) }}
                </q-card-section>
                <q-card-actions>
                  <q-icon
                    class="server-icon"
                    :name="`${getGuildIconUrl(event.discordServer?.id, event.discordServer?.icon)}`"
                  />
                  <div><q-icon name="schedule" /> {{ formatEventTime(event.startTime) }}</div>
                </q-card-actions>
              </q-card>
              <div
                v-if="scrollStates[day.toDateString()]?.up"
                class="scroll-indicator scroll-indicator--top"
                @click="scrollEvents(day.toDateString(), 'up')"
              >
                <q-icon name="keyboard_arrow_up" size="24px" />
              </div>
              <div
                v-if="scrollStates[day.toDateString()]?.down"
                class="scroll-indicator scroll-indicator--bottom"
                @click="scrollEvents(day.toDateString(), 'down')"
              >
                <q-icon name="keyboard_arrow_down" size="24px" />
              </div>
            </div>
          </div>
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
      <calendar-hover :hovered-event="hoveredEvent" />
    </div>
  </table>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, type ComponentPublicInstance } from 'vue';
import { type Event } from '@limitrausch/contracts';
import {
  formatEventTime,
  formatEventTitle,
  getEventColor,
  getEventTitle,
  isCurrentMonth,
  isToday,
} from '../utils/calendar';
import CalendarHover from './CalendarHover.vue';
import { getGuildIconUrl } from '@/utils/discordGuild';
import { useRouter } from 'vue-router';

const props = defineProps<{
  eventsByDay: ReadonlyMap<string, Event[]>;
  viewMonthly: boolean;
  displayedWeeks: Date[][];
}>();
const router = useRouter();
const hoverCard = ref<HTMLElement | null>(null);
const hoveredEvent = ref<Event | null>(null);
const hoverPosition = ref({ x: 0, y: 0 });

interface ScrollState {
  up: boolean;
  down: boolean;
}
type ScrollElementTarget = Element | ComponentPublicInstance | null;
const scrollStates = reactive<Record<string, ScrollState>>({});
const scrollElements = new Map<string, HTMLElement>();

const eventListMaxHeight = computed(() => (props.viewMonthly === true ? '200px' : '500px'));

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

function updateScrollState(key: string) {
  const el = scrollElements.get(key);
  if (!el) {
    return;
  }

  const up = el.scrollTop > 1;
  const down = el.scrollTop + el.clientHeight < el.scrollHeight - 1;

  const current = scrollStates[key];

  if (current?.up === up && current?.down === down) return;

  scrollStates[key] = { up, down };
}

async function setScrollElement(key: string, el: ScrollElementTarget) {
  const element = el instanceof Element ? el : el?.$el;

  if (!(element instanceof HTMLElement)) {
    scrollElements.delete(key);
    return;
  }

  scrollElements.set(key, element);
  await nextTick(() => updateScrollState(key));
}

function scrollEvents(key: string, direction: 'up' | 'down') {
  const el = scrollElements.get(key);
  if (!el) {
    return;
  }

  el.scrollBy({
    top: el.clientHeight * 0.8 * (direction === 'down' ? 1 : -1),
    behavior: 'smooth',
  });
}

function onEventClicked(event: Event) {
  void router.push({ name: '/event', query: { id: event.id } });
}
</script>
