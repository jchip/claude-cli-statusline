/**
 * Additional logic tests to improve coverage
 */

import { describe, test, expect } from "bun:test";
import { ContextCalculator } from "../src/logic/ContextCalculator.ts";
import { GitResolver } from "../src/logic/GitResolver.ts";
import { ModelMatcher } from "../src/logic/ModelMatcher.ts";

describe("LogicCoverage", () => {
  test("ContextCalculator.calculateRemainingPercent edge cases", () => {
    expect(ContextCalculator.calculateRemainingPercent(0, 100)).toBe(100);
    expect(ContextCalculator.calculateRemainingPercent(100, 100)).toBe(0);
    expect(ContextCalculator.calculateRemainingPercent(50, 100)).toBe(50);
  });

  test("ContextCalculator.calculateRemainingAfterBuffer edge cases", () => {
    // usableSpace = 100 - 20 = 80
    // remaining = 80 - 0 = 80
    // percentage = (80 / 80) * 100 = 100%
    expect(ContextCalculator.calculateRemainingAfterBuffer(0, 100, 20)).toBe(100);

    // usableSpace = 100 - 20 = 80
    // remaining = 80 - 80 = 0
    // percentage = (0 / 80) * 100 = 0%
    expect(ContextCalculator.calculateRemainingAfterBuffer(80, 100, 20)).toBe(0);
  });

  test("ContextCalculator.selectColor for all ranges", () => {
    const thresholds = { green: 65, yellow: 45, orange: 20 };
    expect(ContextCalculator.selectColor(70, thresholds)).toBe("\x1b[32m");
    expect(ContextCalculator.selectColor(50, thresholds)).toBe("\x1b[33m");
    expect(ContextCalculator.selectColor(30, thresholds)).toBe("\x1b[38;5;208m");
    expect(ContextCalculator.selectColor(10, thresholds)).toBe("\x1b[31m");
  });

  test("ContextCalculator.selectCompactIcon", () => {
    expect(ContextCalculator.selectCompactIcon(true)).toBe("💫");
    expect(ContextCalculator.selectCompactIcon(false)).toBe("⚡️");
  });

  test("ContextCalculator.formatMaxTokens", () => {
    expect(ContextCalculator.formatMaxTokens(1000)).toContain("K");
    expect(ContextCalculator.formatMaxTokens(1000000)).toContain("M");
    expect(ContextCalculator.formatMaxTokens(500)).toBe("500");
  });

  test("GitResolver.getProjectDirBasename", () => {
    const result = GitResolver.getProjectDirBasename("/home/user/project");
    expect(result).toBe("project");
  });

  test("GitResolver.resolveGitBranch priority order", () => {
    // Input branch has highest priority
    const result1 = GitResolver.resolveGitBranch(
      "input-branch",
      "cached-branch",
      process.cwd(),
      undefined
    );
    expect(result1).toBe("input-branch");

    // Cached branch second priority
    const result2 = GitResolver.resolveGitBranch(
      undefined,
      "cached-branch",
      process.cwd(),
      undefined
    );
    expect(result2).toBe("cached-branch");

    // Falls back to git command
    const result3 = GitResolver.resolveGitBranch(
      undefined,
      undefined,
      process.cwd(),
      undefined
    );
    expect(result3).not.toBeNull();
  });

  test("GitResolver.resolveRepoName with no branch", () => {
    const result = GitResolver.resolveRepoName(null, undefined, process.cwd());
    expect(result).toBeNull();
  });

  test("GitResolver.resolveRepoName with cached value", () => {
    const result = GitResolver.resolveRepoName(
      "main",
      "cached-repo",
      process.cwd()
    );
    expect(result).toBe("cached-repo");
  });

  test("ModelMatcher.matchByModelId with exact match", () => {
    const config = {
      "model-context-windows": { "test-model": 100000 },
      "display-name-model-context-windows": {},
      "model-display-name-map": {},
      "default-context-window": 200000,
      "context-color-levels": [65, 45, 20],
      "compact-buffer": 45000,
      "save-sample": { enable: false, filename: "" },
    };
    const result = ModelMatcher.matchByModelId("test-model", config);
    expect(result).not.toBeNull();
    expect(result?.maxTokens).toBe(100000);
    expect(result?.matchType).toBe("model-id");
  });

  test("ModelMatcher.matchByDisplayName", () => {
    const config = {
      "model-context-windows": {},
      "display-name-model-context-windows": { "Test Model": 150000 },
      "model-display-name-map": {},
      "default-context-window": 200000,
      "context-color-levels": [65, 45, 20],
      "compact-buffer": 45000,
      "save-sample": { enable: false, filename: "" },
    };
    const result = ModelMatcher.matchByDisplayName("Test Model", config);
    expect(result).not.toBeNull();
    expect(result?.maxTokens).toBe(150000);
    expect(result?.matchType).toBe("display-name");
  });

  test("ModelMatcher.getDefault", () => {
    const config = {
      "model-context-windows": {},
      "display-name-model-context-windows": {},
      "model-display-name-map": {},
      "default-context-window": 200000,
      "context-color-levels": [65, 45, 20],
      "compact-buffer": 45000,
      "save-sample": { enable: false, filename: "" },
    };
    const result = ModelMatcher.getDefault(config);
    expect(result.maxTokens).toBe(200000);
    expect(result.matchType).toBe("default");
  });

  test("ModelMatcher.getMatchIndicator", () => {
    expect(ModelMatcher.getMatchIndicator("model-id")).toBe("");
    expect(ModelMatcher.getMatchIndicator("display-name")).toBe("🏷️");
    expect(ModelMatcher.getMatchIndicator("default")).toBe("⚙️");
  });

  test("ModelMatcher.mapDisplayName with mapping", () => {
    const config = {
      "model-display-name-map": { "Long Model Name": "Short" },
    };
    const result = ModelMatcher.mapDisplayName("Long Model Name", config);
    expect(result).toBe("Short");
  });

  test("ModelMatcher.mapDisplayName without mapping", () => {
    const config = { "model-display-name-map": {} };
    const result = ModelMatcher.mapDisplayName("Model Name", config);
    expect(result).toBe("Model Name");
  });
});
