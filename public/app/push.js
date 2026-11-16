const KEY_STORAGE = "kleio-key";

export function isStandalone() {
  return (
    (typeof navigator !== "undefined" && navigator.standalone === true) ||
    (typeof matchMedia === "function" && matchMedia("(display-mode: standalone)").matches)
  );
}

/** La clé d'accès reste dans ce navigateur ; elle n'est envoyée que dans l'en-tête X-Kleio-Key. */
export function getStoredKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export function storeKey(key) {
  try {
    localStorage.setItem(KEY_STORAGE, key);
  } catch {
    /* stockage indisponible : la clé devra être ressaisie */
  }
}

function urlBase64ToUint8Array(base64) {
  const padded = base64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Demande la permission, inscrit l'appareil aux notifications et envoie l'abonnement au serveur. */
export async function enablePush(key) {
  if (!isStandalone()) return { ok: false, reason: "not-standalone" };
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { ok: false, reason: "denied" };

    const config = await (await fetch("/api/config")).json();
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey),
    });
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Kleio-Key": key },
      body: JSON.stringify(subscription.toJSON()),
    });
    return res.status === 204 ? { ok: true } : { ok: false, reason: "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

export async function sendTest(key) {
  try {
    const res = await fetch("/api/test", { method: "POST", headers: { "X-Kleio-Key": key } });
    if (!res.ok) return false;
    return (await res.json()).ok === true;
  } catch {
    return false;
  }
}

export async function fetchStatus(key) {
  try {
    const res = await fetch("/api/status", { headers: { "X-Kleio-Key": key } });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
