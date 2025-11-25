/**
 * Configuration loader
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { join, isAbsolute } from "path";
import type { Config } from "../types.ts";

export class ConfigLoader {
  /**
   * Load default configuration from package directory
   */
  private static loadDefaultConfig(): Config {
    const defaultConfigPath = join(import.meta.dir, "..", "..", "statusline-config.json");
    try {
      const content = readFileSync(defaultConfigPath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.error(`Failed to load default config from ${defaultConfigPath}:`, error);
      // Fallback to minimal config
      return {
        "context-color-levels": [65, 45, 20],
        "model-context-windows": {},
        "display-name-model-context-windows": {},
        "model-display-name-map": {},
        "default-context-window": 200000,
        "compact-buffer": 45000,
        "save-sample": {
          enabled: false,
          filename: ".temp/sample-input.json",
        },
        "animations": {
          enabled: false,
          "show-trend": false,
          "show-sparkline": false,
          spinner: "transportation",
        },
        "show-git-repo-name": false,
        "show-project-full-dir": false,
        "render-layout": "layout-1-line",
        "git-status-icons": {
          clean: "💎",
          dirty: "🛠️",
          staged: "📤",
        },
        "clear-model": true,
      };
    }
  }

  /**
   * Load configuration from file hierarchy
   * Merges configs in order: default → user → project → project.local
   */
  static load(
    projectDir: string,
    configFile = "statusline-config.json"
  ): Config {
    // Load default config from package directory
    let config = this.loadDefaultConfig();

    // Find all config files
    const configPaths = this.findAllConfigPaths(projectDir, configFile);

    // Merge each config file in order
    for (const configPath of configPaths) {
      try {
        const content = readFileSync(configPath, "utf-8");
        const fileConfig = JSON.parse(content);
        config = this.deepMerge(config, fileConfig);
      } catch (error) {
        console.error(`Failed to load config from ${configPath}:`, error);
      }
    }

    return config;
  }

  /**
   * Find all config files in hierarchy
   * Order: user → project → project.local (or absolute path only if provided)
   */
  private static findAllConfigPaths(
    projectDir: string,
    configFile: string
  ): string[] {
    // If absolute path, use only that file
    if (isAbsolute(configFile)) {
      return existsSync(configFile) ? [configFile] : [];
    }

    const configDir = process.env.CLAUDE_CONFIG_DIR || join(process.env.HOME || "", ".claude");

    const searchPaths = [
      // User level (from CLAUDE_CONFIG_DIR or ~/.claude)
      join(configDir, configFile),
      // Project level
      join(projectDir, ".claude", configFile),
      // Project local level
      join(projectDir, ".claude", configFile.replace(/\.json$/, ".local.json")),
    ];

    return searchPaths.filter(existsSync);
  }

  /**
   * Deep merge configuration objects
   * Recursively merges nested objects and arrays
   */
  private static deepMerge(defaults: Config, overrides: Partial<Config>): Config {
    const result = { ...defaults };

    for (const key of Object.keys(overrides) as Array<keyof Config>) {
      const value = overrides[key];
      const defaultValue = defaults[key];

      if (value === undefined) {
        continue;
      }

      // If both values are objects (but not arrays), recursively merge
      if (
        value !== null &&
        defaultValue !== null &&
        typeof value === "object" &&
        typeof defaultValue === "object" &&
        !Array.isArray(value) &&
        !Array.isArray(defaultValue)
      ) {
        result[key] = this.deepMerge(defaultValue as any, value as any) as any;
      } else {
        // Otherwise, override completely (including arrays)
        result[key] = value as any;
      }
    }

    return result;
  }

  /**
   * Parse CLI arguments
   */
  static parseArgs(args: string[]): {
    configFile: string;
    colorLevels: [number, number, number] | null;
    saveSample: boolean;
    saveSampleFilename: string | null;
    layout: string | null;
    spinner: string | null;
    clearModel: boolean;
  } {
    let configFile = "statusline-config.json";
    let colorLevels: [number, number, number] | null = null;
    let saveSample = false;
    let saveSampleFilename: string | null = null;
    let layout: string | null = null;
    let spinner: string | null = null;
    let clearModel = false;

    for (const arg of args) {
      if (arg.startsWith("--config=")) {
        configFile = arg.slice("--config=".length);
      } else if (arg.startsWith("--context-levels=")) {
        const levels = arg
          .slice("--context-levels=".length)
          .split(",")
          .map((s) => parseInt(s.trim(), 10));

        if (
          levels.length === 3 &&
          levels.every((n) => !isNaN(n) && n >= 0 && n <= 100) &&
          levels[0] > levels[1] &&
          levels[1] > levels[2]
        ) {
          colorLevels = levels as [number, number, number];
        }
      } else if (arg === "--save-sample") {
        saveSample = true;
      } else if (arg.startsWith("--save-sample=")) {
        saveSample = true;
        saveSampleFilename = arg.slice("--save-sample=".length);
      } else if (arg.startsWith("--layout=")) {
        layout = arg.slice("--layout=".length);
      } else if (arg.startsWith("--spinner=")) {
        spinner = arg.slice("--spinner=".length);
      } else if (arg === "--clear-model") {
        clearModel = true;
      }
    }

    return { configFile, colorLevels, saveSample, saveSampleFilename, layout, spinner, clearModel };
  }

  /**
   * Apply CLI overrides to config
   */
  static applyOverrides(
    config: Config,
    colorLevels: [number, number, number] | null,
    saveSample: boolean,
    saveSampleFilename: string | null,
    layout: string | null,
    spinner: string | null,
    clearModel: boolean
  ): Config {
    const result = { ...config };

    if (colorLevels) {
      result["context-color-levels"] = colorLevels;
    }

    if (saveSample) {
      result["save-sample"] = {
        enabled: true,
        filename: saveSampleFilename || result["save-sample"].filename,
      };
    }

    if (layout) {
      result["render-layout"] = layout;
    }

    if (spinner) {
      result.animations = {
        ...result.animations,
        spinner: spinner as any,
      };
    }

    if (clearModel) {
      result["clear-model"] = true;
    }

    return result;
  }

  /**
   * Clear model field from Claude settings.json
   * Reads ~/.claude/settings.json (or CLAUDE_CONFIG_DIR), removes model field, and saves
   */
  static async clearModelFromSettings(): Promise<void> {
    const configDir = process.env.CLAUDE_CONFIG_DIR || join(process.env.HOME || "", ".claude");
    const settingsPath = join(configDir, "settings.json");

    // If settings.json doesn't exist, nothing to clear
    if (!existsSync(settingsPath)) {
      return;
    }

    try {
      const content = await readFile(settingsPath, "utf-8");
      const settings = JSON.parse(content);

      // If model field doesn't exist, nothing to do
      if (!("model" in settings)) {
        return;
      }

      // Delete model field
      delete settings.model;

      // Write back to file
      await writeFile(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
    } catch (error) {
      // Silently fail - don't break statusline if we can't clear model
      console.error(`Failed to clear model from ${settingsPath}:`, error);
    }
  }
}
