import { generateVapidKeys } from "../src/vapidKeys";
import type { Env } from "../src/types";

export function b64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

/** Abonnement navigateur factice mais cryptographiquement valide. */
export async function makeSubscription(endpoint = "https://web.push.apple.com/abc123") {
  const pair = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"])) as CryptoKeyPair;
  const raw = new Uint8Array((await crypto.subtle.exportKey("raw", pair.publicKey)) as ArrayBuffer);
  const auth = crypto.getRandomValues(new Uint8Array(16));
  return { endpoint, expirationTime: null, keys: { p256dh: b64url(raw), auth: b64url(auth) } };
}

export class MemoryKV {
  store = new Map<string, string>();
  async get(key: string) {
    return this.store.get(key) ?? null;
  }
  async put(key: string, value: string) {
    this.store.set(key, value);
  }
  async delete(key: string) {
    this.store.delete(key);
  }
}

export async function makeEnv(over: Partial<Env> = {}): Promise<Env & { KLEIO_KV: MemoryKV }> {
  const vapid = await generateVapidKeys();
  return {
    KLEIO_KV: new MemoryKV() as unknown as KVNamespace,
    KLEIO_KEY: "cle-de-test",
    VAPID_PUBLIC_KEY: vapid.publicKey,
    VAPID_PRIVATE_KEY: vapid.privateKey,
    VAPID_SUBJECT: "https://github.com/marievachelard/kleio",
    ...over,
  } as Env & { KLEIO_KV: MemoryKV };
}
