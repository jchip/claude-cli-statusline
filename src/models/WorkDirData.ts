/**
 * Pure data model for working directory information
 * No logic, just immutable data storage with precomputed values
 */

export class WorkDirData {
  readonly projectDir: string;
  readonly currentDir: string;
  readonly projectDirDisplay: string;
  readonly relativePath: string;

  constructor(
    projectDir: string,
    currentDir: string,
    projectDirDisplay: string,
    relativePath: string
  ) {
    this.projectDir = projectDir;
    this.currentDir = currentDir;
    this.projectDirDisplay = projectDirDisplay;
    this.relativePath = relativePath;
  }
}
