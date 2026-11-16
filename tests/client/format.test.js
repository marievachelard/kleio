import { describe, expect, test } from "vitest";
import { addMonth, formatDayTitle, formatEventDate, monthName } from "../../public/app/format.js";

describe("format", () => {
  test("formatEventDate met 1er et le nom du mois", () => {
    expect(formatEventDate(16, 11, 1945)).toBe("16 novembre 1945");
    expect(formatEventDate(1, 3, 1815)).toBe("1er mars 1815");
  });
  test("formatDayTitle donne le jour sans l'année", () => {
    expect(formatDayTitle("2026-11-17")).toBe("17 novembre");
    expect(formatDayTitle("2026-03-01")).toBe("1er mars");
  });
  test("monthName met une majuscule", () => {
    expect(monthName("2026-11")).toBe("Novembre");
    expect(monthName("2026-08")).toBe("Août");
  });
  test("addMonth passe d'une année à l'autre", () => {
    expect(addMonth("2026-01", -1)).toBe("2025-12");
    expect(addMonth("2026-12", 1)).toBe("2027-01");
    expect(addMonth("2026-11", 1)).toBe("2026-12");
  });
});
