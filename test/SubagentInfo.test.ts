import { describe, test, expect } from "bun:test";
import { SubagentInfo } from "../src/components/SubagentInfo.ts";
import type { StatusLineInput } from "../src/types.ts";

describe("SubagentInfo", () => {
  test("creates SubagentInfo with subagent type", () => {
    const subagent = new SubagentInfo("code-reviewer");
    expect(subagent.subagentType).toBe("code-reviewer");
  });

  test("creates SubagentInfo with null subagent type", () => {
    const subagent = new SubagentInfo(null);
    expect(subagent.subagentType).toBeNull();
  });

  test("renders subagent type with formatting", () => {
    const subagent = new SubagentInfo("code-reviewer");
    const output = subagent.render();

    expect(output).toContain("🔍"); // Subagent icon
    expect(output).toContain("Code-Reviewer"); // Formatted name
  });

  test("renders single word subagent type", () => {
    const subagent = new SubagentInfo("explore");
    const output = subagent.render();

    expect(output).toContain("🔍");
    expect(output).toContain("Explore");
  });

  test("renders multi-word subagent type with hyphens", () => {
    const subagent = new SubagentInfo("test-runner");
    const output = subagent.render();

    expect(output).toContain("🔍");
    expect(output).toContain("Test-Runner");
  });

  test("renders multi-word subagent type with underscores", () => {
    const subagent = new SubagentInfo("debug_agent");
    const output = subagent.render();

    expect(output).toContain("🔍");
    expect(output).toContain("Debug-Agent");
  });

  test("returns empty string when no subagent type", () => {
    const subagent = new SubagentInfo(null);
    const output = subagent.render();

    expect(output).toBe("");
  });

  test("fromInput creates SubagentInfo from input with subagent_type", () => {
    const input: StatusLineInput = {
      subagent_type: "code-reviewer",
    };

    const subagent = SubagentInfo.fromInput(input);

    expect(subagent.subagentType).toBe("code-reviewer");
  });

  test("fromInput creates SubagentInfo from input without subagent_type", () => {
    const input: StatusLineInput = {};

    const subagent = SubagentInfo.fromInput(input);

    expect(subagent.subagentType).toBeNull();
  });

  test("fromInput handles undefined subagent_type", () => {
    const input: StatusLineInput = {
      subagent_type: undefined,
    };

    const subagent = SubagentInfo.fromInput(input);

    expect(subagent.subagentType).toBeNull();
  });

  test("renders with light blue color", () => {
    const subagent = new SubagentInfo("explore");
    const output = subagent.render();

    // Check for ANSI color codes (light blue is \x1b[36m)
    expect(output).toContain("\x1b[36m"); // Light blue color
    expect(output).toContain("\x1b[0m"); // Reset color
  });

  test("handles complex subagent type names", () => {
    const subagent = new SubagentInfo("general-purpose-agent");
    const output = subagent.render();

    expect(output).toContain("General-Purpose-Agent");
  });
});
