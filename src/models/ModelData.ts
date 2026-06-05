/**
 * Pure data model for model information
 * No logic, just immutable data storage
 */

export const ModelMatchType = {
  ModelId: "model-id",
  DisplayName: "display-name",
  Default: "default",
} as const;

export type ModelMatchType = (typeof ModelMatchType)[keyof typeof ModelMatchType];

export class ModelData {
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
  }
}
