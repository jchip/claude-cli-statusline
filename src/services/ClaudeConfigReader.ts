/**
 * Claude CLI config reader
 * Reads configuration from ~/.claude/.claude.json
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

interface ClaudeConfig {
  autoCompactEnabled?: boolean;
  [key: string]: unknown;
}

export class ClaudeConfigReader {
  /**
   * Get the path to Claude CLI config file
   */
  private static getConfigPath(): string {
    const home = process.env.HOME || process.env.USERPROFILE || "";
    return join(home, ".claude", ".claude.json");
  }

  /**
   * Read auto-compact enabled setting from Claude CLI config
   * @returns true if auto-compact is enabled, false if disabled, null if unknown
   */
  static readAutoCompactEnabled(): boolean | null {
    try {
      const configPath = this.getConfigPath();

      if (!existsSync(configPath)) {
        // Config file doesn't exist - assume auto-compact is enabled (Claude CLI default)
        return null;
      }

      const content = readFileSync(configPath, "utf-8");
      const config: ClaudeConfig = JSON.parse(content);

      // Return the value if set, otherwise null (unknown)
      return config.autoCompactEnabled ?? null;
    } catch {
      // Error reading or parsing - return null (unknown)
      return null;
    }
  }
}
