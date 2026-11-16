import { describe, expect, test } from "vitest";
import {
  formatDayTitle,
  formatEventDate,
  isValidIsoDate,
  parisClock,
  parisDate,
  shouldSendNow,
} from "../src/dates";

describe("parisDate", () => {
  test("passe au jour suivant quand il est déjà minuit passé à Paris (hiver)", () => {
    expect(parisDate(new Date("2026-11-16T23:30:00Z"))).toBe("2026-11-17");
  });
  test("passe au jour suivant quand il est déjà minuit passé à Paris (été)", () => {
    expect(parisDate(new Date("2026-07-14T22:30:00Z"))).toBe("2026-07-15");
  });
  test("reste le même jour en milieu de journée", () => {
    expect(parisDate(new Date("2026-11-17T12:00:00Z"))).toBe("2026-11-17");
  });
});

describe("parisClock", () => {
  test("renvoie l'heure locale de Paris", () => {
    expect(parisClock(new Date("2026-11-17T07:30:00Z"))).toEqual({ hour: 8, minute: 30 });
    expect(parisClock(new Date("2026-07-14T06:30:00Z"))).toEqual({ hour: 8, minute: 30 });
  });
});

describe("shouldSendNow", () => {
  test("hiver : vrai à 07:30 UTC, faux à 06:30 UTC", () => {
    expect(shouldSendNow(new Date("2026-11-17T07:30:00Z"))).toBe(true);
    expect(shouldSendNow(new Date("2026-11-17T06:30:00Z"))).toBe(false);
  });
  test("été : vrai à 06:30 UTC, faux à 07:30 UTC", () => {
    expect(shouldSendNow(new Date("2026-07-14T06:30:00Z"))).toBe(true);
    expect(shouldSendNow(new Date("2026-07-14T07:30:00Z"))).toBe(false);
  });
  test("accepte un retard de quelques minutes mais pas 08:29 ni 09:00", () => {
    expect(shouldSendNow(new Date("2026-11-17T07:35:00Z"))).toBe(true);
    expect(shouldSendNow(new Date("2026-11-17T07:29:00Z"))).toBe(false);
    expect(shouldSendNow(new Date("2026-11-17T08:00:00Z"))).toBe(false);
  });
  test("jours de bascule : exactement un des deux horaires UTC déclenche", () => {
    for (const day of ["2027-03-28", "2026-10-25"]) {
      const a = shouldSendNow(new Date(`${day}T06:30:00Z`));
      const b = shouldSendNow(new Date(`${day}T07:30:00Z`));
      expect([a, b].filter(Boolean)).toHaveLength(1);
    }
  });
});

describe("formats français", () => {
  test("formatEventDate", () => {
    expect(formatEventDate(16, 11, 1945)).toBe("16 novembre 1945");
    expect(formatEventDate(1, 3, 1815)).toBe("1er mars 1815");
    expect(formatEventDate(8, 5, 1945)).toBe("8 mai 1945");
  });
  test("formatDayTitle", () => {
    expect(formatDayTitle("2026-11-16")).toBe("16 novembre");
    expect(formatDayTitle("2026-03-01")).toBe("1er mars");
  });
});

describe("isValidIsoDate", () => {
  test("rejette le 29 février d'une année non bissextile", () => {
    expect(isValidIsoDate("2027-02-29")).toBe(false);
    expect(isValidIsoDate("2028-02-29")).toBe(true);
  });
  test("rejette les formats et les jours impossibles", () => {
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("2026-13-01")).toBe(false);
    expect(isValidIsoDate("16/11/2026")).toBe(false);
    expect(isValidIsoDate("2026-11-16")).toBe(true);
  });
});
