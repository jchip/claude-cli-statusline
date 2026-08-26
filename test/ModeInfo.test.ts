import { describe, test, expect } from "bun:test";
import { ModeInfo } from "../src/components/ModeInfo.ts";
import type { StatusLineInput } from "../src/types.ts";

describe("ModeInfo", () => {
  test("renders nothing when no mode is active", () => {
    expect(new ModeInfo(null, false, false).render()).toBe("");
  });

  test("renders effort level with icon and color", () => {
    const output = new ModeInfo("high").render();

    expect(output).toContain("🎚️");
    expect(output).toContain("high");
    expect(output).toContain("\x1b[36m");
    expect(output).toContain("\x1b[0m");
  });

  test("renders thinking indicator when enabled", () => {
    const output = new ModeInfo(null, true).render();

    expect(output).toContain("💭");
    expect(output).not.toContain("💨");
  });

  test("renders fast mode indicator when enabled", () => {
    const output = new ModeInfo(null, false, true).render();

    expect(output).toContain("💨");
    expect(output).not.toContain("💭");
  });

  test("renders all indicators together in order", () => {
    const output = new ModeInfo("xhigh", true, true).render();

    expect(output.indexOf("xhigh")).toBeLessThan(output.indexOf("💭"));
    expect(output.indexOf("💭")).toBeLessThan(output.indexOf("💨"));
  });

  test("fromInput reads effort, thinking and fast_mode", () => {
    const input: StatusLineInput = {
      effort: { level: "high" },
      thinking: { enabled: true },
      fast_mode: true,
    };

    const mode = ModeInfo.fromInput(input);

    expect(mode.effortLevel).toBe("high");
    expect(mode.thinkingEnabled).toBe(true);
    expect(mode.fastMode).toBe(true);
  });

  test("fromInput treats absent fields as off", () => {
    const mode = ModeInfo.fromInput({});

    expect(mode.effortLevel).toBeNull();
    expect(mode.thinkingEnabled).toBe(false);
    expect(mode.fastMode).toBe(false);
    expect(mode.render()).toBe("");
  });

  test("fromInput treats thinking.enabled false as off", () => {
    const mode = ModeInfo.fromInput({ thinking: { enabled: false }, fast_mode: false });

    expect(mode.thinkingEnabled).toBe(false);
    expect(mode.fastMode).toBe(false);
  });
});
