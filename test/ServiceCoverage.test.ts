/**
 * Additional service tests to improve coverage
 */

import { describe, test, expect } from "bun:test";
import { CacheManager } from "../src/services/CacheManager.ts";
import { ConfigLoader } from "../src/services/ConfigLoader.ts";
import { SessionAnalyzer } from "../src/services/SessionAnalyzer.ts";
import { StatusLineStateManager } from "../src/services/StatusLineStateManager.ts";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join } from "path";

describe("ServiceCoverage", () => {
  test("CacheManager.read returns null for non-existent transcript", () => {
    const result = CacheManager.read("/non/existent/transcript.jsonl");
    expect(result).toBeNull();
  });


  test("ConfigLoader.load with non-existent config", () => {
    const config = ConfigLoader.load("/non/existent/dir");
    expect(config).toBeDefined();
    expect(config["context-color-levels"]).toEqual([65, 45, 20]);
  });

  test("ConfigLoader.parseArgs with all options", () => {
    const args = [
      "--config=custom.json",
      "--context-levels=70,50,25",
      "--save-sample=debug.json",
    ];
    const result = ConfigLoader.parseArgs(args);
    expect(result.configFile).toBe("custom.json");
    expect(result.colorLevels).toEqual([70, 50, 25]);
    expect(result.saveSample).toBe(true);
    expect(result.saveSampleFilename).toBe("debug.json");
  });

  test("ConfigLoader.parseArgs with invalid context levels", () => {
    const args = ["--context-levels=50,60,70"]; // Wrong order
    const result = ConfigLoader.parseArgs(args);
    expect(result.colorLevels).toBeNull();
  });

  test("ConfigLoader.applyOverrides applies all overrides", () => {
    const config = ConfigLoader.load(process.cwd());
    const overridden = ConfigLoader.applyOverrides(
      config,
      [70, 50, 25],
      true,
      "test.json"
    );
    expect(overridden["context-color-levels"]).toEqual([70, 50, 25]);
    expect(overridden["save-sample"].enable).toBe(true);
    expect(overridden["save-sample"].filename).toBe("test.json");
  });

  test("SessionAnalyzer.analyzeTranscript with empty transcript", () => {
    const testDir = "/tmp/test-session-analyzer";
    const transcriptPath = join(testDir, "empty.jsonl");

    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });

    // Create empty transcript
    writeFileSync(transcriptPath, "");

    const result = SessionAnalyzer.analyzeTranscript(transcriptPath);
    expect(result.usedTokens).toBe(0);
    expect(result.compactOccurred).toBe(false);

    rmSync(testDir, { recursive: true });
  });

  test("StatusLineStateManager.load returns empty for non-existent state", () => {
    const state = StatusLineStateManager.load();
    expect(state).toBeDefined();
  });

  test("StatusLineStateManager.updateWithPercent", () => {
    StatusLineStateManager.clear(); // Clear any existing state
    const state = StatusLineStateManager.updateWithPercent(75);
    expect(state.lastPercent).toBe(75);
    expect(state.series).toBeDefined();
    expect(state.lastUpdated).toBeDefined();
  });

  test("StatusLineStateManager.getTrendArrow", () => {
    StatusLineStateManager.clear();
    const arrow1 = StatusLineStateManager.getTrendArrow(50);
    expect(arrow1).toBe("·"); // No previous data

    StatusLineStateManager.updateWithPercent(50);
    const arrow2 = StatusLineStateManager.getTrendArrow(60);
    expect(arrow2).toBe("↗"); // Increasing
  });

  test("StatusLineStateManager.getSparkline", () => {
    StatusLineStateManager.clear();
    const empty = StatusLineStateManager.getSparkline();
    expect(empty).toBe(""); // No data

    StatusLineStateManager.updateWithPercent(50);
    StatusLineStateManager.updateWithPercent(60);
    const sparkline = StatusLineStateManager.getSparkline();
    expect(typeof sparkline).toBe("string");
  });
});
