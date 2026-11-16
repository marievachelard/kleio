import { isValidIsoDate } from "./dates";
import type { ContentData } from "./merge";
import type { Fact, PinnedFact } from "./types";

const TEXT_FIELDS = ["title", "short", "essential", "context", "didYouKnow", "invitation", "theme"] as const;
const FORBIDDEN: { needle: string; label: string }[] = [
  { needle: "·", label: "·" },
  { needle: "—", label: "—" },
  { needle: "fun fact", label: "fun fact" },
];

/** Valide un fait. `key` est la clé dans le fichier : YYYY-MM-DD pour un jour, MM-JJ pour un fait figé. */
export function validateFact(f: Fact | PinnedFact, key: string): string[] {
  const errors: string[] = [];
  const isDay = "date" in f;

  for (const field of TEXT_FIELDS) {
    if (typeof f[field] !== "string" || f[field].trim() === "") errors.push(`${key}: champ ${field} vide`);
  }
  if (!f.source || typeof f.source.name !== "string" || f.source.name.trim() === "") {
    errors.push(`${key}: source.name vide`);
  }
  if (!f.source || typeof f.source.url !== "string" || !f.source.url.startsWith("https://")) {
    errors.push(`${key}: source.url doit commencer par https://`);
  }
  if (typeof f.short === "string" && f.short.length > 140) {
    errors.push(`${key}: short fait ${f.short.length} caractères (140 au plus)`);
  }
  if (f.scope !== "France" && f.scope !== "Monde") errors.push(`${key}: scope doit valoir France ou Monde`);
  if (!Number.isInteger(f.eventYear)) errors.push(`${key}: eventYear doit être un entier`);

  if (isDay) {
    if (!isValidIsoDate(f.date)) errors.push(`${key}: date invalide (${f.date})`);
    if (key !== f.date) errors.push(`${key}: la clé ne correspond pas à la date ${f.date}`);
    if (Number.isInteger(f.eventYear) && f.eventYear > Number(f.date.slice(0, 4))) {
      errors.push(`${key}: eventYear ${f.eventYear} postérieur à la date d'envoi`);
    }
  } else if (!/^\d{2}-\d{2}$/.test(key) || !isValidIsoDate(`2028-${key}`)) {
    errors.push(`${key}: la clé d'un fait figé doit être un MM-JJ valide`);
  }

  const allText = [...TEXT_FIELDS.map((k) => String(f[k] ?? "")), f.source?.name ?? ""].join("\n").toLowerCase();
  for (const { needle, label } of FORBIDDEN) {
    if (allText.includes(needle)) errors.push(`${key}: texte contenant « ${label} », interdit`);
  }
  return errors;
}

export function validateContent(data: ContentData): string[] {
  const errors: string[] = [];
  if (!isValidIsoDate(data.launchDate)) errors.push(`launchDate invalide : ${data.launchDate}`);

  const titlesByMonthDay = new Map<string, Set<string>>();
  const seen = (md: string, title: string, where: string) => {
    const set = titlesByMonthDay.get(md) ?? new Set<string>();
    if (set.has(title)) errors.push(`${where}: doublon de titre « ${title} » pour le ${md}`);
    set.add(title);
    titlesByMonthDay.set(md, set);
  };

  for (const [md, fact] of Object.entries(data.pinned)) {
    errors.push(...validateFact(fact, md));
    seen(md, fact.title, md);
  }
  for (const [date, fact] of Object.entries(data.days)) {
    errors.push(...validateFact(fact, date));
    seen(date.slice(5), fact.title, date);
  }
  return errors;
}
