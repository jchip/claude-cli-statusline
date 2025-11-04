/**
 * Business logic for git data resolution
 * Handles priority: input > cache > git command > transcript
 */

import { GitService } from "../services/GitService.ts";
import { basename } from "../utils.ts";

export class GitResolver {
  /**
   * Resolve git branch with priority order:
   * 1. Input JSON (gitBranch field)
   * 2. Cached value
   * 3. Git command
   * 4. Transcript file
   */
  static resolveGitBranch(
    inputGitBranch: string | undefined,
    cachedBranch: string | null | undefined,
    dir: string,
    transcriptPath?: string
  ): string | null {
    // Priority 1: Input JSON
    if (inputGitBranch) {
      return inputGitBranch;
    }

    // Priority 2: Cached value
    if (cachedBranch !== undefined) {
      return cachedBranch;
    }

    // Priority 3: Git command
    const branchFromCommand = GitService.getBranchFromCommand(dir);
    if (branchFromCommand) {
      return branchFromCommand;
    }

    // Priority 4: Transcript file
    if (transcriptPath) {
      return GitService.getBranchFromTranscript(transcriptPath);
    }

    return null;
  }

  /**
   * Resolve git repo name
   * Only runs if branch exists
   */
  static resolveRepoName(
    branch: string | null,
    cachedRepoName: string | null | undefined,
    dir: string
  ): string | null {
    if (!branch) {
      return null;
    }

    // Use cached if available
    if (cachedRepoName !== undefined) {
      return cachedRepoName;
    }

    // Otherwise get from git command
    return GitService.getRepoNameFromCommand(dir);
  }

  /**
   * Get project directory basename
   */
  static getProjectDirBasename(dir: string): string {
    return basename(dir);
  }

  /**
   * Check if working tree is clean
   * Only runs if branch exists
   */
  static resolveWorkingTreeStatus(
    branch: string | null,
    dir: string
  ): boolean | null {
    if (!branch) {
      return null;
    }

    return GitService.isWorkingTreeClean(dir);
  }

  /**
   * Check if there are staged changes
   * Only runs if branch exists
   */
  static resolveStagedStatus(
    branch: string | null,
    dir: string
  ): boolean | null {
    if (!branch) {
      return null;
    }

    return GitService.hasStagedChanges(dir);
  }
}
