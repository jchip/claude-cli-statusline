/**
 * Working Directory component (facade)
 * Wraps WorkDirData model and WorkDirRenderer
 */

import { WorkDirData } from "../models/WorkDirData.ts";
import { WorkDirRenderer } from "../renderers/WorkDirRenderer.ts";
import { formatProjectDir, computeRelativePath } from "../logic/PathFormatter.ts";

export class WorkDir {
  private data: WorkDirData;
  readonly projectDir: string;
  readonly currentDir: string;

  constructor(
    projectDir: string,
    currentDir: string,
    showFullDir: boolean = false
  ) {
    this.projectDir = projectDir;
    this.currentDir = currentDir;
    // Create data model with precomputed values
    this.data = new WorkDirData(
      projectDir,
      currentDir,
      formatProjectDir(projectDir, showFullDir),
      computeRelativePath(projectDir, currentDir)
    );
  }

  // Getters for backward compatibility
  get projectDirDisplay(): string {
    return this.data.projectDirDisplay;
  }

  get relativePath(): string {
    return this.data.relativePath;
  }

  render(): string {
    return WorkDirRenderer.render(this.data);
  }

  renderProject(): string {
    return WorkDirRenderer.renderProject(this.data);
  }

  renderCwd(): string {
    return WorkDirRenderer.renderCwd(this.data);
  }

  static fromInput(input: any, showFullDir: boolean = false): WorkDir {
    const projectDir =
      input?.workspace?.project_dir || input?.cwd || process.cwd();
    const currentDir = input?.workspace?.current_dir || projectDir;

    return new WorkDir(projectDir, currentDir, showFullDir);
  }
}
