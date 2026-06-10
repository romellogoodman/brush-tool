import { describe, it, expect } from "vitest";
import { createHistory } from "./history.js";

describe("createHistory", () => {
  it("returns null on undo with only the baseline", () => {
    const h = createHistory();
    h.push("blank");
    expect(h.undo()).toBe(null);
  });

  it("undoes exactly one action at a time (the off-by-one regression)", () => {
    const h = createHistory();
    h.push("blank");
    h.push("stroke1");
    h.push("stroke2");
    // One undo should reveal stroke1, not jump back to blank.
    expect(h.undo()).toBe("stroke1");
    expect(h.undo()).toBe("blank");
    expect(h.undo()).toBe(null);
  });

  it("redoes after undo", () => {
    const h = createHistory();
    h.push("blank");
    h.push("stroke1");
    expect(h.undo()).toBe("blank");
    expect(h.redo()).toBe("stroke1");
    expect(h.redo()).toBe(null);
  });

  it("clears the redo stack when a new action is pushed", () => {
    const h = createHistory();
    h.push("blank");
    h.push("stroke1");
    h.undo();
    h.push("stroke2");
    expect(h.redo()).toBe(null);
    expect(h.undo()).toBe("blank");
  });

  it("caps retained states at max, dropping the oldest", () => {
    const h = createHistory(3);
    h.push("a");
    h.push("b");
    h.push("c");
    h.push("d"); // "a" drops off the front
    expect(h.past).toEqual(["b", "c", "d"]);
  });

  it("treats clear as a normal undoable action", () => {
    const h = createHistory();
    h.push("blank");
    h.push("drawing");
    h.push("blank-after-clear");
    expect(h.undo()).toBe("drawing");
  });
});
