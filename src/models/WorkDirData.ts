/**
 * Pure data model for working directory information
 * No logic, just immutable data storage with precomputed values
 */

export class WorkDirData {
  constructor(
    public readonly projectDir: string,
    public readonly currentDir: string,
    public readonly projectDirDisplay: string,
    public readonly relativePath: string
  ) {}
}
