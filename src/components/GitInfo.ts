/**
 * Git information component (facade)
 * Wraps GitData model and GitRenderer
 */

import { GitData } from "../models/GitData.ts";
import { GitRenderer } from "../renderers/GitRenderer.ts";
import { GitResolver } from "../logic/GitResolver.ts";

export class GitInfo {
  private data: GitData;

  constructor(
    public readonly repoName: string | null,
    public readonly branch: string | null,
    public readonly projectDirBasename: string,
    showGitRepoNameConfig: boolean = false,
    public readonly isClean: boolean | null = null
  ) {
    // Create data model
    this.data = new GitData(repoName, branch, projectDirBasename, showGitRepoNameConfig, isClean);
  }

  // Getters for backward compatibility
  get hasGit(): boolean {
    return this.data.hasGit;
  }

  get showRepoName(): boolean {
    return this.data.showRepoName;
  }

  render(): string {
    return GitRenderer.render(this.data);
  }

  static fromDirectory(
    dir: string,
    transcriptPath?: string,
    cachedRepoName?: string | null,
    cachedBranch?: string | null,
    inputGitBranch?: string,
    showGitRepoNameConfig: boolean = false
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

    return new GitInfo(repoName, branch, projectDirBasename, showGitRepoNameConfig, isClean);
  }
}
