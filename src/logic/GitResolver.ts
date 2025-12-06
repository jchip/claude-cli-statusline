/**
 * Business logic for git data resolution
 * Handles priority: input > cache > single git call > transcript
 */

import { GitService, type GitStatusResult } from "../services/GitService.ts";
import { basename } from "../utils.ts";

export interface ResolvedGitInfo {
  branch: string | null;
  repoName: string | null;
  isClean: boolean | null;
  hasStaged: boolean | null;
  projectDirBasename: string;
}

export class GitResolver {
  /**
   * Resolve all git info at once with priority:
   * 1. Input JSON (gitBranch field)
   * 2. Cached values
   * 3. Single git call (branch, status, repo from config)
   * 4. Transcript file (fallback for branch only)
   */
  static resolve(
    dir: string,
    inputGitBranch?: string,
    cachedBranch?: string | null,
    cachedRepoName?: string | null,
    transcriptPath?: string
  ): ResolvedGitInfo {
    const projectDirBasename = basename(dir);

    // Priority 1: Use input branch if provided
    if (inputGitBranch) {
      // Still need status from git, but branch is from input
      const status = GitService.getGitStatus(dir);
      return {
        branch: inputGitBranch,
        repoName: cachedRepoName ?? status.repoName,
        isClean: status.gitDir ? status.isClean : null,
        hasStaged: status.gitDir ? status.hasStaged : null,
        projectDirBasename,
      };
    }

    // Priority 2: Use cached branch if available (null = cached as no branch, undefined = no cache)
    if (cachedBranch !== undefined) {
      if (cachedBranch === null) {
        // Cache says no branch - trust it, no git call needed
        return {
          branch: null,
          repoName: cachedRepoName ?? null,
          isClean: null,
          hasStaged: null,
          projectDirBasename,
        };
      }
      const status = GitService.getGitStatus(dir);
      return {
        branch: cachedBranch,
        repoName: cachedRepoName ?? status.repoName,
        isClean: status.gitDir ? status.isClean : null,
        hasStaged: status.gitDir ? status.hasStaged : null,
        projectDirBasename,
      };
    }

    // Priority 3: Single git call for everything
    const status = GitService.getGitStatus(dir);

    if (status.branch) {
      return {
        branch: status.branch,
        repoName: cachedRepoName ?? status.repoName,
        isClean: status.isClean,
        hasStaged: status.hasStaged,
        projectDirBasename,
      };
    }

    // Priority 4: Fallback to transcript for branch
    if (transcriptPath) {
      const transcriptBranch = GitService.getBranchFromTranscript(transcriptPath);
      if (transcriptBranch) {
        return {
          branch: transcriptBranch,
          repoName: cachedRepoName ?? status.repoName,
          isClean: status.gitDir ? status.isClean : null,
          hasStaged: status.gitDir ? status.hasStaged : null,
          projectDirBasename,
        };
      }
    }

    // No git info found
    return {
      branch: null,
      repoName: null,
      isClean: null,
      hasStaged: null,
      projectDirBasename,
    };
  }

  /**
   * Get project directory basename
   */
  static getProjectDirBasename(dir: string): string {
    return basename(dir);
  }
}
