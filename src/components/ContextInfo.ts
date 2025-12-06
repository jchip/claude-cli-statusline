/**
 * Context information component (facade)
 * Wraps ContextData and ContextRenderer
 */

import type { ColorThresholds } from "../types.ts";
import { ContextData } from "../models/ContextData.ts";
import { ContextRenderer } from "../renderers/ContextRenderer.ts";
import { ContextCalculator } from "../logic/ContextCalculator.ts";

export class ContextInfo {
  private data: ContextData;

  constructor(
    public readonly usedTokens: number,
    public readonly maxTokens: number,
    public readonly compactBuffer: number,
    public readonly compactOccurred: boolean,
    public readonly thresholds: ColorThresholds,
    public readonly matchIndicator: string = "",
    public readonly autoCompactEnabled: boolean | null = null
  ) {
    // Create data model
    this.data = new ContextData(
      usedTokens,
      maxTokens,
      compactBuffer,
      compactOccurred,
      matchIndicator,
      autoCompactEnabled
    );
  }

  // Getters for backward compatibility
  get remainingTokens(): number {
    return ContextCalculator.calculateRemainingTokens(
      this.data.usedTokens,
      this.data.maxTokens
    );
  }

  get remainingPercent(): number {
    return ContextCalculator.calculateRemainingPercent(
      this.data.usedTokens,
      this.data.maxTokens
    );
  }

  get remainingAfterBuffer(): number {
    return ContextCalculator.calculateRemainingAfterBuffer(
      this.data.usedTokens,
      this.data.maxTokens,
      this.data.compactBuffer
    );
  }

  get color(): string {
    return ContextCalculator.selectColor(this.remainingPercent, this.thresholds);
  }

  get bufferColor(): string {
    return ContextCalculator.selectColor(this.remainingAfterBuffer, this.thresholds);
  }

  get compactIcon(): string {
    return ContextCalculator.selectCompactIcon(this.data.compactOccurred);
  }

  get maxTokensDisplay(): string {
    return ContextCalculator.formatMaxTokens(this.data.maxTokens);
  }

  render(options?: { animated?: boolean; showTrend?: boolean; showSparkline?: boolean }): string {
    return ContextRenderer.render(this.data, this.thresholds, options);
  }

  static createEmpty(
    maxTokens = 200000,
    compactBuffer = 45000,
    colorLevels: [number, number, number] = [65, 45, 20],
    matchIndicator = ""
  ): ContextInfo {
    const thresholds: ColorThresholds = {
      green: colorLevels[0],
      yellow: colorLevels[1],
      orange: colorLevels[2],
    };

    return new ContextInfo(0, maxTokens, compactBuffer, false, thresholds, matchIndicator);
  }

  static fromData(
    usedTokens: number,
    maxTokens: number,
    compactBuffer: number,
    compactOccurred: boolean,
    colorLevels: [number, number, number],
    matchIndicator = "",
    autoCompactEnabled: boolean | null = null
  ): ContextInfo {
    const thresholds: ColorThresholds = {
      green: colorLevels[0],
      yellow: colorLevels[1],
      orange: colorLevels[2],
    };

    return new ContextInfo(
      usedTokens,
      maxTokens,
      compactBuffer,
      compactOccurred,
      thresholds,
      matchIndicator,
      autoCompactEnabled
    );
  }
}
