/**
 * Session analyzer - analyzes transcript files for token usage
 */

import { existsSync, readFileSync, statSync } from "fs";
import type {
  SessionAnalysisCache,
  TranscriptEntry,
  TokenUsage,
  StatusLineInput,
} from "../types.ts";
import { CacheManager } from "./CacheManager.ts";
import { findPercentInObject } from "../utils.ts";

export interface SessionAnalysisResult {
  usedTokens: number;
  compactOccurred: boolean;
  cache: SessionAnalysisCache;
}

export class SessionAnalyzer {
  /**
   * Analyze session from transcript or input object
   */
  static analyze(
    input: StatusLineInput,
    transcriptPath?: string
  ): SessionAnalysisResult | null {
    // Try to get from input object first
    const percent = this.findPercentInInput(input);
    if (percent !== null) {
      // We have percent but no token counts, return minimal result
      return null; // Let it fall through to transcript parsing
    }

    // Parse transcript if available
    if (transcriptPath && existsSync(transcriptPath)) {
      return this.analyzeTranscript(transcriptPath);
    }

    return null;
  }

  /**
   * Analyze transcript file with caching
   */
  static analyzeTranscript(transcriptPath: string): SessionAnalysisResult {
    // Load or create cache
    let cache = CacheManager.read(transcriptPath);

    if (!cache) {
      cache = CacheManager.createEmpty(transcriptPath);
    }

    // Read transcript
    const content = readFileSync(transcriptPath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());

    // Get current modified time
    const stat = statSync(transcriptPath);
    const currentModified = stat.mtimeMs;

    // Process new lines only
    const startLine = cache.lastLine;
    let currentTokens = cache.lastTokenCount;
    let compactOccurred = cache.entries.some((e) => e.isCompact) || false;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      let entry: TranscriptEntry;

      try {
        entry = JSON.parse(line);
      } catch {
        continue; // Skip invalid JSON
      }

      // Check for compact boundary
      if (entry.type === "system" && entry.subtype === "compact_boundary") {
        const trigger = entry.compactMetadata?.trigger || "manual";
        const preTokens = currentTokens;
        const postTokens = entry.compactMetadata?.postTokens || 0;

        cache.entries.push({
          line: i + 1,
          tokens: postTokens,
          isCompact: true,
          compactTrigger: trigger,
          preCompactTokens: preTokens,
        });

        currentTokens = postTokens;
        compactOccurred = true;
        continue;
      }

      // Extract token usage
      const usage = entry.message?.usage || entry.usage;
      if (!usage) {
        continue;
      }

      const tokens = this.calculateTokens(usage);

      // Check for >30% drop (compact without boundary)
      if (currentTokens > 0 && tokens < currentTokens * 0.7) {
        cache.entries.push({
          line: i + 1,
          tokens: tokens,
          isCompact: true,
          compactTrigger: "auto",
          preCompactTokens: currentTokens,
        });

        compactOccurred = true;
      } else {
        cache.entries.push({
          line: i + 1,
          tokens: tokens,
        });
      }

      currentTokens = tokens;
    }

    // Update cache metadata
    cache.lastLine = lines.length;
    cache.lastTokenCount = currentTokens;
    cache.lastModified = currentModified;

    return {
      usedTokens: currentTokens,
      compactOccurred,
      cache,
    };
  }

  /**
   * Calculate total context tokens from usage
   */
  private static calculateTokens(usage: TokenUsage): number {
    return (
      (usage.input_tokens || 0) +
      (usage.cache_creation_input_tokens || 0) +
      (usage.cache_read_input_tokens || 0)
    );
  }

  /**
   * Try to find percentage in input object
   */
  private static findPercentInInput(input: StatusLineInput): number | null {
    // Check budget
    if (input.budget) {
      const pct = findPercentInObject(input.budget, "percent");
      if (pct !== null) return pct;
    }

    // Check cost
    if (input.cost) {
      const pct = findPercentInObject(input.cost, "percent");
      if (pct !== null) return pct;
    }

    // Search entire input
    return findPercentInObject(input, "percent");
  }
}
