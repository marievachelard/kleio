/**
 * Décide quel écran afficher d'après l'adresse (partie après le #).
 * Ouvrir l'app sans adresse précise arrive toujours sur le calendrier ;
 * seul le lien d'une notification (#/day/AAAA-MM-JJ) ouvre directement un détail.
 */
export function parseRoute(hash) {
  const day = /^#\/day\/(\d{4}-\d{2}-\d{2})$/.exec(hash);
  if (day) return { name: "day", date: day[1] };
  if (hash === "#/setup") return { name: "setup" };
  return { name: "calendar" };
}
