const ENABLED_FLAG = "kleio-enabled";

export function isStandalone() {
  return (
    (typeof navigator !== "undefined" && navigator.standalone === true) ||
    (typeof matchMedia === "function" && matchMedia("(display-mode: standalone)").matches)
  );
}

/** Ce téléphone a-t-il déjà activé les notifications ? Sert à proposer de se réinscrire si le serveur l'a oublié. */
export function isEnabledBefore() {
  try {
    return localStorage.getItem(ENABLED_FLAG) === "true";
  } catch {
    return false;
  }
}

function rememberEnabled() {
  try {
    localStorage.setItem(ENABLED_FLAG, "true");
  } catch {
    /* stockage indisponible : seule l'alerte de réinscription est perdue */
  }
}

function urlBase64ToUint8Array(base64) {
  const padded = base64.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Adresse de l'inscription de ce navigateur auprès du service de notification, ou null. */
export async function currentEndpoint() {
  try {
    if (!("serviceWorker" in navigator)) return null;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription ? subscription.endpoint : null;
  } catch {
    return null;
  }
}

/** Demande la permission, inscrit ce téléphone et envoie l'abonnement au serveur. Aucun compte ni clé. */
export async function enablePush() {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
    if (res.status === 204) {
      rememberEnabled();
      return { ok: true };
    }
    return { ok: false, reason: res.status === 503 ? "full" : "error" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

async function postEndpoint(path, endpoint) {
  return fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}

export async function sendTest(endpoint) {
  try {
    const res = await postEndpoint("/api/test", endpoint);
    if (!res.ok) return false;
    return (await res.json()).ok === true;
  } catch {
    return false;
  }
}

export async function fetchStatus(endpoint) {
  try {
    const res = await postEndpoint("/api/status", endpoint);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
