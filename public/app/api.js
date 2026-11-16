/** Liste des jours déjà passés depuis le lancement. */
export async function fetchDays() {
  const res = await fetch("/api/days");
  if (!res.ok) throw new Error(`days ${res.status}`);
  return res.json();
}

/** Détail d'un jour, ou null s'il n'est pas disponible (futur ou inexistant). */
export async function fetchDay(date) {
  const res = await fetch(`/api/day/${date}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`day ${res.status}`);
  return res.json();
}
