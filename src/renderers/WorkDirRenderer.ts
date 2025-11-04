/**
 * Renderer for working directory information
 * Pure presentation logic - takes data and produces formatted string
 */

import { WorkDirData } from "../models/WorkDirData.ts";
import { Icons } from "../icons.ts";

export class WorkDirRenderer {
  /**
   * Render working directory info as formatted string
   */
  static render(data: WorkDirData): string {
    const parts: string[] = [];

    parts.push(Icons.WORKDIR);
    parts.push(data.projectDirDisplay);
    parts.push(Icons.CURRENT_DIR);
    parts.push(data.relativePath);

    return parts.join(" ");
  }
}
