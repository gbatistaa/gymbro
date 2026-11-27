import { describe, expect, it } from "vitest";
import { formatSignedPercent, percentChange, variationDirection } from "./variation";

describe("percentChange", () => {
  it("is the change from the first value to the last, as a percentage of the first", () => {
    expect(percentChange(80, 84)).toBe(5);
    expect(percentChange(200, 150)).toBe(-25);
  });

  it("is zero when nothing changed", () => {
    expect(percentChange(82, 82)).toBe(0);
  });

  it("has no base to compare with when the first value is zero", () => {
    expect(percentChange(0, 10)).toBeNull();
  });

  it("is unknown when a value is missing", () => {
    expect(percentChange(null, 10)).toBeNull();
    expect(percentChange(10, undefined)).toBeNull();
  });

  it("uses the size of a negative base so the sign still follows the direction", () => {
    expect(percentChange(-10, -5)).toBe(50);
  });
});

describe("formatSignedPercent", () => {
  it("shows the sign and one decimal in pt-BR", () => {
    expect(formatSignedPercent(4.84)).toBe("+4,8%");
    expect(formatSignedPercent(-1.25)).toBe("−1,3%");
  });

  it("uses no sign for zero, including a change that rounds to zero", () => {
    expect(formatSignedPercent(0)).toBe("0%");
    expect(formatSignedPercent(0.04)).toBe("0%");
    expect(formatSignedPercent(-0.04)).toBe("0%");
  });

  it("is a dash without a value", () => {
    expect(formatSignedPercent(null)).toBe("—");
    expect(formatSignedPercent(undefined)).toBe("—");
  });
});

describe("variationDirection", () => {
  it("follows the rounded value shown on screen", () => {
    expect(variationDirection(3)).toBe("up");
    expect(variationDirection(-3)).toBe("down");
    expect(variationDirection(0.04)).toBe("flat");
    expect(variationDirection(0)).toBe("flat");
  });

  it("is flat without a value", () => {
    expect(variationDirection(null)).toBe("flat");
  });
});
