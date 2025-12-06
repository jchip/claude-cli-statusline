/**
 * Renderer for context information
 * Pure presentation logic - takes data and produces formatted string
 */

import { ContextData } from "../models/ContextData.ts";
import { ContextCalculator } from "../logic/ContextCalculator.ts";
import { ANSI_COLORS, type ColorThresholds } from "../types.ts";
import { Icons } from "../icons.ts";
import { spinner } from "../logic/AnimationUtils.ts";

export interface ContextRenderOptions {
  animated?: boolean;
  spinnerStyle?: "transportation" | "weather" | "hearts" | "fruit" | "planets" | "circles" | "sports" | "flowers" | "hands" | "arrows" | "moon" | "clock" | "circular" | "braille" | "dots" | "blocks";
}

export class ContextRenderer {
  /**
   * Render context info as formatted string
   */
  static render(
    data: ContextData,
    thresholds: ColorThresholds,
    options: ContextRenderOptions = {}
  ): string {
    const parts: string[] = [];

    // Calculate values
    const remainingPercent = ContextCalculator.calculateRemainingPercent(
      data.usedTokens,
      data.maxTokens
    );
    const remainingAfterBuffer = ContextCalculator.calculateRemainingAfterBuffer(
      data.usedTokens,
      data.maxTokens,
      data.compactBuffer
    );
    const color = ContextCalculator.selectColor(remainingPercent, thresholds);
    const bufferColor = ContextCalculator.selectColor(remainingAfterBuffer, thresholds);
    // Check exceeds_200k_tokens first, then use normal compact icon logic
    const compactIcon = data.exceeds200k
      ? "⚠️"
      : ContextCalculator.selectCompactIcon(data.compactOccurred);
    const maxTokensDisplay = ContextCalculator.formatMaxTokens(data.maxTokens);

    // Build output
    parts.push(Icons.CONTEXT);
    parts.push("\u00A0");
    parts.push(color);
    parts.push(`${Math.round(remainingPercent)}%`);
    parts.push(ANSI_COLORS.reset);

    // Only show "remaining before auto-compact" percentage if auto-compact is enabled
    // If autoCompactEnabled is null (unknown), show it to be safe
    if (data.autoCompactEnabled !== false) {
      parts.push(Icons.SEPARATOR);
      parts.push(bufferColor);
      parts.push(`${Math.round(remainingAfterBuffer)}%`);
      parts.push(ANSI_COLORS.reset);
    }

    parts.push(compactIcon);
    parts.push(maxTokensDisplay);

    if (data.matchIndicator) {
      parts.push(data.matchIndicator);
    }

    // Add spinner after max context window if animated
    if (options.animated) {
      parts.push(spinner(options.spinnerStyle || "transportation"));
    }

    return parts.join("");
  }
}
