/**
 * Git information component (facade)
 * Wraps GitData model and GitRenderer
 */

import { GitData } from "../models/GitData.ts";
import { GitRenderer } from "../renderers/GitRenderer.ts";
import { GitResolver } from "../logic/GitResolver.ts";

export class GitInfo {
  private data: GitData;
  private statusIcons?: { clean: string; dirty: string; staged: string };

  constructor(
    public readonly repoName: string | null,
    public readonly branch: string | null,
    public readonly projectDirBasename: string,
    showGitRepoNameConfig: boolean = false,
    public readonly isClean: boolean | null = null,
    public readonly hasStaged: boolean | null = null,
    statusIcons?: { clean: string; dirty: string; staged: string }
  ) {
    // Create data model
    this.data = new GitData(repoName, branch, projectDirBasename, showGitRepoNameConfig, isClean, hasStaged);
    this.statusIcons = statusIcons;
  }

  // Getters for backward compatibility
  get hasGit(): boolean {
    return this.data.hasGit;
  }

  get showRepoName(): boolean {
    return this.data.showRepoName;
  }

  render(): string {
    return GitRenderer.render(this.data, this.statusIcons);
  }

  static fromDirectory(
    dir: string,
    transcriptPath?: string,
    cachedRepoName?: string | null,
    cachedBranch?: string | null,
    inputGitBranch?: string,
    showGitRepoNameConfig: boolean = false,
    statusIcons?: { clean: string; dirty: string; staged: string }
  ): GitInfo {
    const projectDirBasename = GitResolver.getProjectDirBasename(dir);

    // Resolve branch using priority logic
    const branch = GitResolver.resolveGitBranch(
      inputGitBranch,
      cachedBranch,
      dir,
      transcriptPath
    );

    // Resolve repo name
    const repoName = GitResolver.resolveRepoName(
      branch,
      cachedRepoName,
      dir
    );

    // Check working tree status
    const isClean = GitResolver.resolveWorkingTreeStatus(branch, dir);

    // Check staged status
    const hasStaged = GitResolver.resolveStagedStatus(branch, dir);

    return new GitInfo(repoName, branch, projectDirBasename, showGitRepoNameConfig, isClean, hasStaged, statusIcons);
  }
}
