const TZ = "Europe/Paris";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const dateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const clockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Date du jour à Paris, au format YYYY-MM-DD. */
export function parisDate(now: Date): string {
  return dateFormat.format(now);
}

export function parisClock(now: Date): { hour: number; minute: number } {
  const parts = clockFormat.formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { hour: get("hour"), minute: get("minute") };
}

/** Vrai entre 08:30 et 08:59, heure de Paris : fenêtre qui tolère un léger retard du cron. */
export function shouldSendNow(now: Date): boolean {
  const { hour, minute } = parisClock(now);
  return hour === 8 && minute >= 30;
}

export function formatEventDate(day: number, month: number, year: number): string {
  const d = day === 1 ? "1er" : String(day);
  return `${d} ${MONTHS[month - 1]} ${year}`;
}

/** "2026-11-16" donne "16 novembre". */
export function formatDayTitle(isoDate: string): string {
  const [, m, d] = isoDate.split("-").map(Number);
  return `${d === 1 ? "1er" : d} ${MONTHS[m - 1]}`;
}

export function isValidIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}
