import { handleApi } from "./api";
import { loadContent } from "./content";
import { runDaily } from "./daily";
import type { Env } from "./types";

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (pathname.startsWith("/api/")) return handleApi(req, env, new Date(), loadContent());
    return new Response("Not found", { status: 404 });
  },

  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runDaily(env, new Date(), loadContent()));
  },
} satisfies ExportedHandler<Env>;
