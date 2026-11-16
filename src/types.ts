export interface Source {
  name: string;
  url: string;
}

export interface PinnedFact {
  eventYear: number;
  title: string;
  short: string;
  essential: string;
  context: string;
  didYouKnow: string;
  invitation: string;
  source: Source;
  scope: "France" | "Monde";
  theme: string;
}

/** `date` est le jour d'envoi, au format YYYY-MM-DD. */
export interface Fact extends PinnedFact {
  date: string;
}

export interface PreviousEntry {
  date: string;
  eventYear: number;
  title: string;
}

export interface DayView {
  date: string;
  fact: Fact | PinnedFact;
  pinned: boolean;
  previous: PreviousEntry[];
}

export interface Env {
  KLEIO_KV: KVNamespace;
  KLEIO_KEY: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
}
