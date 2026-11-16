import generated from "./generated/content.json";
import { isValidIsoDate } from "./dates";
import { type ContentData } from "./merge";
import type { DayView, PreviousEntry } from "./types";

export { mergeContent, type ContentData } from "./merge";

/** Contenu embarqué dans le Worker, produit par `npm run build:data` à partir de `data/`. */
export function loadContent(): ContentData {
  return generated as unknown as ContentData;
}

function monthDay(isoDate: string): string {
  return isoDate.slice(5);
}

/** Renvoie le jour demandé seulement s'il est entre le lancement et aujourd'hui (inclus) et qu'un fait existe. */
export function resolveDay(date: string, today: string, data: ContentData): DayView | null {
  if (!isValidIsoDate(date)) return null;
  if (date < data.launchDate || date > today) return null;

  const md = monthDay(date);
  const own = data.days[date];
  const fixed = data.pinned[md];
  const fact = own ?? fixed;
  if (!fact) return null;

  const previous: PreviousEntry[] = Object.keys(data.days)
    .filter((d) => d < date && d >= data.launchDate && monthDay(d) === md)
    .sort()
    .map((d) => ({ date: d, eventYear: data.days[d].eventYear, title: data.days[d].title }));

  return { date, fact, pinned: fixed !== undefined, previous };
}

function* eachDate(from: string, to: string): Generator<string> {
  const [y, m, d] = from.split("-").map(Number);
  const cursor = new Date(Date.UTC(y, m - 1, d));
  for (;;) {
    const iso = cursor.toISOString().slice(0, 10);
    if (iso > to) return;
    yield iso;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
}

export interface DayListItem {
  date: string;
  title: string;
  pinned: boolean;
  eventYear: number;
  short: string;
}

export function listDays(today: string, data: ContentData): DayListItem[] {
  const out: DayListItem[] = [];
  for (const date of eachDate(data.launchDate, today)) {
    const view = resolveDay(date, today, data);
    if (view) {
      out.push({
        date,
        title: view.fact.title,
        pinned: view.pinned,
        eventYear: view.fact.eventYear,
        short: view.fact.short,
      });
    }
  }
  return out;
}
