/**
 * Caching system for transcript analysis
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  statSync,
} from "fs";
import { dirname, join } from "path";

interface LineEntry {
  line: number;
  tokens: number;
  timestamp?: number;
  isCompact?: boolean;
  compactTrigger?: "manual" | "auto";
  preCompactTokens?: number;
}

interface CacheData {
  lastLine: number;
  lastTokenCount: number;
  lastModified: number;
  entries: LineEntry[];
  "statusline-input"?: any;
  "statusline-output"?: string;
}

/**
 * Get cache directory for a transcript file
 */
function getCacheDir(transcriptPath: string): string {
  const dir = dirname(transcriptPath);
  return join(dir, ".statusline");
}

/**
 * Get cache file path for a transcript
 */
function getCachePath(transcriptPath: string): string {
  const cacheDir = getCacheDir(transcriptPath);
  const transcriptName = transcriptPath.split("/").pop() || "transcript";
  return join(cacheDir, `${transcriptName}.cache.json`);
}

/**
 * Read cache for a transcript file
 */
export function readCache(transcriptPath: string): CacheData | null {
  try {
    const cachePath = getCachePath(transcriptPath);
    if (!existsSync(cachePath)) return null;

    const cacheContent = readFileSync(cachePath, "utf8");
    const cache: CacheData = JSON.parse(cacheContent);

    // Verify transcript hasn't been modified since cache was created
    const transcriptStat = statSync(transcriptPath);
    if (transcriptStat.mtimeMs > cache.lastModified) {
      // Transcript was modified, cache is stale
      return null;
    }

    return cache;
  } catch {
    return null;
  }
}

/**
 * Write cache for a transcript file
 */
export function writeCache(
  transcriptPath: string,
  lastLine: number,
  lastTokenCount: number,
  entries: LineEntry[],
  statuslineInput?: any,
  statuslineOutput?: string
): void {
  try {
    const cacheDir = getCacheDir(transcriptPath);

    // Create cache directory if it doesn't exist
    if (!existsSync(cacheDir)) {
      mkdirSync(cacheDir, { recursive: true });
    }

    const cachePath = getCachePath(transcriptPath);
    const transcriptStat = statSync(transcriptPath);

    const cache: CacheData = {
      lastLine,
      lastTokenCount,
      lastModified: transcriptStat.mtimeMs,
      entries,
      "statusline-input": statuslineInput,
      "statusline-output": statuslineOutput,
    };

    writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch {
    // Ignore cache write errors
  }
}
