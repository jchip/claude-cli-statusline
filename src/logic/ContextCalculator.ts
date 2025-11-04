/**
 * Business logic for context calculations
 * Pure functions and static methods - no I/O, no state
 */

import { ANSI_COLORS, type ColorThresholds } from "../types.ts";
import { clamp, formatTokenCount } from "../utils.ts";
import { Icons } from "../icons.ts";

export class ContextCalculator {
  /**
   * Calculate remaining tokens
   */
  static calculateRemainingTokens(usedTokens: number, maxTokens: number): number {
    return maxTokens - usedTokens;
  }

  /**
   * Calculate remaining percentage
   */
  static calculateRemainingPercent(usedTokens: number, maxTokens: number): number {
    const remaining = this.calculateRemainingTokens(usedTokens, maxTokens);
    return clamp((remaining / maxTokens) * 100);
  }

  /**
   * Calculate remaining percentage after buffer
   * Shows percentage of usable space before hitting compact threshold
   */
  static calculateRemainingAfterBuffer(
    usedTokens: number,
    maxTokens: number,
    compactBuffer: number
  ): number {
    const usableSpace = maxTokens - compactBuffer;
    const remaining = usableSpace - usedTokens;
    return clamp((remaining / usableSpace) * 100);
  }

  /**
   * Select color based on percentage and thresholds
   */
  static selectColor(percent: number, thresholds: ColorThresholds): string {
    if (percent > thresholds.green) {
      return ANSI_COLORS.green;
    }
    if (percent > thresholds.yellow) {
      return ANSI_COLORS.yellow;
    }
    if (percent > thresholds.orange) {
      return ANSI_COLORS.orange;
    }
    return ANSI_COLORS.red;
  }

  /**
   * Select compact icon
   */
  static selectCompactIcon(compactOccurred: boolean): string {
    return compactOccurred ? Icons.COMPACTED : Icons.NOT_COMPACTED;
  }

  /**
   * Format max tokens for display
   */
  static formatMaxTokens(maxTokens: number): string {
    return formatTokenCount(maxTokens);
  }
}
