import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchDay, fetchDays } from "../../public/app/api.js";

afterEach(() => vi.unstubAllGlobals());

describe("api client", () => {
  test("fetchDay renvoie null sur un 404", async () => {
    vi.stubGlobal("fetch", async () => new Response("{}", { status: 404 }));
    expect(await fetchDay("2026-11-18")).toBeNull();
  });

  test("fetchDay renvoie le détail quand tout va bien", async () => {
    vi.stubGlobal("fetch", async (url) => {
      expect(url).toBe("/api/day/2026-11-17");
      return new Response(JSON.stringify({ date: "2026-11-17" }), { status: 200 });
    });
    expect(await fetchDay("2026-11-17")).toEqual({ date: "2026-11-17" });
  });

  test("fetchDay laisse remonter une erreur réseau", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("hors ligne");
    });
    await expect(fetchDay("2026-11-17")).rejects.toThrow();
  });

  test("fetchDays renvoie la liste", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ today: "2026-11-17", days: [] }), { status: 200 }));
    expect((await fetchDays()).today).toBe("2026-11-17");
  });
});
