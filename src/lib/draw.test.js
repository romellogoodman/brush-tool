import { describe, it, expect } from "vitest";
import { hexToRgb, rotateAround } from "./draw.js";

describe("hexToRgb", () => {
  it("parses black", () => {
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
  });

  it("parses white", () => {
    expect(hexToRgb("#ffffff")).toEqual([255, 255, 255]);
  });

  it("parses a mixed color", () => {
    expect(hexToRgb("#94dbff")).toEqual([148, 219, 255]);
  });

  it("parses the brand black", () => {
    expect(hexToRgb("#1b1b1b")).toEqual([27, 27, 27]);
  });
});

describe("rotateAround", () => {
  it("translates to the center when rotation is zero", () => {
    const rot = rotateAround(100, 50, 0);
    const [x, y] = rot(10, 20);
    expect(x).toBeCloseTo(110);
    expect(y).toBeCloseTo(70);
  });

  it("rotates 90 degrees about the center", () => {
    const rot = rotateAround(0, 0, Math.PI / 2);
    const [x, y] = rot(1, 0);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(1);
  });

  it("rotates 180 degrees about the center", () => {
    const rot = rotateAround(5, 5, Math.PI);
    const [x, y] = rot(2, 3);
    expect(x).toBeCloseTo(3);
    expect(y).toBeCloseTo(2);
  });
});
