/**
 * Git service for I/O operations
 * Handles git command execution and transcript parsing
 * Optimized: single git call, find .git by traversing directories
 */

import { spawnSync } from "bun";
import { readFileSync, existsSync, statSync } from "fs";
import { dirname, join } from "path";

export interface GitStatusResult {
  branch: string | null;
  isClean: boolean;
  hasStaged: boolean;
  repoName: string | null;
  gitDir: string | null;
}

export class GitService {
  /**
   * Find .git directory by traversing up from the given directory
   * Returns the path to .git dir, or null if not found
   */
  static findGitDir(startDir: string): string | null {
    let current = startDir;
    const root = "/";

    while (current !== root) {
      const gitPath = join(current, ".git");
      try {
        if (existsSync(gitPath)) {
          const stat = statSync(gitPath);
          if (stat.isDirectory()) {
            return gitPath;
          }
          // Handle git worktrees: .git is a file containing "gitdir: /path/to/git"
          if (stat.isFile()) {
            const content = readFileSync(gitPath, "utf-8").trim();
            const match = content.match(/^gitdir:\s*(.+)$/);
            if (match) {
              return match[1];
            }
          }
        }
      } catch {
        // Ignore access errors
      }
      current = dirname(current);
    }

    return null;
  }

  /**
   * Get repo name from .git/config by parsing remote origin URL
   * Falls back to directory name if no remote
   */
  static getRepoNameFromConfig(gitDir: string): string | null {
    try {
      const configPath = join(gitDir, "config");
      if (!existsSync(configPath)) {
        return null;
      }

      const content = readFileSync(configPath, "utf-8");
      // Look for [remote "origin"] section and url = line
      const remoteMatch = content.match(
        /\[remote\s+"origin"\][^\[]*url\s*=\s*(.+)/m
      );

      if (remoteMatch) {
        const url = remoteMatch[1].trim();
        // Extract repo name from URL
        // Handles: git@github.com:user/repo.git, https://github.com/user/repo.git, etc.
        const match =
          url.match(/\/([^\/]+?)(\.git)?$/) || url.match(/:([^\/]+?)(\.git)?$/);
        if (match && match[1]) {
          return match[1].replace(/\.git$/, "");
        }
      }
    } catch {
      // Ignore error
    }

    return null;
  }

  /**
   * Get all git status info in a SINGLE git call
   * Uses git status --porcelain=v2 --branch for combined output
   */
  static getGitStatus(dir: string): GitStatusResult {
    const gitDir = this.findGitDir(dir);

    if (!gitDir) {
      return {
        branch: null,
        isClean: true,
        hasStaged: false,
        repoName: null,
        gitDir: null,
      };
    }

    // Get repo name from config (no git command needed)
    const repoName = this.getRepoNameFromConfig(gitDir);

    try {
      // Single git call: --porcelain=v2 --branch gives us branch + status
      const result = spawnSync(
        ["git", "-C", dir, "status", "--porcelain=v2", "--branch"],
        { timeout: 5000 }
      );

      if (result.exitCode !== 0) {
        return {
          branch: null,
          isClean: true,
          hasStaged: false,
          repoName,
          gitDir,
        };
      }

      const output = result.stdout.toString();
      const lines = output.split("\n");

      let branch: string | null = null;
      let isClean = true;
      let hasStaged = false;

      for (const line of lines) {
        // Branch line: # branch.head <name>
        if (line.startsWith("# branch.head ")) {
          branch = line.slice(14).trim();
          // Handle detached HEAD
          if (branch === "(detached)") {
            branch = "HEAD";
          }
          continue;
        }

        // Skip other header lines
        if (line.startsWith("#")) {
          continue;
        }

        // Status lines start with 1, 2, u, or ?
        // Format: <XY> <sub> <mH> <mI> <mW> <hH> <hI> <path>
        // Or for untracked: ? <path>
        if (!line.trim()) continue;

        const firstChar = line[0];
        if (firstChar === "?") {
          // Untracked file - working tree is dirty
          isClean = false;
        } else if (
          firstChar === "1" ||
          firstChar === "2" ||
          firstChar === "u"
        ) {
          // Changed entry
          // Format: 1 <XY> ... or 2 <XY> ...
          const xy = line.slice(2, 4);
          const staged = xy[0]; // Index status
          const unstaged = xy[1]; // Worktree status

          if (staged !== ".") {
            hasStaged = true;
          }
          if (unstaged !== ".") {
            isClean = false;
          }
        }
      }

      return { branch, isClean, hasStaged, repoName, gitDir };
    } catch {
      return {
        branch: null,
        isClean: true,
        hasStaged: false,
        repoName,
        gitDir,
      };
    }
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
}
