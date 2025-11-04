import { describe, test, expect } from "bun:test";
import {
  spinner,
  pulse,
  trendArrow,
  sparkline,
  getSpinnerFrame,
  SPINNER_STYLES,
} from "../src/logic/AnimationUtils.ts";

describe("AnimationUtils", () => {
  test("spinner returns a braille character", () => {
    const frame = spinner();
    expect(typeof frame).toBe("string");
    expect(frame.length).toBeGreaterThan(0);
    // Should be one of the braille spinner frames
    const brailleFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    expect(brailleFrames).toContain(frame);
  });

  test("pulse returns a pulse character", () => {
    const frame = pulse();
    expect(typeof frame).toBe("string");
    expect(frame.length).toBeGreaterThan(0);
    const pulseFrames = ["·", "∙", "•", "∙"];
    expect(pulseFrames).toContain(frame);
  });

  test("trendArrow shows up arrow when value increases", () => {
    expect(trendArrow(50, 60)).toBe("↗");
    expect(trendArrow(10, 90)).toBe("↗");
  });

  test("trendArrow shows down arrow when value decreases", () => {
    expect(trendArrow(60, 50)).toBe("↘");
    expect(trendArrow(90, 10)).toBe("↘");
  });

  test("trendArrow shows flat arrow when change is small", () => {
    expect(trendArrow(50, 50)).toBe("→");
    expect(trendArrow(50, 50.3)).toBe("→");
    expect(trendArrow(50, 49.7)).toBe("→");
  });

  test("trendArrow shows dot when values are missing", () => {
    expect(trendArrow(undefined, 50)).toBe("·");
    expect(trendArrow(50, undefined)).toBe("·");
    expect(trendArrow(undefined, undefined)).toBe("·");
  });

  test("sparkline returns empty string for empty array", () => {
    expect(sparkline([])).toBe("");
  });

  test("sparkline generates bar chart for values", () => {
    const result = sparkline([10, 20, 30, 40, 50]);
    expect(typeof result).toBe("string");
    expect(result.length).toBe(5);
    // Should use bar characters
    const bars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
    for (const char of result) {
      expect(bars).toContain(char);
    }
  });

  test("sparkline limits to last 8 values", () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const result = sparkline(values);
    expect(result.length).toBe(8);
  });

  test("sparkline shows ascending pattern", () => {
    const result = sparkline([10, 20, 30, 40, 50]);
    // Each character should be >= previous
    for (let i = 1; i < result.length; i++) {
      expect(result[i].charCodeAt(0)).toBeGreaterThanOrEqual(result[i - 1].charCodeAt(0));
    }
  });

  test("getSpinnerFrame with different styles", () => {
    const braille = getSpinnerFrame("braille");
    expect(SPINNER_STYLES.braille).toContain(braille);

    const dots = getSpinnerFrame("dots");
    expect(SPINNER_STYLES.dots).toContain(dots);

    const circular = getSpinnerFrame("circular");
    expect(SPINNER_STYLES.circular).toContain(circular);
  });

  test("getSpinnerFrame with custom speed", () => {
    const frame1 = getSpinnerFrame("braille", 100);
    const frame2 = getSpinnerFrame("braille", 100);
    // Both should be valid frames
    expect(SPINNER_STYLES.braille).toContain(frame1);
    expect(SPINNER_STYLES.braille).toContain(frame2);
  });
});
