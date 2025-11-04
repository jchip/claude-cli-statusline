/**
 * Renderer for model information
 * Pure presentation logic - takes data and produces formatted string
 */

import { ModelData } from "../models/ModelData.ts";
import { Icons } from "../icons.ts";

export class ModelRenderer {
  /**
   * Render model info as formatted string
   */
  static render(data: ModelData): string {
    return `${Icons.MODEL} ${data.mappedDisplayName}`;
  }
}
