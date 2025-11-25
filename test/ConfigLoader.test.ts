import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { ConfigLoader } from "../src/services/ConfigLoader.ts";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
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

  test("merges project.local.json over project.json", () => {
    const projectConfig = join(claudeDir, "statusline-config.json");
    const localConfig = join(claudeDir, "statusline-config.local.json");

    writeFileSync(
      projectConfig,
      JSON.stringify({
        "context-color-levels": [70, 50, 30],
        "compact-buffer": 50000,
      })
    );

    writeFileSync(
      localConfig,
      JSON.stringify({
        "context-color-levels": [80, 60, 40],
      })
    );

    const config = ConfigLoader.load(projectDir);
    expect(config["context-color-levels"]).toEqual([80, 60, 40]); // From local
    expect(config["compact-buffer"]).toBe(50000); // From project
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
    const overridden = ConfigLoader.applyOverrides(config, [80, 60, 40], false, null, null, null, false);
    expect(overridden["context-color-levels"]).toEqual([80, 60, 40]);
  });

  test("applies save sample overrides", () => {
    const config = ConfigLoader.load(projectDir);
    const overridden = ConfigLoader.applyOverrides(config, null, true, "debug.json", null, null, false);
    expect(overridden["save-sample"].enabled).toBe(true);
    expect(overridden["save-sample"].filename).toBe("debug.json");
  });

  test("preserves config filename when enabling save-sample", () => {
    const config = ConfigLoader.load(projectDir);
    config["save-sample"].filename = "original.json";
    const overridden = ConfigLoader.applyOverrides(config, null, true, null, null, null, false);
    expect(overridden["save-sample"].enabled).toBe(true);
    expect(overridden["save-sample"].filename).toBe("original.json");
  });

  test("preserves default filename when config only sets enabled", () => {
    const configPath = join(claudeDir, "statusline-config.json");
    writeFileSync(
      configPath,
      JSON.stringify({ "save-sample": { enabled: true } })
    );

    const config = ConfigLoader.load(projectDir);
    expect(config["save-sample"].enabled).toBe(true);
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

  test("deep merges nested config objects", () => {
    const configPath = join(claudeDir, "statusline-config.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        "animations": {
          "enabled": false,
          // Only override enabled, should keep default spinner from package config
        },
        "git-status-icons": {
          "clean": "✨",
          // Only override clean, should keep default dirty and staged
        },
      })
    );

    const config = ConfigLoader.load(projectDir);

    // Check animations deep merge
    expect(config.animations.enabled).toBe(false); // User override
    expect(config.animations.spinner).toBe("transportation"); // From default package config

    // Check git-status-icons deep merge
    expect(config["git-status-icons"].clean).toBe("✨"); // User override
    expect(config["git-status-icons"].dirty).toBe("🛠️"); // From default
    expect(config["git-status-icons"].staged).toBe("📤"); // From default
  });

  test("loads default config from package directory", () => {
    // Test without any user config
    const config = ConfigLoader.load(projectDir);

    // Should load from statusline-config.json in package root
    expect(config["model-context-windows"]["claude-sonnet-4-5-20250929"]).toBe(200000);
    expect(config["model-context-windows"]["claude-sonnet-4-5-20250929[1m]"]).toBe(1000000);
    expect(config["display-name-model-context-windows"]["Sonnet 4.5"]).toBe(200000);
  });

  test("respects CLAUDE_CONFIG_DIR environment variable", () => {
    const customConfigDir = join(testDir, "custom-claude-config");
    mkdirSync(customConfigDir, { recursive: true });

    const userConfigPath = join(customConfigDir, "statusline-config.json");
    writeFileSync(
      userConfigPath,
      JSON.stringify({
        "compact-buffer": 60000,
      })
    );

    // Set CLAUDE_CONFIG_DIR
    const originalEnv = process.env.CLAUDE_CONFIG_DIR;
    process.env.CLAUDE_CONFIG_DIR = customConfigDir;

    const config = ConfigLoader.load(projectDir);

    // Restore original env
    if (originalEnv === undefined) {
      delete process.env.CLAUDE_CONFIG_DIR;
    } else {
      process.env.CLAUDE_CONFIG_DIR = originalEnv;
    }

    expect(config["compact-buffer"]).toBe(60000);
  });

  test("merges all configs in correct order: user → project → project.local", () => {
    // Create user config directory
    const userConfigDir = join(testDir, "user-claude");
    mkdirSync(userConfigDir, { recursive: true });

    const userConfig = join(userConfigDir, "statusline-config.json");
    const projectConfig = join(claudeDir, "statusline-config.json");
    const localConfig = join(claudeDir, "statusline-config.local.json");

    // User config sets A and B
    writeFileSync(
      userConfig,
      JSON.stringify({
        "context-color-levels": [70, 50, 30],
        "compact-buffer": 50000,
      })
    );

    // Project config overrides A, keeps B
    writeFileSync(
      projectConfig,
      JSON.stringify({
        "context-color-levels": [75, 55, 35],
      })
    );

    // Local config overrides A again
    writeFileSync(
      localConfig,
      JSON.stringify({
        "context-color-levels": [80, 60, 40],
      })
    );

    // Set CLAUDE_CONFIG_DIR
    const originalEnv = process.env.CLAUDE_CONFIG_DIR;
    process.env.CLAUDE_CONFIG_DIR = userConfigDir;

    const config = ConfigLoader.load(projectDir);

    // Restore original env
    if (originalEnv === undefined) {
      delete process.env.CLAUDE_CONFIG_DIR;
    } else {
      process.env.CLAUDE_CONFIG_DIR = originalEnv;
    }

    expect(config["context-color-levels"]).toEqual([80, 60, 40]); // From local (last)
    expect(config["compact-buffer"]).toBe(50000); // From user (not overridden)
  });

  test("parses --clear-model flag", () => {
    const args = ["--clear-model"];
    const parsed = ConfigLoader.parseArgs(args);
    expect(parsed.clearModel).toBe(true);
  });

  test("applies clearModel override", () => {
    const config = ConfigLoader.load(projectDir);
    const overridden = ConfigLoader.applyOverrides(config, null, false, null, null, null, true);
    expect(overridden["clear-model"]).toBe(true);
  });

  test("clearModelFromSettings removes model field from settings.json", async () => {
    const customConfigDir = join(testDir, "custom-claude-clear");
    mkdirSync(customConfigDir, { recursive: true });

    const settingsPath = join(customConfigDir, "settings.json");
    writeFileSync(
      settingsPath,
      JSON.stringify({
        model: "claude-sonnet-4",
        otherSetting: "keep-this",
      }, null, 2)
    );

    // Set CLAUDE_CONFIG_DIR
    const originalEnv = process.env.CLAUDE_CONFIG_DIR;
    process.env.CLAUDE_CONFIG_DIR = customConfigDir;

    await ConfigLoader.clearModelFromSettings();

    // Restore original env
    if (originalEnv === undefined) {
      delete process.env.CLAUDE_CONFIG_DIR;
    } else {
      process.env.CLAUDE_CONFIG_DIR = originalEnv;
    }

    // Read back and verify
    const content = readFileSync(settingsPath, "utf-8");
    const settings = JSON.parse(content);
    expect(settings.model).toBeUndefined();
    expect(settings.otherSetting).toBe("keep-this");
  });

  test("clearModelFromSettings does nothing if settings.json doesn't exist", async () => {
    const customConfigDir = join(testDir, "no-settings");
    mkdirSync(customConfigDir, { recursive: true });

    // Set CLAUDE_CONFIG_DIR
    const originalEnv = process.env.CLAUDE_CONFIG_DIR;
    process.env.CLAUDE_CONFIG_DIR = customConfigDir;

    // Should not throw
    await expect(ConfigLoader.clearModelFromSettings()).resolves.toBeUndefined();

    // Restore original env
    if (originalEnv === undefined) {
      delete process.env.CLAUDE_CONFIG_DIR;
    } else {
      process.env.CLAUDE_CONFIG_DIR = originalEnv;
    }
  });

  test("clearModelFromSettings does nothing if model field doesn't exist", async () => {
    const customConfigDir = join(testDir, "no-model-field");
    mkdirSync(customConfigDir, { recursive: true });

    const settingsPath = join(customConfigDir, "settings.json");
    const originalSettings = { otherSetting: "value" };
    writeFileSync(settingsPath, JSON.stringify(originalSettings, null, 2));

    // Set CLAUDE_CONFIG_DIR
    const originalEnv = process.env.CLAUDE_CONFIG_DIR;
    process.env.CLAUDE_CONFIG_DIR = customConfigDir;

    await ConfigLoader.clearModelFromSettings();

    // Restore original env
    if (originalEnv === undefined) {
      delete process.env.CLAUDE_CONFIG_DIR;
    } else {
      process.env.CLAUDE_CONFIG_DIR = originalEnv;
    }

    // Settings should be unchanged
    const content = readFileSync(settingsPath, "utf-8");
    const settings = JSON.parse(content);
    expect(settings).toEqual(originalSettings);
  });
});
