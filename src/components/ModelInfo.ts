/**
 * Model information component (facade)
 * Wraps ModelData and ModelRenderer
 */

import type { Config } from "../types.ts";
import { ModelData, ModelMatchType } from "../models/ModelData.ts";
import { ModelRenderer } from "../renderers/ModelRenderer.ts";
import { ModelMatcher } from "../logic/ModelMatcher.ts";

// Re-export for backward compatibility
export type { ModelMatchType };

export class ModelInfo {
  private data: ModelData;
  readonly id: string;
  readonly displayName: string;
  readonly mappedDisplayName: string;
  readonly maxTokens: number;
  readonly matchType: ModelMatchType;

  constructor(
    id: string,
    displayName: string,
    mappedDisplayName: string,
    maxTokens: number,
    matchType: ModelMatchType
  ) {
    this.id = id;
    this.displayName = displayName;
    this.mappedDisplayName = mappedDisplayName;
    this.maxTokens = maxTokens;
    this.matchType = matchType;
    // Create data model
    this.data = new ModelData(
      id,
      displayName,
      mappedDisplayName,
      maxTokens,
      matchType
    );
  }

  // Getter for backward compatibility
  get matchIndicator(): string {
    return ModelMatcher.getMatchIndicator(this.data.matchType);
  }

  render(): string {
    return ModelRenderer.render(this.data);
  }

  static fromInput(input: any, config: Config): ModelInfo {
    const id = input?.model?.id || "unknown";
    const displayName = input?.model?.display_name || "model";

    // Use ModelMatcher for complete matching logic
    const matchResult = ModelMatcher.match(id, displayName, config);

    // Get mapped display name
    const mappedDisplayName = ModelMatcher.mapDisplayName(displayName, config);

    return new ModelInfo(
      id,
      displayName,
      mappedDisplayName,
      matchResult.maxTokens,
      matchResult.matchType
    );
  }
}
