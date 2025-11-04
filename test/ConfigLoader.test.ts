import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { ConfigLoader } from "../src/services/ConfigLoader.ts";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";

describe("ConfigLoader", () => {
  const testDir = "/tmp/test-config-loader";
  const projectDir = join(testDir, "project");
  const claudeDir = join(projectDir, ".claude");

  beforeEach(() => {
    // Clean up and create test directories
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(projectDir, { recursive: true });
    mkdirSync(claudeDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  test("loads default config when no file exists", () => {
    const config = ConfigLoader.load(projectDir);
    expect(config["context-color-levels"]).toEqual([65, 45, 20]);
    expect(config["default-context-window"]).toBe(200000);
    expect(config["compact-buffer"]).toBe(45000);
  });

  test("loads config from project directory", () => {
    const configPath = join(claudeDir, "statusline-config.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        "context-color-levels": [70, 50, 30],
      })
    );

    const config = ConfigLoader.load(projectDir);
    expect(config["context-color-levels"]).toEqual([70, 50, 30]);
  });

  test("loads config from absolute path", () => {
    const configPath = join(testDir, "custom-config.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        "compact-buffer": 50000,
      })
    );

    const config = ConfigLoader.load(projectDir, configPath);
    expect(config["compact-buffer"]).toBe(50000);
  });

  test("merges config with defaults", () => {
    const configPath = join(claudeDir, "statusline-config.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        "compact-buffer": 50000,
      })
    );

    const config = ConfigLoader.load(projectDir);
    expect(config["compact-buffer"]).toBe(50000);
    expect(config["context-color-levels"]).toEqual([65, 45, 20]); // Default
  });

  test("parses --config argument", () => {
    const args = ["--config=/path/to/config.json"];
    const parsed = ConfigLoader.parseArgs(args);
    expect(parsed.configFile).toBe("/path/to/config.json");
  });

  test("parses --context-levels argument", () => {
    const args = ["--context-levels=75,55,30"];
    const parsed = ConfigLoader.parseArgs(args);
    expect(parsed.colorLevels).toEqual([75, 55, 30]);
  });

  test("rejects invalid --context-levels", () => {
    const args = ["--context-levels=75,55,60"]; // Not descending
    const parsed = ConfigLoader.parseArgs(args);
    expect(parsed.colorLevels).toBeNull();
  });

  test("parses --save-sample flag", () => {
    const args = ["--save-sample"];
    const parsed = ConfigLoader.parseArgs(args);
    expect(parsed.saveSample).toBe(true);
    expect(parsed.saveSampleFilename).toBeNull();
  });

  test("parses --save-sample with filename", () => {
    const args = ["--save-sample=custom.json"];
    const parsed = ConfigLoader.parseArgs(args);
    expect(parsed.saveSample).toBe(true);
    expect(parsed.saveSampleFilename).toBe("custom.json");
  });

  test("applies color level overrides", () => {
    const config = ConfigLoader.load(projectDir);
    const overridden = ConfigLoader.applyOverrides(config, [80, 60, 40], false, null);
    expect(overridden["context-color-levels"]).toEqual([80, 60, 40]);
  });

  test("applies save sample overrides", () => {
    const config = ConfigLoader.load(projectDir);
    const overridden = ConfigLoader.applyOverrides(config, null, true, "debug.json");
    expect(overridden["save-sample"].enable).toBe(true);
    expect(overridden["save-sample"].filename).toBe("debug.json");
  });

  test("preserves config filename when enabling save-sample", () => {
    const config = ConfigLoader.load(projectDir);
    config["save-sample"].filename = "original.json";
    const overridden = ConfigLoader.applyOverrides(config, null, true, null);
    expect(overridden["save-sample"].enable).toBe(true);
    expect(overridden["save-sample"].filename).toBe("original.json");
  });

  test("preserves default filename when config only sets enable", () => {
    const configPath = join(claudeDir, "statusline-config.json");
    writeFileSync(
      configPath,
      JSON.stringify({ "save-sample": { enable: true } })
    );

    const config = ConfigLoader.load(projectDir);
    expect(config["save-sample"].enable).toBe(true);
    expect(config["save-sample"].filename).toBe(".temp/sample-input.json");
  });

  test("handles malformed config file gracefully", () => {
    const configPath = join(claudeDir, "statusline-config.json");
    writeFileSync(configPath, "invalid json {{{");

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    const config = ConfigLoader.load(projectDir);

    console.error = originalError;

    // Should return defaults
    expect(config["context-color-levels"]).toEqual([65, 45, 20]);
    expect(config["default-context-window"]).toBe(200000);
  });

  test("returns defaults when config file is not JSON", () => {
    const configPath = join(claudeDir, "statusline-config.json");
    writeFileSync(configPath, "this is not json at all");

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    const config = ConfigLoader.load(projectDir);

    console.error = originalError;

    expect(config["compact-buffer"]).toBe(45000);
  });
});
