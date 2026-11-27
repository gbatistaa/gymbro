import { describe, expect, it } from "vitest";
import {
  monotonePath,
  monotoneSegments,
  nearestIndex,
  niceTicks,
  scaleLinear,
  valueDomain,
  type ChartPoint,
} from "./chart-math";

describe("scaleLinear", () => {
  it("maps the domain onto the range", () => {
    const scale = scaleLinear([0, 100], [200, 0]);

    expect(scale(0)).toBe(200);
    expect(scale(50)).toBe(100);
    expect(scale(100)).toBe(0);
  });

  it("puts every value in the middle of the range when the domain is a single value", () => {
    const scale = scaleLinear([5, 5], [0, 100]);

    expect(scale(5)).toBe(50);
  });
});

describe("niceTicks", () => {
  it("covers the values with round steps", () => {
    expect(niceTicks(3, 97, 5)).toEqual([0, 20, 40, 60, 80, 100]);
  });

  it("keeps decimal steps free of floating point noise", () => {
    expect(niceTicks(80.2, 81.7, 4)).toEqual([80, 80.5, 81, 81.5, 82]);
  });

  it("opens a window around a single value", () => {
    const ticks = niceTicks(82, 82, 4);

    expect(ticks[0]).toBeLessThan(82);
    expect(ticks[ticks.length - 1]).toBeGreaterThan(82);
  });

  it("opens a window around zero", () => {
    expect(niceTicks(0, 0, 4)).toEqual([-1, -0.5, 0, 0.5, 1]);
  });
});

describe("valueDomain", () => {
  it("uses the first and last tick as the domain", () => {
    expect(valueDomain([12, 47, 30])).toEqual({ min: 10, max: 50, ticks: [10, 20, 30, 40, 50] });
  });

  it("falls back to a unit domain without values", () => {
    expect(valueDomain([])).toEqual({ min: 0, max: 1, ticks: [0, 1] });
  });
});

describe("monotoneSegments", () => {
  it("never overshoots the neighbouring values", () => {
    const points: ChartPoint[] = [
      { x: 0, y: 10 },
      { x: 1, y: 10.2 },
      { x: 2, y: 30 },
      { x: 3, y: 30.1 },
      { x: 4, y: 5 },
      { x: 5, y: 5 },
    ];

    for (const [index, segment] of monotoneSegments(points).entries()) {
      const low = Math.min(points[index].y, points[index + 1].y);
      const high = Math.max(points[index].y, points[index + 1].y);

      for (const control of [segment.control1, segment.control2]) {
        expect(control.y).toBeGreaterThanOrEqual(low - 1e-9);
        expect(control.y).toBeLessThanOrEqual(high + 1e-9);
      }
    }
  });

  it("keeps a flat stretch flat", () => {
    const [segment] = monotoneSegments([
      { x: 0, y: 4 },
      { x: 1, y: 4 },
    ]);

    expect(segment.control1.y).toBe(4);
    expect(segment.control2.y).toBe(4);
  });

  it("places control points a third of the way along x", () => {
    const [segment] = monotoneSegments([
      { x: 0, y: 0 },
      { x: 3, y: 3 },
    ]);

    expect(segment.control1.x).toBe(1);
    expect(segment.control2.x).toBe(2);
  });
});

describe("monotonePath", () => {
  it("is empty without points", () => {
    expect(monotonePath([])).toBe("");
  });

  it("is a single move for one point", () => {
    expect(monotonePath([{ x: 1, y: 2 }])).toBe("M1,2");
  });

  it("starts at the first point and ends at the last", () => {
    const path = monotonePath([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 2 },
    ]);

    expect(path.startsWith("M0,0C")).toBe(true);
    expect(path.endsWith(",20,2")).toBe(true);
  });
});

describe("nearestIndex", () => {
  const xs = [0, 10, 20, 40];

  it("finds the closest x", () => {
    expect(nearestIndex(xs, 14)).toBe(1);
    expect(nearestIndex(xs, 16)).toBe(2);
    expect(nearestIndex(xs, 33)).toBe(3);
  });

  it("clamps outside the data", () => {
    expect(nearestIndex(xs, -5)).toBe(0);
    expect(nearestIndex(xs, 99)).toBe(3);
  });

  it("is -1 without data", () => {
    expect(nearestIndex([], 3)).toBe(-1);
  });
});
