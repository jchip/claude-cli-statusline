/**
 * Utility functions
 */

export function shortenHome(path: string): string {
  const home = process.env.HOME || "";
  return path.replace(home, "~");
}

export function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    const m = tokens / 1000000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(2)}M`;
  } else if (tokens >= 1000) {
    const k = tokens / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(2)}K`;
  }
  return `${tokens}`;
}

export function getRelativePath(cwd: string, root: string): string {
  if (cwd === root) return ".";
  if (cwd.startsWith(root + "/")) return cwd.slice(root.length + 1);
  return cwd.split("/").pop() || ".";
}
