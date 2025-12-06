import { describe, test, expect } from "bun:test";
import { ContextInfo } from "../src/components/ContextInfo.ts";

describe("ContextInfo", () => {
  test("creates ContextInfo with all properties", () => {
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    expect(context.usedTokens).toBe(50000);
    expect(context.maxTokens).toBe(200000);
    expect(context.compactBuffer).toBe(45000);
    expect(context.compactOccurred).toBe(false);
  });

  test("calculates remaining tokens", () => {
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    expect(context.remainingTokens).toBe(150000);
  });

  test("calculates remaining percent", () => {
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    expect(context.remainingPercent).toBe(75);
  });

  test("calculates remaining after buffer", () => {
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    // usableSpace = 200000 - 45000 = 155000
    // remaining = 155000 - 50000 = 105000
    // percentage = (105000 / 155000) * 100 = 67.74%
    expect(Math.round(context.remainingAfterBuffer)).toBe(68);
  });

  test("returns green color for high percentage", () => {
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    expect(context.color).toBe("\x1b[32m");
  });

  test("returns yellow color for medium percentage", () => {
    const context = new ContextInfo(100000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    expect(context.color).toBe("\x1b[33m");
  });

  test("returns orange color for low percentage", () => {
    const context = new ContextInfo(150000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    expect(context.color).toBe("\x1b[38;5;208m");
  });

  test("returns red color for very low percentage", () => {
    const context = new ContextInfo(170000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    expect(context.color).toBe("\x1b[31m");
  });

  test("returns independent color for buffer percentage", () => {
    // 50000 used, 150000 remaining = 75% (green)
    // usableSpace = 155000, remaining = 105000 = 67.74% (green)
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    expect(context.color).toBe("\x1b[32m"); // green for 75%
    expect(context.bufferColor).toBe("\x1b[32m"); // green for 67.74%
  });

  test("buffer color can be different from main color", () => {
    // 130000 used, 70000 remaining = 35% (orange)
    // 130000 used + 45000 buffer = 25000 remaining = 12.5% (red)
    const context = new ContextInfo(130000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    expect(context.color).toBe("\x1b[38;5;208m"); // orange for 35%
    expect(context.bufferColor).toBe("\x1b[31m"); // red for 12.5%
  });

  test("both colors can be the same when percentages are in same range", () => {
    // 10000 used, 190000 remaining = 95% (green)
    // 10000 used + 45000 buffer = 145000 remaining = 72.5% (green)
    const context = new ContextInfo(10000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    expect(context.color).toBe("\x1b[32m"); // green for 95%
    expect(context.bufferColor).toBe("\x1b[32m"); // green for 72.5%
  });

  test("shows ⚡️ icon when not compacted", () => {
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    expect(context.compactIcon).toBe("⚡️");
  });

  test("shows 💫 icon when compacted", () => {
    const context = new ContextInfo(50000, 200000, 45000, true, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    expect(context.compactIcon).toBe("💫");
  });

  test("formats max tokens display", () => {
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    expect(context.maxTokensDisplay).toContain("200");
    expect(context.maxTokensDisplay).toContain("K");
  });

  test("renders statusline output", () => {
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });
    const output = context.render();
    expect(output).toContain("⏬");
    expect(output).toContain("75%");
    expect(output).toContain("✦");
    expect(output).toContain("⚡️");
    expect(output).toContain("200");
    expect(output).toContain("K");
  });

  test("creates empty context with defaults", () => {
    const context = ContextInfo.createEmpty();
    expect(context.usedTokens).toBe(0);
    expect(context.maxTokens).toBe(200000);
    expect(context.remainingPercent).toBe(100);
  });

  test("creates empty context with custom values", () => {
    const context = ContextInfo.createEmpty(1000000, 50000, [70, 50, 25], "🏷️");
    expect(context.maxTokens).toBe(1000000);
    expect(context.compactBuffer).toBe(50000);
    expect(context.matchIndicator).toBe("🏷️");
  });

  test("creates from data", () => {
    const context = ContextInfo.fromData(
      100000,
      200000,
      45000,
      true,
      [70, 50, 25],
      "⚙️"
    );
    expect(context.usedTokens).toBe(100000);
    expect(context.compactOccurred).toBe(true);
    expect(context.matchIndicator).toBe("⚙️");
  });

  test("includes match indicator in render when present", () => {
    const context = new ContextInfo(
      50000,
      200000,
      45000,
      false,
      { green: 65, yellow: 45, orange: 20 },
      "🏷️"
    );
    const output = context.render();
    expect(output).toContain("🏷️");
  });

  test("excludes match indicator in render when empty", () => {
    const context = new ContextInfo(
      50000,
      200000,
      45000,
      false,
      { green: 65, yellow: 45, orange: 20 },
      ""
    );
    const output = context.render();
    expect(output).not.toContain("🏷️");
    expect(output).not.toContain("⚙️");
  });

  test("shows warning icon when exceeds_200k_tokens is true", () => {
    const context = ContextInfo.fromData(
      50000,
      200000,
      45000,
      false,
      [65, 45, 20],
      "",
      null,
      true // exceeds200k
    );
    const output = context.render();
    expect(output).toContain("⚠️");
    expect(output).not.toContain("⚡️");
    expect(output).not.toContain("💫");
  });

  test("shows normal lightning icon when exceeds_200k_tokens is false", () => {
    const context = ContextInfo.fromData(
      50000,
      200000,
      45000,
      false,
      [65, 45, 20],
      "",
      null,
      false // exceeds200k
    );
    const output = context.render();
    expect(output).toContain("⚡️");
    expect(output).not.toContain("⚠️");
    expect(output).not.toContain("💫");
  });

  test("shows warning icon even when compacted if exceeds_200k_tokens is true", () => {
    const context = ContextInfo.fromData(
      50000,
      200000,
      45000,
      true, // compacted
      [65, 45, 20],
      "",
      null,
      true // exceeds200k - takes precedence
    );
    const output = context.render();
    expect(output).toContain("⚠️");
    expect(output).not.toContain("⚡️");
    expect(output).not.toContain("💫");
  });
});
