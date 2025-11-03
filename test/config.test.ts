import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { loadConfig, getModelContextWindow } from "../src/config";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

describe("config", () => {
  const testDir = "/tmp/config-test";

  beforeEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("loadConfig", () => {
    it("should return default config when no config file exists", () => {
      const config = loadConfig();
      expect(config["context-color-levels"]).toEqual([65, 45, 20]);
      expect(config["default-context-window"]).toBe(200000);
      expect(config["compact-buffer"]).toBe(45000);
    });

    it("should load config from absolute path", () => {
      const configPath = join(testDir, "test-config.json");
      const customConfig = {
        "context-color-levels": [70, 50, 30],
        "default-context-window": 150000,
      };
      writeFileSync(configPath, JSON.stringify(customConfig));

      const config = loadConfig(undefined, configPath);
      expect(config["context-color-levels"]).toEqual([70, 50, 30]);
      expect(config["default-context-window"]).toBe(150000);
      expect(config["compact-buffer"]).toBe(45000); // default value
    });

    it("should load config from project .claude directory", () => {
      const claudeDir = join(testDir, ".claude");
      mkdirSync(claudeDir);
      const configPath = join(claudeDir, "statusline-config.json");
      const customConfig = {
        "model-context-windows": {
          "test-model": 100000,
        },
      };
      writeFileSync(configPath, JSON.stringify(customConfig));

      const config = loadConfig(testDir);
      expect(config["model-context-windows"]["test-model"]).toBe(100000);
    });

    it("should load config from user home .claude directory", () => {
      const home = process.env.HOME || "/tmp";
      const claudeDir = join(home, ".claude");
      mkdirSync(claudeDir, { recursive: true });
      const configPath = join(claudeDir, "statusline-config.json");
      const customConfig = {
        "save-sample": {
          enable: true,
          filename: "custom-sample.json",
        },
      };
      writeFileSync(configPath, JSON.stringify(customConfig));

      const config = loadConfig();
      expect(config["save-sample"].enable).toBe(true);
      expect(config["save-sample"].filename).toBe("custom-sample.json");

      // Cleanup
      rmSync(claudeDir, { recursive: true, force: true });
    });

    it("should merge config with defaults", () => {
      const configPath = join(testDir, "test-config.json");
      const partialConfig = {
        "context-color-levels": [80, 60, 40],
      };
      writeFileSync(configPath, JSON.stringify(partialConfig));

      const config = loadConfig(undefined, configPath);
      expect(config["context-color-levels"]).toEqual([80, 60, 40]);
      expect(config["default-context-window"]).toBe(200000); // default
    });

    it("should handle config read errors gracefully", () => {
      const configPath = join(testDir, "invalid-config.json");
      writeFileSync(configPath, "invalid json");

      const config = loadConfig(undefined, configPath);
      expect(config["context-color-levels"]).toEqual([65, 45, 20]); // defaults
      expect(config["default-context-window"]).toBe(200000);
    });

    it("should handle non-existent absolute path", () => {
      const config = loadConfig(undefined, "/nonexistent/path.json");
      expect(config["context-color-levels"]).toEqual([65, 45, 20]); // defaults
    });
  });

  describe("getModelContextWindow", () => {
    const config = loadConfig();

    it("should return model-specific context window", () => {
      const result = getModelContextWindow(
        config,
        "claude-3-5-sonnet-20241022"
      );
      expect(result.tokens).toBe(200000);
      expect(result.source).toBe("id");
    });

    it("should return display name context window as fallback", () => {
      const result = getModelContextWindow(config, "unknown-model", "Sonnet 4");
      expect(result.tokens).toBe(200000);
      expect(result.source).toBe("display-name");
    });

    it("should return default context window when model not found", () => {
      const result = getModelContextWindow(config, "unknown-model");
      expect(result.tokens).toBe(200000);
      expect(result.source).toBe("default");
    });
  });
});
