/**
 * Configuration loading and management
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { Config } from "./types";

/**
 * Find config file in order of precedence:
 * 1. .claude/statusline-config.json in workspace project directory
 * 2. ~/.claude/statusline-config.json
 * 3. config.json in script directory
 */
function findConfigPath(projectDir?: string): string | null {
  const home = process.env.HOME || "";

  // 1. Check project .claude directory (from workspace.project_dir)
  if (projectDir) {
    const projectConfig = join(projectDir, ".claude", "statusline-config.json");
    if (existsSync(projectConfig)) {
      return projectConfig;
    }
  }

  // 2. Check home .claude directory
  if (home) {
    const homeConfig = join(home, ".claude", "statusline-config.json");
    if (existsSync(homeConfig)) {
      return homeConfig;
    }
  }

  // 3. Check script directory
  const scriptConfig = join(import.meta.dir, "..", "config.json");
  if (existsSync(scriptConfig)) {
    return scriptConfig;
  }

  return null;
}

export function loadConfig(projectDir?: string): Config {
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
    "compact-buffer": 45000,
    "save-sample": {
      enable: false,
      filename: "sample-input.json",
    },
  };

  const configPath = findConfigPath(projectDir);

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

export function getModelContextWindow(config: Config, modelId: string): number {
  return config["model-context-windows"][modelId] || 200000; // default to 200k
}
