const EXACT_HOSTS = new Set([
  "web.push.apple.com", // Apple (iPhone, Safari)
  "fcm.googleapis.com", // Google (Chrome, Android)
  "updates.push.services.mozilla.com", // Mozilla (Firefox)
]);
const SUFFIX_HOSTS = [".notify.windows.com"]; // Microsoft (Edge)

/** Seules les adresses des vrais services de notification sont acceptées : le serveur n'appelle jamais autre chose. */
export function isAllowedPushEndpoint(endpoint: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username !== "" || url.password !== "" || url.port !== "") return false;
  const host = url.hostname.toLowerCase();
  return EXACT_HOSTS.has(host) || SUFFIX_HOSTS.some((suffix) => host.endsWith(suffix));
}
