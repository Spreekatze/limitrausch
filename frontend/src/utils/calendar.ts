import { EVENT_DIFFICULTY, EVENT_TYPE, type Event } from '@limitrausch/contracts';

export function getMonthlyCalendarStartDate(): Date {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const leadingDays = (firstDayOfMonth.getDay() + 6) % 7;

  return new Date(now.getFullYear(), now.getMonth(), 1 - leadingDays);
}

export function formatEventTime(unixTime: number): string {
  return new Date(unixTime * 1000).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatEventDay(unixTime: number): string {
  return new Date(unixTime * 1000).toLocaleDateString([], {
    day: '2-digit',
    month: '2-digit',
  });
}

export function formatEventTitle(title: string): string[] {
  return title.split('-').map((part) => part.trim());
}

export function isCurrentMonth(day: Date): boolean {
  const now = new Date();
  return day.getFullYear() === now.getFullYear() && day.getMonth() === now.getMonth();
}

export function isToday(day: Date): boolean {
  const now = new Date();
  return (
    day.getFullYear() === now.getFullYear() &&
    day.getMonth() === now.getMonth() &&
    day.getDate() === now.getDate()
  );
}

//TODO: Currently temporary fix for colors
export function getEventColor(event: Event): string {
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

export function getEventTitle(event: Event): string {
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

export function getServerIconUrl(event: Event): string {
  if (!event.discordServer) {
    return 'img:~/assets/icons/xiv.png';
  }
  if (!event.discordServer.icon) {
    return '';
  }
  const extension = event.discordServer.icon.startsWith('a_') ? 'gif' : 'png';
  return `img:https://cdn.discordapp.com/icons/${event.discordServer.id}/${event.discordServer.icon}.${extension}?size=128`;
}
