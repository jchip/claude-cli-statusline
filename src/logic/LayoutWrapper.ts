/**
 * Width-aware layout wrapping.
 *
 * Packs pre-rendered parts (in order) into balanced lines around a target
 * width. The width is a soft target: a line may spill slightly over it when
 * doing so absorbs a widget that would otherwise be stranded alone on a short
 * line. Line breaks are chosen to minimize total "raggedness" (how far each
 * line sits from the target), which avoids both lopsided and orphaned lines.
 */

import { visibleWidth } from "../utils.ts";

// Parts are joined by a single space, which adds 1 cell between adjacent parts.
const SEP_WIDTH = 1;

// How harshly to penalize a line that overruns the target width. Squared slack
// already discourages overflow; this multiplier keeps lines within the target
// unless spilling over is the only way to avoid stranding a widget.
const OVERFLOW_PENALTY = 4;

/**
 * Wrap parts into balanced lines around a target width.
 *
 * Uses minimum-raggedness line breaking: of all the ways to split the parts
 * (in order), pick the one with the lowest total cost, where each line costs
 * the square of its distance from the target width. Overflow is allowed but
 * penalized more heavily, so lines stay near the target and short trailing
 * widgets get pulled up rather than stranded.
 */
export function wrapBalanced(parts: string[], maxWidth: number): string[] {
  if (parts.length === 0) return [""];

  const widths = parts.map(visibleWidth);
  const n = parts.length;

  // Prefix sums for O(1) line-width queries.
  const prefix: number[] = [0];
  for (let k = 0; k < n; k++) prefix.push(prefix[k] + widths[k]);

  // Visible width of parts[i..j] joined by single spaces.
  const lineWidth = (i: number, j: number) =>
    prefix[j + 1] - prefix[i] + (j - i) * SEP_WIDTH;

  const lineCost = (i: number, j: number): number => {
    const w = lineWidth(i, j);
    if (w > maxWidth) {
      const over = w - maxWidth;
      return OVERFLOW_PENALTY * over * over;
    }
    // Every line (including the last) is penalized for being short, so a
    // trailing widget gets pulled up onto the line above when the resulting
    // overflow is modest, instead of stranding itself on its own short line.
    const slack = maxWidth - w;
    return slack * slack;
  };

  // dp[i] = min cost to lay out parts[i..n-1]; split[i] = end index of the
  // line that starts at i in the optimal layout.
  const dp: number[] = new Array(n + 1).fill(0);
  const split: number[] = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let best = Infinity;
    let bestJ = i;
    for (let j = i; j < n; j++) {
      const cost = lineCost(i, j) + dp[j + 1];
      if (cost < best) {
        best = cost;
        bestJ = j;
      }
    }
    dp[i] = best;
    split[i] = bestJ;
  }

  const lines: string[] = [];
  for (let i = 0; i < n; ) {
    const j = split[i];
    lines.push(parts.slice(i, j + 1).join(" "));
    i = j + 1;
  }
  return lines;
}
