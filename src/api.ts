import { listDays, resolveDay } from "./content";
import type { ContentData } from "./merge";
import { parisDate } from "./dates";
import { sendPush } from "./push";
import { getSendState, getSubscription, saveSubscription, setSubscriptionValid } from "./store";
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
const unauthorized = () => json({ error: "unauthorized" }, 401);

function isAuthorized(req: Request, env: Env): boolean {
  const key = req.headers.get("X-Kleio-Key");
  return key !== null && key === env.KLEIO_KEY && env.KLEIO_KEY !== "";
}

function isValidSubscription(x: unknown): x is PushSubscriptionJSON {
  const s = x as PushSubscriptionJSON | null;
  return (
    !!s &&
    typeof s.endpoint === "string" &&
    s.endpoint.startsWith("https://") &&
    typeof s.keys?.auth === "string" &&
    typeof s.keys?.p256dh === "string"
  );
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
    if (!isAuthorized(req, env)) return unauthorized();
    const body = await req.json().catch(() => null);
    if (!isValidSubscription(body)) return json({ error: "invalid-subscription" }, 400);
    await saveSubscription(env, body);
    return new Response(null, { status: 204, headers: NO_STORE });
  }

  if (path === "/api/test" && req.method === "POST") {
    if (!isAuthorized(req, env)) return unauthorized();
    const sub = await getSubscription(env);
    if (!sub) return json({ ok: false, error: "no-subscription" }, 409);
    const result = await sendPush(
      sub,
      { title: "Notification de test", body: "Kleio est bien activé sur cet iPhone.", url: "/#/setup" },
      env,
      fetchFn,
    );
    if (!result.ok && result.gone) await setSubscriptionValid(env, false);
    return json({ ok: result.ok });
  }

  if (path === "/api/status" && req.method === "GET") {
    if (!isAuthorized(req, env)) return unauthorized();
    const [sub, state] = await Promise.all([getSubscription(env), getSendState(env)]);
    return json({
      subscribed: sub !== null,
      subscriptionValid: state.subscriptionValid,
      lastSentDate: state.lastSentDate,
      lastSendOk: state.lastSendOk,
      todayReady: resolveDay(today, today, data) !== null,
    });
  }

  return notFound();
}
