import { describe, test, expect, beforeEach } from "bun:test";
import { StatusLineStateManager } from "../src/services/StatusLineStateManager.ts";

describe("StatusLineStateManager", () => {
  beforeEach(() => {
    // Clear state before each test
    StatusLineStateManager.clear();
  });

  test("loads empty state initially", () => {
    const state = StatusLineStateManager.load();
    expect(state).toEqual({});
  });

  test("saves and loads state", () => {
    const testState = {
      lastPercent: 75,
      series: [70, 72, 75],
      lastUpdated: Date.now(),
    };

    StatusLineStateManager.save(testState);
    const loaded = StatusLineStateManager.load();

    expect(loaded.lastPercent).toBe(75);
    expect(loaded.series).toEqual([70, 72, 75]);
  });

  test("updateWithPercent adds to series", () => {
    const state1 = StatusLineStateManager.updateWithPercent(70);
    expect(state1.lastPercent).toBe(70);
    expect(state1.series).toEqual([70]);

    const state2 = StatusLineStateManager.updateWithPercent(75);
    expect(state2.lastPercent).toBe(75);
    expect(state2.series).toEqual([70, 75]);
  });

  test("updateWithPercent limits series to 24 entries", () => {
    // Add 30 entries
    for (let i = 1; i <= 30; i++) {
      StatusLineStateManager.updateWithPercent(i);
    }

    const state = StatusLineStateManager.load();
    expect(state.series?.length).toBe(24);
    // Should keep the last 24
    expect(state.series?.[0]).toBe(7); // 30 - 24 + 1
    expect(state.series?.[23]).toBe(30);
  });

  test("getTrendArrow returns dot for first call", () => {
    const arrow = StatusLineStateManager.getTrendArrow(75);
    expect(arrow).toBe("·");
  });

  test("getTrendArrow shows up arrow for increase", () => {
    StatusLineStateManager.updateWithPercent(70);
    const arrow = StatusLineStateManager.getTrendArrow(75);
    expect(arrow).toBe("↗");
  });

  test("getTrendArrow shows down arrow for decrease", () => {
    StatusLineStateManager.updateWithPercent(75);
    const arrow = StatusLineStateManager.getTrendArrow(70);
    expect(arrow).toBe("↘");
  });

  test("getTrendArrow shows flat arrow for small change", () => {
    StatusLineStateManager.updateWithPercent(75);
    const arrow = StatusLineStateManager.getTrendArrow(75.2);
    expect(arrow).toBe("→");
  });

  test("getSparkline returns empty for no data", () => {
    const sparkline = StatusLineStateManager.getSparkline();
    expect(sparkline).toBe("");
  });

  test("getSparkline generates bars after updates", () => {
    StatusLineStateManager.updateWithPercent(10);
    StatusLineStateManager.updateWithPercent(20);
    StatusLineStateManager.updateWithPercent(30);

    const sparkline = StatusLineStateManager.getSparkline();
    expect(sparkline.length).toBe(3);
  });

  test("clear resets state", () => {
    StatusLineStateManager.updateWithPercent(75);
    StatusLineStateManager.clear();

    const state = StatusLineStateManager.load();
    expect(state).toEqual({});
  });

  test("handles multiple percentage rounds correctly", () => {
    StatusLineStateManager.updateWithPercent(75.7);
    const state = StatusLineStateManager.load();
    // Should round to 76
    expect(state.series).toEqual([76]);
  });
});
