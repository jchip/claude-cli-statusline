/**
 * Git-related operations
 */

import { spawnSync } from "bun";
import { readFileSync } from "fs";

export function gitBranch(dir: string, transcriptPath?: string): string {
  const r = spawnSync(["git", "-C", dir, "rev-parse", "--abbrev-ref", "HEAD"], {
    stdout: "pipe",
    stderr: "ignore",
  });

  if (r.success) {
    return r.stdout.toString().trim();
  }

  // Fallback: try to get branch from transcript
  if (transcriptPath) {
    const branch = gitBranchFromTranscript(transcriptPath);
    if (branch) return branch;
  }

  return "∅";
}

export function gitRepoName(dir: string): string {
  const r = spawnSync(["git", "-C", dir, "rev-parse", "--show-toplevel"], {
    stdout: "pipe",
    stderr: "ignore",
  });
  if (r.success) {
    const repoPath = r.stdout.toString().trim();
    return repoPath.split("/").pop() || "";
  }
  return "";
}

/**
 * Extract git branch from transcript file
 */
function gitBranchFromTranscript(transcriptPath: string): string | null {
  try {
    const raw = readFileSync(transcriptPath, "utf8");
    const lines = raw.trim().split("\n");

    // Look for gitBranch in any entry (usually in user messages)
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.gitBranch) {
          return entry.gitBranch;
        }
      } catch {
        // Skip malformed lines
      }
    }
  } catch {
    // Ignore read errors
  }
  return null;
}
