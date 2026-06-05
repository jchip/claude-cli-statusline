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

  constructor(
    repoName: string | null,
    branch: string | null,
    projectDirBasename: string,
    showGitRepoNameConfig: boolean = false,
    isClean: boolean | null = null,
    hasStaged: boolean | null = null
  ) {
    this.repoName = repoName;
    this.branch = branch;
    this.projectDirBasename = projectDirBasename;
    this.showGitRepoNameConfig = showGitRepoNameConfig;
    this.isClean = isClean;
    this.hasStaged = hasStaged;
  }

  get hasGit(): boolean {
    return this.branch !== null;
  }

  get showRepoName(): boolean {
    if (!this.showGitRepoNameConfig) {
      return false;
    }
    return this.repoName !== null && this.repoName !== this.projectDirBasename;
  }

  get showPackageIcon(): boolean {
    if (!this.showGitRepoNameConfig) {
      return false;
    }
    return this.repoName !== null && this.repoName === this.projectDirBasename;
  }
}
