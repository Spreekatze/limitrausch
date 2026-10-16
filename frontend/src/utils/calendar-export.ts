import { EVENT_DIFFICULTY } from '@limitrausch/contracts';
import type { Event } from '../api/events';
import { formatEventTime } from './calendar';
//TODO: new URL("../assets/AE.png", import.meta.url) doesn't exist at build time, it will remain unchanged to be resolved at runtime
const logoUrl = new URL('../assets/AE.png', import.meta.url).href;

const importedScheduleBackgrounds = import.meta.glob<string>(
  '../assets/scheduleBackgrounds/*.{png,jpg,jpeg,webp,avif,svg}',
  { eager: true, import: 'default', query: '?url' },
);

const scheduleBackgroundsByName = Object.fromEntries(
  Object.entries(importedScheduleBackgrounds).map(([path, imageUrl]) => [
    path.slice(path.lastIndexOf('/') + 1).replace(/\.[^.]+$/, ''),
    imageUrl,
  ]),
);

function imageLayers(...names: string[]): string[] {
  return names.flatMap((name) => {
    const imageUrl = scheduleBackgroundsByName[name];
    return imageUrl ? [imageUrl] : [];
  });
}

//TODO: Add support for different themes and their respective background images
const themeImages: Record<string, string[]> = {
  // default: imageLayers('default'),
  spring: imageLayers('none'),
  summer: imageLayers('none'),
  autumn: imageLayers('none'),
  winter: imageLayers('none'),
  christmas: imageLayers('none'),
  halloween: imageLayers('none'),
  easter: imageLayers('none'),
};

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';
  lines.push(words.shift() ?? ''); // Push type into first line

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (currentLine && context.measureText(candidate).width > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

async function loadThemeImages(themeName = 'default'): Promise<HTMLImageElement[]> {
  const imageUrls = themeImages[themeName] ?? themeImages.default ?? [];

  return Promise.all(
    imageUrls.map(async (imageUrl) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = imageUrl;
      await image.decode();
      return image;
    }),
  );
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  opacity: number,
): void {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;

  context.save();
  context.globalAlpha = opacity;
  context.drawImage(
    image,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
  context.restore();
}

function drawRoundedPanel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  shadow: string,
): void {
  context.save();
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fillStyle = fill;
  context.shadowColor = shadow;
  context.shadowBlur = 12;
  context.shadowOffsetY = 4;
  context.fill();
  context.restore();
}

