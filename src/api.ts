import { listDays, resolveDay } from "./content";
import type { ContentData } from "./merge";
import { parisDate } from "./dates";
import { sendPush } from "./push";
import { isAllowedPushEndpoint } from "./endpoints";
import { deleteSubscription, getRecord, saveSubscription } from "./store";
import type { Env, PushSubscriptionJSON } from "./types";

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

const NO_STORE = { "Cache-Control": "no-store" };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...NO_STORE },
  });
}

const notFound = () => json({ error: "not-found" }, 404);

function isValidSubscription(x: unknown): x is PushSubscriptionJSON {
  const s = x as PushSubscriptionJSON | null;
  return (
    !!s &&
    typeof s.endpoint === "string" &&
    s.endpoint.startsWith("https://") &&
    typeof s.keys?.auth === "string" &&
    typeof s.keys?.p256dh === "string" &&
    isAllowedPushEndpoint(s.endpoint)
  );
}

async function endpointFrom(req: Request): Promise<string | null> {
  const body = (await req.json().catch(() => null)) as { endpoint?: unknown } | null;
  return typeof body?.endpoint === "string" ? body.endpoint : null;
}

export async function handleApi(
  req: Request,
  env: Env,
  now: Date,
  data: ContentData,
  fetchFn: FetchLike = fetch,
): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const today = parisDate(now);

  if (req.method === "GET" && path === "/api/config") {
    return json({ vapidPublicKey: env.VAPID_PUBLIC_KEY });
  }

  if (req.method === "GET" && path === "/api/days") {
    return json({ today, launchDate: data.launchDate, days: listDays(today, data) });
  }

  const dayMatch = /^\/api\/day\/([^/]+)$/.exec(path);
  if (req.method === "GET" && dayMatch) {
    const view = resolveDay(dayMatch[1], today, data);
    return view ? json(view) : notFound();
  }

  if (path === "/api/subscribe" && req.method === "POST") {
    const body = await req.json().catch(() => null);
    if (!isValidSubscription(body)) return json({ error: "invalid-subscription" }, 400);
    const saved = await saveSubscription(env, body);
    if (saved === "full") return json({ error: "full" }, 503);
    return new Response(null, { status: 204, headers: NO_STORE });
  }

  if (path === "/api/test" && req.method === "POST") {
    const endpoint = await endpointFrom(req);
    const record = endpoint ? await getRecord(env, endpoint) : null;
    if (!endpoint || !record) return notFound();
    const result = await sendPush(
      record.subscription,
      { title: "Notification de test", body: "Kleio est bien activé sur ce téléphone.", url: "/#/setup" },
      env,
      fetchFn,
    );
    if (!result.ok && result.gone) await deleteSubscription(env, endpoint);
    return json({ ok: result.ok });
  }

  if (path === "/api/status" && req.method === "POST") {
    const endpoint = await endpointFrom(req);
    const record = endpoint ? await getRecord(env, endpoint) : null;
    return json({
      subscribed: record !== null,
      lastSentDate: record?.lastSentDate ?? null,
      lastSendOk: record?.lastSendOk ?? null,
      todayReady: resolveDay(today, today, data) !== null,
    });
  }

  return notFound();
}
