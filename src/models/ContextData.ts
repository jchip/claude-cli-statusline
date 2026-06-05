/**
 * Pure data model for context information
 * No logic, just immutable data storage
 */

export class ContextData {
  readonly usedTokens: number;
  readonly maxTokens: number;
  readonly compactBuffer: number;
  readonly compactOccurred: boolean;
  readonly matchIndicator: string;
  readonly autoCompactEnabled: boolean | null;
  readonly exceeds200k: boolean;

  constructor(
    usedTokens: number,
    maxTokens: number,
    compactBuffer: number,
    compactOccurred: boolean,
    matchIndicator: string = "",
    autoCompactEnabled: boolean | null = null,
    exceeds200k: boolean = false
  ) {
    this.usedTokens = usedTokens;
    this.maxTokens = maxTokens;
    this.compactBuffer = compactBuffer;
    this.compactOccurred = compactOccurred;
    this.matchIndicator = matchIndicator;
    this.autoCompactEnabled = autoCompactEnabled;
    this.exceeds200k = exceeds200k;
  }
}
