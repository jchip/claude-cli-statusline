/**
 * Git service for I/O operations
 * Handles git command execution and transcript parsing
 */

import { spawnSync } from "bun";
import { readFileSync, existsSync } from "fs";

export class GitService {
  /**
   * Get git branch using git command
   */
  static getBranchFromCommand(dir: string): string | null {
    try {
      const result = spawnSync([
        "git",
        "-C",
        dir,
        "rev-parse",
        "--abbrev-ref",
        "HEAD",
      ]);

      if (result.exitCode === 0) {
        return result.stdout.toString().trim();
      }
    } catch {
      // Ignore error
    }

    return null;
  }

  /**
   * Get repo name using git command
   */
  static getRepoNameFromCommand(dir: string): string | null {
    try {
      // Try to get repo name from remote URL
      const result = spawnSync(["git", "-C", dir, "remote", "get-url", "origin"]);

      if (result.exitCode === 0) {
        const remoteUrl = result.stdout.toString().trim();

        // Extract repo name from URL
        // Handles: git@github.com:user/repo.git, https://github.com/user/repo.git, etc.
        const match = remoteUrl.match(/\/([^\/]+?)(\.git)?$/);
        if (match && match[1]) {
          return match[1];
        }
      }

      // Fallback: use top-level directory basename
      const fallbackResult = spawnSync(["git", "-C", dir, "rev-parse", "--show-toplevel"]);

      if (fallbackResult.exitCode === 0) {
        const toplevel = fallbackResult.stdout.toString().trim();
        const parts = toplevel.replace(/\/$/, "").split("/");
        return parts[parts.length - 1] || null;
      }
    } catch {
      // Ignore error
    }

    return null;
  }

  /**
   * Get git branch from transcript file
   */
  static getBranchFromTranscript(transcriptPath: string): string | null {
    if (!existsSync(transcriptPath)) {
      return null;
    }

    try {
      const content = readFileSync(transcriptPath, "utf-8");
      const lines = content.split("\n").filter((l) => l.trim());

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.gitBranch) {
            return entry.gitBranch;
          }
        } catch {
          // Skip invalid line
        }
      }
    } catch {
      // Ignore error
    }

    return null;
  }

  /**
   * Check if working tree is clean (no unstaged changes)
   * Returns true if working tree is clean (even if there are staged changes)
   */
  static isWorkingTreeClean(dir: string): boolean | null {
    try {
      const result = spawnSync(["git", "-C", dir, "status", "--porcelain"]);

      if (result.exitCode === 0) {
        const output = result.stdout.toString();
        const lines = output.split("\n").filter((l) => l.trim());

        // Check for unstaged changes (second character is not space)
        // Format: XY filename, where X is staged status, Y is unstaged status
        // Clean working tree means Y is always space
        for (const line of lines) {
          const secondChar = line[1];
          if (secondChar && secondChar !== " ") {
            return false; // Has unstaged changes
          }
        }
        return true; // No unstaged changes (working tree is clean)
      }
    } catch {
      // Ignore error
    }

    return null;
  }

  /**
   * Check if there are staged changes (changes in index)
   * Returns true if there are staged changes, false if not, null on error
   */
  static hasStagedChanges(dir: string): boolean | null {
    try {
      const result = spawnSync(["git", "-C", dir, "status", "--porcelain"]);

      if (result.exitCode === 0) {
        const output = result.stdout.toString();
        const lines = output.split("\n").filter((l) => l.trim());

        // Check for staged changes (first character is not space or ?)
        // Format: XY filename, where X is staged status, Y is unstaged status
        // Staged files have: M (modified), A (added), D (deleted), R (renamed), C (copied)
        for (const line of lines) {
          const firstChar = line[0];
          if (firstChar && firstChar !== " " && firstChar !== "?") {
            return true;
          }
        }
        return false;
      }
    } catch {
      // Ignore error
    }

    return null;
  }
}
