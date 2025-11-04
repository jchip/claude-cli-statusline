/**
 * Business logic for path formatting
 * Pure functions - no I/O, no state
 */

import { shortenHome, getRelativePath, basename } from "../utils.ts";

/**
 * Format project directory for display
 */
export function formatProjectDir(dir: string, showFullDir: boolean = false): string {
  if (showFullDir) {
    return shortenHome(dir);
  }
  return basename(dir);
}

/**
 * Compute relative path from current directory to project directory
 */
export function computeRelativePath(projectDir: string, currentDir: string): string {
  return getRelativePath(currentDir, projectDir);
}
