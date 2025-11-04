/**
 * Cache manager for session analysis
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from "fs";
import { dirname } from "path";
import type { SessionAnalysisCache, StatusLineInput } from "../types.ts";

export class CacheManager {
  /**
   * Read cache from transcript path
   */
  static read(transcriptPath: string): SessionAnalysisCache | null {
    const cachePath = this.getCachePath(transcriptPath);

    if (!existsSync(cachePath)) {
      return null;
    }

    try {
      const cacheContent = readFileSync(cachePath, "utf-8");
      const cache: SessionAnalysisCache = JSON.parse(cacheContent);

      // Check if cache is stale
      if (!existsSync(transcriptPath)) {
        return null;
      }

      const transcriptStat = statSync(transcriptPath);
      if (transcriptStat.mtimeMs > cache.lastModified) {
        return null; // Stale cache
      }

      return cache;
    } catch {
      return null;
    }
  }

  /**
   * Write cache for transcript path
   */
  static write(
    transcriptPath: string,
    cache: SessionAnalysisCache,
    input?: StatusLineInput,
    output?: string,
    gitRepoName?: string | null,
    gitBranch?: string | null
  ): void {
    const cachePath = this.getCachePath(transcriptPath);

    try {
      // Ensure cache directory exists
      const cacheDir = dirname(cachePath);
      if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true });
      }

      // Add optional fields
      const cacheWithMeta = {
        ...cache,
        ...(gitRepoName !== undefined && { gitRepoName }),
        ...(gitBranch !== undefined && { gitBranch }),
        ...(input && { "statusline-input": input }),
        ...(output && { "statusline-output": output }),
      };

      writeFileSync(cachePath, JSON.stringify(cacheWithMeta, null, 2), "utf-8");
    } catch (error) {
      // Silent fail - cache is non-critical
      console.error(`Failed to write cache to ${cachePath}:`, error);
    }
  }

  /**
   * Get cache file path for transcript
   */
  private static getCachePath(transcriptPath: string): string {
    return `${transcriptPath}.cache.json`;
  }

  /**
   * Create empty cache
   */
  static createEmpty(transcriptPath: string): SessionAnalysisCache {
    const stat = existsSync(transcriptPath) ? statSync(transcriptPath) : null;

    return {
      lastLine: 0,
      lastTokenCount: 0,
      lastModified: stat?.mtimeMs || Date.now(),
      entries: [],
    };
  }
}
