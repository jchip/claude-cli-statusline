/**
 * Configuration loader
 */

import { existsSync, readFileSync } from "fs";
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
          enable: false,
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
      };
    }
  }

  /**
   * Load configuration from file hierarchy
   * Loads default config from package, then overlays user config
   */
  static load(
    projectDir: string,
    configFile = "statusline-config.json"
  ): Config {
    // Load default config from package directory
    const defaultConfig = this.loadDefaultConfig();

    // Find user config
    const userConfigPath = this.findUserConfigPath(projectDir, configFile);

    if (!userConfigPath) {
      return defaultConfig;
    }

    try {
      const content = readFileSync(userConfigPath, "utf-8");
      const userConfig = JSON.parse(content);
      // Deep merge user config into default config
      return this.deepMerge(defaultConfig, userConfig);
    } catch (error) {
      console.error(`Failed to load config from ${userConfigPath}:`, error);
      return defaultConfig;
    }
  }

  /**
   * Find user config file in hierarchy
   * Order: absolute path → project/.claude → user ~/.claude
   */
  private static findUserConfigPath(
    projectDir: string,
    configFile: string
  ): string | null {
    // If absolute path, use directly
    if (isAbsolute(configFile)) {
      return existsSync(configFile) ? configFile : null;
    }

    const searchPaths = [
      // Project level
      join(projectDir, ".claude", configFile),
      // User level
      join(process.env.HOME || "", ".claude", configFile),
    ];

    for (const path of searchPaths) {
      if (existsSync(path)) {
        return path;
      }
    }

    return null;
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
  } {
    let configFile = "statusline-config.json";
    let colorLevels: [number, number, number] | null = null;
    let saveSample = false;
    let saveSampleFilename: string | null = null;
    let layout: string | null = null;
    let spinner: string | null = null;

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
      }
    }

    return { configFile, colorLevels, saveSample, saveSampleFilename, layout, spinner };
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
    spinner: string | null
  ): Config {
    const result = { ...config };

    if (colorLevels) {
      result["context-color-levels"] = colorLevels;
    }

    if (saveSample) {
      result["save-sample"] = {
        enable: true,
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

    return result;
  }
}
