import { describe, test, expect } from "bun:test";
import { Icons } from "../src/icons.ts";
import { SPINNER_STYLES } from "../src/logic/AnimationUtils.ts";
import { ConfigLoader } from "../src/services/ConfigLoader.ts";

// Text-default symbols + U+FE0F render 2 cells wide but many terminals
// advance the cursor 1 cell, so the rest of the line overlaps. ZWJ
// sequences have the same problem. Use single-codepoint emoji instead.
const isSafe = (s: string) => !/[\uFE0F\u200D]/.test(s);

describe("icons are terminal-width safe", () => {
  test("Icons", () => {
    for (const [name, icon] of Object.entries(Icons)) {
      expect(`${name}:${isSafe(icon)}`).toBe(`${name}:true`);
    }
  });

  test("spinner styles", () => {
    for (const [style, frames] of Object.entries(SPINNER_STYLES)) {
      for (const f of frames) expect(`${style}:${f}:${isSafe(f)}`).toBe(`${style}:${f}:true`);
    }
  });

  test("default git-status-icons", () => {
    const icons = (ConfigLoader as any).loadDefaultConfig()["git-status-icons"];
    for (const icon of Object.values(icons)) expect(isSafe(icon)).toBe(true);
  });
});
