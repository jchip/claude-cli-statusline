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

// Matches ANSI SGR (color/style) escape sequences
const ANSI_REGEX = /\x1b\[[0-9;]*m/g;

/**
 * Determine the terminal cell width of a single code point.
 * Returns 0 for zero-width marks, 2 for wide/emoji glyphs, 1 otherwise.
 */
function charWidth(cp: number): number {
  // Zero-width: ZWJ, variation selectors, combining marks
  if (
    cp === 0x200d ||
    cp === 0xfe0e ||
    cp === 0xfe0f ||
    (cp >= 0x0300 && cp <= 0x036f) ||
    (cp >= 0x20d0 && cp <= 0x20ff)
  ) {
    return 0;
  }

  // Wide/emoji ranges (East Asian wide + emoji presentation)
  if (
    (cp >= 0x1100 && cp <= 0x115f) || // Hangul Jamo
    (cp >= 0x231a && cp <= 0x231b) || // watch, hourglass
    (cp >= 0x2329 && cp <= 0x232a) ||
    (cp >= 0x23e9 && cp <= 0x23fa) || // clock/media (⏰ etc.)
    (cp >= 0x25fd && cp <= 0x25fe) ||
    (cp >= 0x2600 && cp <= 0x26ff) || // misc symbols (☀ ⚠ ⚽)
    (cp >= 0x2700 && cp <= 0x27bf) || // dingbats (✋ ➡)
    (cp >= 0x2b00 && cp <= 0x2bff) || // misc symbols & arrows (⬆ ⬇)
    (cp >= 0x2e80 && cp <= 0x303e) ||
    (cp >= 0x3041 && cp <= 0x33ff) ||
    (cp >= 0x3400 && cp <= 0x4dbf) ||
    (cp >= 0x4e00 && cp <= 0x9fff) ||
    (cp >= 0xa000 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    cp >= 0x1f000 // supplementary emoji/symbols
  ) {
    return 2;
  }

  return 1;
}

/**
 * Visible terminal width of a string, ignoring ANSI color codes and
 * counting emoji/wide glyphs as 2 cells.
 */
export function visibleWidth(str: string): number {
  const clean = str.replace(ANSI_REGEX, "");
  let width = 0;
  for (const ch of clean) {
    width += charWidth(ch.codePointAt(0)!);
  }
  return width;
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
