import { describe, test, expect } from "bun:test";
import { ContextCalculator } from "../src/logic/ContextCalculator.ts";
import { ANSI_COLORS } from "../src/types.ts";
import { Icons } from "../src/icons.ts";

describe("ContextCalculator", () => {
  test("calculates remaining tokens", () => {
    expect(ContextCalculator.calculateRemainingTokens(50000, 200000)).toBe(150000);
    expect(ContextCalculator.calculateRemainingTokens(0, 200000)).toBe(200000);
    expect(ContextCalculator.calculateRemainingTokens(200000, 200000)).toBe(0);
  });

  test("calculates remaining percent", () => {
    expect(ContextCalculator.calculateRemainingPercent(50000, 200000)).toBe(75);
    expect(ContextCalculator.calculateRemainingPercent(0, 200000)).toBe(100);
    expect(ContextCalculator.calculateRemainingPercent(200000, 200000)).toBe(0);
  });

  test("calculates remaining after buffer", () => {
    // usableSpace = 200000 - 45000 = 155000
    // remaining = 155000 - 50000 = 105000
    // percentage = (105000 / 155000) * 100 = 67.74%
    expect(Math.round(ContextCalculator.calculateRemainingAfterBuffer(50000, 200000, 45000))).toBe(68);

    // usableSpace = 200000 - 45000 = 155000
    // remaining = 155000 - 0 = 155000
    // percentage = (155000 / 155000) * 100 = 100%
    expect(ContextCalculator.calculateRemainingAfterBuffer(0, 200000, 45000)).toBe(100);
  });

  test("selects green color for high percentage", () => {
    const thresholds = { green: 65, yellow: 45, orange: 20 };
    expect(ContextCalculator.selectColor(75, thresholds)).toBe(ANSI_COLORS.green);
    expect(ContextCalculator.selectColor(100, thresholds)).toBe(ANSI_COLORS.green);
  });

  test("selects yellow color for medium percentage", () => {
    const thresholds = { green: 65, yellow: 45, orange: 20 };
    expect(ContextCalculator.selectColor(50, thresholds)).toBe(ANSI_COLORS.yellow);
    expect(ContextCalculator.selectColor(60, thresholds)).toBe(ANSI_COLORS.yellow);
  });

  test("selects orange color for low percentage", () => {
    const thresholds = { green: 65, yellow: 45, orange: 20 };
    expect(ContextCalculator.selectColor(30, thresholds)).toBe(ANSI_COLORS.orange);
    expect(ContextCalculator.selectColor(40, thresholds)).toBe(ANSI_COLORS.orange);
  });

  test("selects red color for very low percentage", () => {
    const thresholds = { green: 65, yellow: 45, orange: 20 };
    expect(ContextCalculator.selectColor(10, thresholds)).toBe(ANSI_COLORS.red);
    expect(ContextCalculator.selectColor(0, thresholds)).toBe(ANSI_COLORS.red);
  });

  test("selects compact icon when compacted", () => {
    expect(ContextCalculator.selectCompactIcon(true)).toBe(Icons.COMPACTED);
  });

  test("selects not compacted icon when not compacted", () => {
    expect(ContextCalculator.selectCompactIcon(false)).toBe(Icons.NOT_COMPACTED);
  });

  test("formats max tokens with cyan suffix", () => {
    const cyan = "\x1b[36m";
    const reset = "\x1b[0m";
    expect(ContextCalculator.formatMaxTokens(200000)).toBe(`200${cyan}K${reset}`);
    expect(ContextCalculator.formatMaxTokens(1000000)).toBe(`1${cyan}M${reset}🚀`);
    expect(ContextCalculator.formatMaxTokens(500)).toBe("500");
  });
});
