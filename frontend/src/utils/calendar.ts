export const channelClassNames: Record<string, string> = {
  '1408186147896819822': 'casual',
  '1408186073208852700': 'raids',
  '1408186117039067227': 'ultimates',
  '1410015029415251978': 'archiv',
};

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

export function formatEventTitle(title: string): string[] {
  return title.split(' - ').map((part) => part.trim());
}