function drawOutlinedGradientText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  alignment: CanvasTextAlign,
  fill: CanvasGradient,
  outline: string,
  shadow: string,
  rotation = 0,
): void {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.font = font;
  context.textAlign = alignment;
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  context.lineWidth = 5;
  context.strokeStyle = outline;
  context.shadowColor = shadow;
  context.shadowBlur = 8;
  context.shadowOffsetY = 3;
  context.strokeText(text, 0, 0);
  context.fillStyle = fill;
  context.fillText(text, 0, 0);
  context.restore();
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

function getStyle(name: string): string {
  const color = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!color) {
    throw new Error(`Theme-Farbe ${name} ist nicht definiert.`);
  }
  return color;
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

export async function downloadWeeklyCalendarAsImage(
  weekDays: Date[],
  eventsByDay: ReadonlyMap<string, Event[]>,
): Promise<void> {
  const imageWidth = 1680;
  const scale = 2;
  const padding = 56; //padding around the entire image
  const fontFamily = getStyle('--calendar-export-font-family');
  await document.fonts.load(`600 20px ${fontFamily}`);

  const [backgroundImages, logo] = await Promise.all([
    loadThemeImages('default'), //TODO: Replace 'default' with the actual theme name option when implementing theme support
    loadImage(logoUrl),
  ]);

  const headerY = padding; // Y position where the header (logo and title) starts
  const headerHeight = 150; // Height of the header (logo and title)
  const contentStartY = headerY + headerHeight + 24; // Y position where the content (days and events) starts
  const columnGap = 20; // Gap between each day's column
  const columnWidth = (imageWidth - padding * 2 - columnGap * 6) / 7; // Width of each day's column (7 days in a week)
  const dayHeaderHeight = 40; // Height of the header for each day (day name and date)
  const dayCardGap = 15; // Horizontal gap between the day header and the event list panel
  const eventGap = 10; // Horizontal gap between each event card in the event list
  const eventListPadding = 14; // Padding inside the event list panel (top and bottom)
  const measuringCanvas = document.createElement('canvas');
  const measuringContext = measuringCanvas.getContext('2d');
  if (!measuringContext) {
    throw new Error('Canvas ist in diesem Browser nicht verfügbar.');
  }
  const titleStyle = `700 90px ${fontFamily}`; //fontWeight fontSize fontFamily
  const titleDateStyle = `700 60px ${fontFamily}`;
  const eventFontSize = 30;
  const timeFontSize = eventFontSize - 5;
  const eventStyle = `600 ${eventFontSize}px ${fontFamily}`;
  const noEventStyle = `600 ${eventFontSize - 5}px ${fontFamily}`;
  const timeStyle = `600 ${timeFontSize}px ${fontFamily}`;
  // Map events to their respective days and calculate the height of each event card based on the wrapped title text
  const days = weekDays.map((date) => {
    const events = (eventsByDay.get(date.toDateString()) ?? []).map((event) => {
      measuringContext.font = eventStyle;
      const titleLines = wrapCanvasText(measuringContext, event.title, columnWidth);
      const cardHeight = titleLines.length * eventFontSize + timeFontSize * 2;
      return { event, titleLines, cardHeight };
    });
    const eventListContentHeight =
      events.reduce((height, event) => height + event.cardHeight, 0) +
      Math.max(0, events.length - 1) * eventGap;

    return { date, events, eventListContentHeight };
  });
  const firstDay = days[0]?.date;
  const lastDay = days[days.length - 1]?.date;
  if (!firstDay || !lastDay) {
    throw new Error('Die aktuelle Woche konnte nicht ermittelt werden.');
  }
  const eventListHeight = Math.max(
    120,
    ...days.map((day) => day.eventListContentHeight + eventListPadding * 2),
  );
  const tableHeight = dayHeaderHeight + dayCardGap + eventListHeight;
  const imageHeight = Math.max(840, contentStartY + tableHeight + padding);

  // Create Document
  const canvas = document.createElement('canvas');
  canvas.width = imageWidth * scale;
  canvas.height = imageHeight * scale;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas ist in diesem Browser nicht verfügbar.');
  }

  // Draw background gradient and images
  context.scale(scale, scale);
  const gradient = context.createLinearGradient(0, 0, imageWidth * 0.9, imageHeight * 1.225);
  gradient.addColorStop(0, getStyle('--calendar-export-gradient-start'));
  gradient.addColorStop(0.6, getStyle('--calendar-export-gradient-middle'));
  gradient.addColorStop(1, getStyle('--calendar-export-gradient-end'));
  context.fillStyle = gradient;
  context.fillRect(0, 0, imageWidth, imageHeight);
  for (const backgroundImage of backgroundImages) {
    drawImageCover(context, backgroundImage, imageWidth, imageHeight, 1);
  }

  // Draw Logo
  const logoScale = 0.23;
  context.drawImage(logo, 70, 10, logo.width * logoScale, logo.height * logoScale);

  // Draw Title
  const titleGradient = context.createLinearGradient(0, 0, 0, 20);
  titleGradient.addColorStop(0, getStyle('--calendar-export-title-start'));
  titleGradient.addColorStop(1, getStyle('--calendar-export-title-end'));
  const outline = getStyle('--calendar-export-title-outline');
  const textShadow = getStyle('--calendar-export-title-shadow');
  const panelShadow = getStyle('--calendar-export-panel-shadow');

  drawOutlinedGradientText(
    context,
    'Ætheris Events',
    imageWidth / 2,
    headerY + headerHeight / 2,
    titleStyle,
    'center',
    titleGradient,
    outline,
    textShadow,
  );

  // Draw Week-dates
  const formatDayMonth = (date: Date): string =>
    `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.`;
  drawOutlinedGradientText(
    context,
    `${formatDayMonth(firstDay)} - ${formatDayMonth(lastDay)}`,
    imageWidth - padding - 24,
    headerY + headerHeight / 2,
    titleDateStyle,
    'right',
    titleGradient,
    outline,
    textShadow,
    0.12,
  );

  // Draw day columns and events
  const eventListY = contentStartY + dayHeaderHeight + dayCardGap;
  let columnX = padding;
  for (const day of days) {
    drawRoundedPanel(
      context,
      columnX,
      contentStartY,
      columnWidth,
      dayHeaderHeight,
      15,
      getStyle('--calendar-export-surface'),
      panelShadow,
    );
    drawRoundedPanel(
      context,
      columnX,
      eventListY,
      columnWidth,
      eventListHeight,
      15,
      getStyle('--calendar-export-surface'),
      panelShadow,
    );

    // Day title
    context.fillStyle = getStyle('--calendar-export-text');
    context.font = eventStyle;
    context.textAlign = 'center';
    context.fillText(
      day.date.toLocaleDateString('de-DE', { weekday: 'long' }),
      columnX + columnWidth / 2,
      contentStartY + 27,
      columnWidth - 20,
    );

    context.textAlign = 'left';

    // If no event on that day
    if (day.events.length === 0) {
      context.fillStyle = getStyle('--calendar-export-text-muted');
      context.font = noEventStyle;
      context.textAlign = 'center';
      context.fillText(
        'Keine Events',
        columnX + columnWidth / 2,
        eventListY + eventListHeight / 2,
        columnWidth - 24,
      );
      context.textAlign = 'left';
    }

    // Event-List
    let eventY = eventListY + 10;
    day.events.forEach((item) => {
      drawRoundedPanel(
        context,
        columnX,
        eventY,
        columnWidth,
        item.cardHeight,
        2,
        getStyle(`--calendar-export-${getEventColor(item.event)}`),
        'transparent',
      );

      // Event-Time
      const textX = columnX + eventListPadding;
      let textY = eventY + eventListPadding + 7;
      context.fillStyle = getStyle('--calendar-export-text-muted');
      context.font = timeStyle;
      context.fillText(
        `${formatEventTime(item.event.startTime)} - ${formatEventTime(item.event.endTime)}`,
        textX,
        textY,
        columnWidth - 48,
      );

      // Event-Type
      textY += timeFontSize + 2;
      context.fillStyle = getStyle('--calendar-export-text-muted');
      context.font = timeStyle;
      context.fillText(item.titleLines.shift() ?? '', textX, textY, columnWidth - 48);

      //Event-Title
      textY += eventFontSize + 2;
      context.fillStyle = getStyle('--calendar-export-text');
      context.font = eventStyle;
      for (const line of item.titleLines) {
        context.fillText(line, textX, textY, columnWidth - 48);
        textY += eventFontSize + 1;
      }

      eventY += item.cardHeight + eventGap;
    });

    columnX += columnWidth + columnGap;
  }

  const firstDatePart = [
    firstDay.getFullYear(),
    String(firstDay.getMonth() + 1).padStart(2, '0'),
    String(firstDay.getDate()).padStart(2, '0'),
  ].join('-');
  const link = document.createElement('a');
  link.download = `aetheris-week-${firstDatePart}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
