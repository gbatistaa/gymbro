import { describe, expect, it } from "vitest";
import { applyOrder } from "./order";

const items = [{ key: "a" }, { key: "b" }, { key: "c" }, { key: "d" }];
const keyOf = (item: { key: string }): string => item.key;

describe("applyOrder", () => {
  it("keeps the default order without a saved one", () => {
    expect(applyOrder(items, keyOf, []).map(keyOf)).toEqual(["a", "b", "c", "d"]);
  });

  it("follows the saved order", () => {
    expect(applyOrder(items, keyOf, ["c", "a", "d", "b"]).map(keyOf)).toEqual(["c", "a", "d", "b"]);
  });

  it("puts items missing from the saved order at the end, in their default order", () => {
    expect(applyOrder(items, keyOf, ["d", "b"]).map(keyOf)).toEqual(["d", "b", "a", "c"]);
  });

  it("ignores saved keys that no longer exist", () => {
    expect(applyOrder(items, keyOf, ["x", "c", "y"]).map(keyOf)).toEqual(["c", "a", "b", "d"]);
  });

  it("does not repeat an item listed twice", () => {
    expect(applyOrder(items, keyOf, ["b", "b", "a"]).map(keyOf)).toEqual(["b", "a", "c", "d"]);
  });

  it("does not change the input", () => {
    const input = [...items];
    applyOrder(input, keyOf, ["d"]);
    expect(input).toEqual(items);
  });
});
