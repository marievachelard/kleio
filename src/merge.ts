import type { Fact, PinnedFact } from "./types";

export interface ContentData {
  launchDate: string;
  pinned: Record<string, PinnedFact>;
  days: Record<string, Fact>;
}

/** Fusionne la configuration, les faits figés et les fichiers mensuels (clé = nom du fichier sans extension). */
export function mergeContent(
  config: { launchDate: string },
  pinned: Record<string, PinnedFact>,
  dayFiles: Record<string, Record<string, Fact>>,
): ContentData {
  const days: Record<string, Fact> = {};
  for (const file of Object.keys(dayFiles).sort()) {
    for (const [date, fact] of Object.entries(dayFiles[file])) {
      if (date in days) throw new Error(`Date en double dans les fichiers de faits : ${date}`);
      days[date] = fact;
    }
  }
  return { launchDate: config.launchDate, pinned, days };
}
