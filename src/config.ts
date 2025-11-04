/**
 * Configuration loading and management
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { Config } from "./types";

/**
 * Find config file by searching in standard locations
 * If configFile is absolute, use it directly
 * If configFile is relative, search in: project .claude/ → user ~/.claude/ → script dir
 */
function findConfigPath(
  configFile: string,
  projectDir?: string
): string | null {
  // Absolute path - use directly
  if (configFile.startsWith("/")) {
    return existsSync(configFile) ? configFile : null;
  }

  const home = process.env.HOME || "";

  // Relative path - search in order
  // 1. Project .claude directory
  if (projectDir) {
    const projectPath = join(projectDir, ".claude", configFile);
    if (existsSync(projectPath)) {
      return projectPath;
    }
  }

  // 2. User home .claude directory
  if (home) {
    const homePath = join(home, ".claude", configFile);
    if (existsSync(homePath)) {
      return homePath;
    }
  }

  // 3. Script directory
  const scriptPath = join(import.meta.dir, "..", configFile);
  if (existsSync(scriptPath)) {
    return scriptPath;
  }

  return null;
}

export function loadConfig(
  projectDir?: string,
  configFile: string = "statusline-config.json"
): Config {
  const defaultConfig: Config = {
    "context-color-levels": [65, 45, 20],
    "model-context-windows": {
      "claude-sonnet-4-5-20250929": 200000,
      "claude-sonnet-4-20250514": 200000,
      "claude-opus-4-20250514": 200000,
      "claude-3-5-sonnet-20241022": 200000,
      "claude-3-5-sonnet-20240620": 200000,
      "claude-3-opus-20240229": 200000,
      "claude-3-sonnet-20240229": 200000,
      "claude-3-haiku-20240307": 200000,
    },
    "display-name-model-context-windows": {
      "Sonnet 4.5": 200000,
      "Sonnet 4": 200000,
      "Opus 4": 200000,
      "Haiku 4": 200000,
    },
    "model-display-name-map": {},
    "default-context-window": 200000,
    "compact-buffer": 45000,
    "save-sample": {
      enable: false,
      filename: "sample-input.json",
    },
  };

  const configPath = findConfigPath(configFile, projectDir);

  if (configPath) {
    try {
      const configData = JSON.parse(readFileSync(configPath, "utf8"));
      return {
        "context-color-levels":
          configData["context-color-levels"] ||
          defaultConfig["context-color-levels"],
        "model-context-windows":
          configData["model-context-windows"] ||
          defaultConfig["model-context-windows"],
        "display-name-model-context-windows":
          configData["display-name-model-context-windows"] ||
          defaultConfig["display-name-model-context-windows"],
        "model-display-name-map":
          configData["model-display-name-map"] ||
          defaultConfig["model-display-name-map"],
        "default-context-window":
          configData["default-context-window"] ??
          defaultConfig["default-context-window"],
        "compact-buffer":
          configData["compact-buffer"] ?? defaultConfig["compact-buffer"],
        "save-sample": {
          enable:
            configData["save-sample"]?.enable ??
            defaultConfig["save-sample"].enable,
          filename:
            configData["save-sample"]?.filename ||
            defaultConfig["save-sample"].filename,
        },
      };
    } catch {
      return defaultConfig;
    }
  }
  return defaultConfig;
}

export function getModelContextWindow(
  config: Config,
  modelId: string,
  displayName?: string
): { tokens: number; source: "id" | "display-name" | "default" } {
  // Try model ID first
  if (config["model-context-windows"][modelId]) {
    return {
      tokens: config["model-context-windows"][modelId],
      source: "id",
    };
  }

  // Try display name as fallback
  if (
    displayName &&
    config["display-name-model-context-windows"][displayName]
  ) {
    return {
      tokens: config["display-name-model-context-windows"][displayName],
      source: "display-name",
    };
  }

  // Use configured default
  return { tokens: config["default-context-window"], source: "default" };
}
