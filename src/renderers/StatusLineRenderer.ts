/**
 * Main status line renderer
 * Orchestrates all component renderers
 */

import { WorkDirData } from "../models/WorkDirData.ts";
import { GitData } from "../models/GitData.ts";
import { ModelData } from "../models/ModelData.ts";
import { ContextData } from "../models/ContextData.ts";
import type { ColorThresholds } from "../types.ts";
import { WorkDirRenderer } from "./WorkDirRenderer.ts";
import { GitRenderer } from "./GitRenderer.ts";
import { ModelRenderer } from "./ModelRenderer.ts";
import { ContextRenderer } from "./ContextRenderer.ts";

export class StatusLineRenderer {
  /**
   * Render complete status line
   */
  static render(
    workDir: WorkDirData,
    git: GitData,
    model: ModelData,
    context: ContextData,
    thresholds: ColorThresholds
  ): string {
    const parts: string[] = [];

    parts.push(WorkDirRenderer.render(workDir));
    parts.push(GitRenderer.render(git));
    parts.push(ModelRenderer.render(model));
    parts.push(ContextRenderer.render(context, thresholds));

    return parts.join(" ");
  }
}
