/**
 * Pure data model for model information
 * No logic, just immutable data storage
 */

export enum ModelMatchType {
  ModelId = "model-id",
  DisplayName = "display-name",
  Default = "default",
}

export class ModelData {
  constructor(
    public readonly id: string,
    public readonly displayName: string,
    public readonly mappedDisplayName: string,
    public readonly maxTokens: number,
    public readonly matchType: ModelMatchType
  ) {}
}
