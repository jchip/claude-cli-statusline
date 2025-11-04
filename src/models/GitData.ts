/**
 * Pure data model for git information
 * No logic, just immutable data storage
 */

export class GitData {
  constructor(
    public readonly repoName: string | null,
    public readonly branch: string | null,
    public readonly projectDirBasename: string,
    public readonly showGitRepoNameConfig: boolean = false,
    public readonly isClean: boolean | null = null
  ) {}

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
