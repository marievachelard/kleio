import { formatEventDate } from "./dates";
import type { Fact, PinnedFact } from "./types";

export type NotificationPayload = {
  title: string;
  body: string;
  url: string;
};

/** Titre daté avec l'année de l'événement, corps court, lien vers le détail du jour d'envoi. */
export function buildNotification(fact: Fact | PinnedFact, date: string): NotificationPayload {
  const [, month, day] = date.split("-").map(Number);
  return {
    title: formatEventDate(day, month, fact.eventYear),
    body: fact.short,
    url: `/#/day/${date}`,
  };
}
