import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  bioPresetRange,
  bucketForRange,
  calendarRange,
  exercisePresetRange,
  todayIn,
} from "./date-ranges";

const SAO_PAULO = "America/Sao_Paulo";
// 27/11/2026 01:30 em UTC ainda é 26/11 22:30 em São Paulo
const NOW = new Date("2026-11-27T01:30:00Z");

describe("calendar arithmetic", () => {
  it("reads today in the user's time zone, not UTC", () => {
    expect(todayIn(SAO_PAULO, NOW)).toBe("2026-11-26");
    expect(todayIn("UTC", NOW)).toBe("2026-11-27");
  });

  it("adds days across months and years", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("clamps the day when the target month is shorter", () => {
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(addMonths("2024-03-31", -1)).toBe("2024-02-29");
    expect(addMonths("2026-01-15", -12)).toBe("2025-01-15");
  });
});

describe("calendarRange", () => {
  it("runs from the start of the first day to the start of the day after the last", () => {
    expect(calendarRange("2026-11-01", "2026-11-26", SAO_PAULO)).toEqual({
      from: "2026-11-01T03:00:00.000Z",
      to: "2026-11-27T03:00:00.000Z",
    });
  });

  it("covers a single day", () => {
    expect(calendarRange("2026-11-26", "2026-11-26", "UTC")).toEqual({
      from: "2026-11-26T00:00:00.000Z",
      to: "2026-11-27T00:00:00.000Z",
    });
  });
});

describe("exercisePresetRange", () => {
  it("covers the last 7 days, today included", () => {
    expect(exercisePresetRange("week", SAO_PAULO, NOW)).toEqual(
      calendarRange("2026-11-20", "2026-11-26", SAO_PAULO),
    );
  });

  it("covers one month back", () => {
    expect(exercisePresetRange("month", SAO_PAULO, NOW)).toEqual(
      calendarRange("2026-10-27", "2026-11-26", SAO_PAULO),
    );
  });

  it("covers one year back", () => {
    expect(exercisePresetRange("year", SAO_PAULO, NOW)).toEqual(
      calendarRange("2025-11-27", "2026-11-26", SAO_PAULO),
    );
  });
});

describe("bioPresetRange", () => {
  it("starts this month on its first day", () => {
    expect(bioPresetRange("this-month", SAO_PAULO, NOW)).toEqual(
      calendarRange("2026-11-01", "2026-11-26", SAO_PAULO),
    );
  });

  it("counts months back from today", () => {
    expect(bioPresetRange("3-months", SAO_PAULO, NOW)).toEqual(
      calendarRange("2026-08-27", "2026-11-26", SAO_PAULO),
    );
    expect(bioPresetRange("6-months", SAO_PAULO, NOW)).toEqual(
      calendarRange("2026-05-27", "2026-11-26", SAO_PAULO),
    );
    expect(bioPresetRange("year", SAO_PAULO, NOW)).toEqual(
      calendarRange("2025-11-27", "2026-11-26", SAO_PAULO),
    );
  });

  it("covers the last 7 days for a week", () => {
    expect(bioPresetRange("week", SAO_PAULO, NOW)).toEqual(
      calendarRange("2026-11-20", "2026-11-26", SAO_PAULO),
    );
  });
});

describe("bucketForRange", () => {
  it("uses days up to about three months", () => {
    expect(bucketForRange(calendarRange("2026-11-20", "2026-11-26", "UTC"))).toBe("DAY");
    expect(bucketForRange(calendarRange("2026-08-27", "2026-11-26", "UTC"))).toBe("DAY");
  });

  it("uses weeks up to about a year", () => {
    expect(bucketForRange(calendarRange("2026-05-27", "2026-11-26", "UTC"))).toBe("WEEK");
    expect(bucketForRange(calendarRange("2025-11-27", "2026-11-26", "UTC"))).toBe("WEEK");
  });

  it("uses months beyond that", () => {
    expect(bucketForRange(calendarRange("2024-01-01", "2026-11-26", "UTC"))).toBe("MONTH");
  });
});
