/**
 * Pure data model for context information
 * No logic, just immutable data storage
 */

export class ContextData {
  constructor(
    public readonly usedTokens: number,
    public readonly maxTokens: number,
    public readonly compactBuffer: number,
    public readonly compactOccurred: boolean,
    public readonly matchIndicator: string = "",
    public readonly autoCompactEnabled: boolean | null = null
  ) {}
}
