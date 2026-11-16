const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const day = (d) => (d === 1 ? "1er" : String(d));

export function formatEventDate(d, month, year) {
  return `${day(d)} ${MONTHS[month - 1]} ${year}`;
}

/** "2026-11-17" donne "17 novembre". */
export function formatDayTitle(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${day(d)} ${MONTHS[m - 1]}`;
}

/** "2026-11" donne "Novembre". */
export function monthName(monthIso) {
  const name = MONTHS[Number(monthIso.slice(5, 7)) - 1];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function addMonth(monthIso, delta) {
  const [y, m] = monthIso.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
