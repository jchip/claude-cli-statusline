/**
 * Pure data model for git information
 * No logic, just immutable data storage
 */

export class GitData {
  readonly repoName: string | null;
  readonly branch: string | null;
  readonly projectDirBasename: string;
  readonly showGitRepoNameConfig: boolean;
  readonly isClean: boolean | null;
  readonly hasStaged: boolean | null;
  /**
   * Name to render, when it differs from the resolved repo name (e.g. the
   * "owner/name" form the CLI reports in `workspace.repo`). Kept separate from
   * `repoName` so the persisted cache keeps storing the plain git repo name.
   */
  readonly repoDisplayName: string | null;

  constructor(
    repoName: string | null,
    branch: string | null,
    projectDirBasename: string,
    showGitRepoNameConfig: boolean = false,
    isClean: boolean | null = null,
    hasStaged: boolean | null = null,
    repoDisplayName: string | null = null
  ) {
    this.repoName = repoName;
    this.branch = branch;
    this.projectDirBasename = projectDirBasename;
    this.showGitRepoNameConfig = showGitRepoNameConfig;
    this.isClean = isClean;
    this.hasStaged = hasStaged;
    this.repoDisplayName = repoDisplayName;
  }

  /** The repo name as it should be rendered */
  get displayName(): string | null {
    return this.repoDisplayName ?? this.repoName;
  }

  get hasGit(): boolean {
    return this.branch !== null;
  }

  get showRepoName(): boolean {
    if (!this.showGitRepoNameConfig) {
      return false;
    }
    return this.displayName !== null && this.displayName !== this.projectDirBasename;
  }

  get showPackageIcon(): boolean {
    if (!this.showGitRepoNameConfig) {
      return false;
    }
    return this.displayName !== null && this.displayName === this.projectDirBasename;
  }
}
