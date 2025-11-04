/**
 * Business logic for model matching and config lookup
 * Pure functions and static methods - no I/O, no state
 */

import type { Config } from "../types.ts";
import { ModelMatchType } from "../models/ModelData.ts";
import { Icons } from "../icons.ts";

export interface ModelMatchResult {
  maxTokens: number;
  matchType: ModelMatchType;
}

export class ModelMatcher {
  /**
   * Match model by ID in config
   */
  static matchByModelId(
    modelId: string,
    config: Config
  ): ModelMatchResult | null {
    const maxTokens = config["model-context-windows"][modelId];

    if (maxTokens !== undefined) {
      return {
        maxTokens,
        matchType: ModelMatchType.ModelId,
      };
    }

    return null;
  }

  /**
   * Match model by display name in config
   */
  static matchByDisplayName(
    displayName: string,
    config: Config
  ): ModelMatchResult | null {
    const maxTokens = config["display-name-model-context-windows"][displayName];

    if (maxTokens !== undefined) {
      return {
        maxTokens,
        matchType: ModelMatchType.DisplayName,
      };
    }

    return null;
  }

  /**
   * Get default context window
   */
  static getDefault(config: Config): ModelMatchResult {
    return {
      maxTokens: config["default-context-window"],
      matchType: ModelMatchType.Default,
    };
  }

  /**
   * Map display name for rendering (if mapping exists)
   */
  static mapDisplayName(displayName: string, config: Config): string {
    return config["model-display-name-map"][displayName] || displayName;
  }

  /**
   * Get match indicator icon based on match type
   */
  static getMatchIndicator(matchType: ModelMatchType): string {
    switch (matchType) {
      case ModelMatchType.DisplayName:
        return Icons.DISPLAY_NAME_MATCH;
      case ModelMatchType.Default:
        return Icons.DEFAULT_WINDOW;
      case ModelMatchType.ModelId:
      default:
        return "";
    }
  }

  /**
   * Complete matching flow: try ID, then display name, then mapped, then default
   */
  static match(
    modelId: string,
    displayName: string,
    config: Config
  ): ModelMatchResult {
    // Try model ID first
    const idMatch = this.matchByModelId(modelId, config);
    if (idMatch) {
      return idMatch;
    }

    // Try original display name
    const displayMatch = this.matchByDisplayName(displayName, config);
    if (displayMatch) {
      return displayMatch;
    }

    // Try mapped display name
    const mappedDisplayName = this.mapDisplayName(displayName, config);
    if (mappedDisplayName !== displayName) {
      const mappedMatch = this.matchByDisplayName(mappedDisplayName, config);
      if (mappedMatch) {
        return mappedMatch;
      }
    }

    // Fall back to default
    return this.getDefault(config);
  }
}
