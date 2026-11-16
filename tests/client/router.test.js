import { describe, expect, test } from "vitest";
import { parseRoute } from "../../public/app/router.js";

describe("parseRoute", () => {
  test("ouvrir l'app sans adresse particulière arrive sur le calendrier", () => {
    expect(parseRoute("")).toEqual({ name: "calendar" });
    expect(parseRoute("#")).toEqual({ name: "calendar" });
    expect(parseRoute("#/")).toEqual({ name: "calendar" });
  });

  test("le lien d'une notification ouvre le détail du jour", () => {
    expect(parseRoute("#/day/2026-11-17")).toEqual({ name: "day", date: "2026-11-17" });
  });

  test("les écrans connus sont reconnus", () => {
    expect(parseRoute("#/calendar")).toEqual({ name: "calendar" });
    expect(parseRoute("#/setup")).toEqual({ name: "setup" });
  });

  test("une adresse inconnue ou mal formée arrive sur le calendrier", () => {
    expect(parseRoute("#/n-importe-quoi")).toEqual({ name: "calendar" });
    expect(parseRoute("#/day/hier")).toEqual({ name: "calendar" });
    expect(parseRoute("#/day/2026-11-17/extra")).toEqual({ name: "calendar" });
  });
});
