/**
 * Utility functions
 */

/**
 * Replace home directory with ~
 */
export function shortenHome(path: string): string {
  const home = process.env.HOME || "";
  if (home && path.startsWith(home)) {
    return path.replace(home, "~");
  }
  return path;
}

/**
 * Clamp a number to a range
 */
export function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Format token count as K or M with cyan suffix
 */
export function formatTokenCount(tokens: number): string {
  const cyan = "\x1b[36m"; // Darker cyan color
  const reset = "\x1b[0m";

  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    const num = m % 1 === 0 ? `${m}` : `${m.toFixed(1)}`;
    return `${num}${cyan}M${reset}🚀`;
  }
  if (tokens >= 1000) {
    const k = tokens / 1000;
    const num = k % 1 === 0 ? `${k}` : `${k.toFixed(1)}`;
    return `${num}${cyan}K${reset}`;
  }
  return `${tokens}`;
}

/**
 * Get relative path from current dir to project root
 */
export function getRelativePath(cwd: string, root: string): string {
  if (!cwd || !root) return ".";

  // Normalize paths
  const normCwd = cwd.replace(/\/$/, "");
  const normRoot = root.replace(/\/$/, "");

  if (normCwd === normRoot) {
    return ".";
  }

  // Check if cwd starts with root
  if (normCwd.startsWith(normRoot + "/")) {
    return normCwd.slice(normRoot.length + 1);
  }

  // Fallback to basename
  const parts = normCwd.split("/");
  return parts[parts.length - 1] || ".";
}

/**
 * Get basename of a path
 */
export function basename(path: string): string {
  const parts = path.replace(/\/$/, "").split("/");
  return parts[parts.length - 1] || "";
}

/**
 * Recursively search object for percentage field
 */
export function findPercentInObject(obj: any, key = "percent"): number | null {
  if (obj == null || typeof obj !== "object") {
    return null;
  }

  if (typeof obj[key] === "number") {
    return obj[key];
  }

  for (const k of Object.keys(obj)) {
    const result = findPercentInObject(obj[k], key);
    if (result !== null) {
      return result;
    }
  }

  return null;
}
