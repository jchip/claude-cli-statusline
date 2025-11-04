/**
 * Animation utilities for statusline
 * Pure functions for creating animated effects
 */

/**
 * Time-based spinner (stateless)
 * Animates based on current time, no state needed
 */
export function spinner(): string {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]; // braille spinner
  const idx = Math.floor(Date.now() / 120) % frames.length;
  return frames[idx];
}

/**
 * Pulse animation (stateless)
 * Soft pulse effect based on current time
 */
export function pulse(): string {
  const frames = ["·", "∙", "•", "∙"]; // soft pulse
  const idx = Math.floor(Date.now() / 180) % frames.length;
  return frames[idx];
}

/**
 * Calculate trend arrow based on previous and current values
 */
export function trendArrow(prev: number | undefined, curr: number | undefined): string {
  if (prev == null || curr == null) return "·";
  const delta = curr - prev;
  if (Math.abs(delta) < 0.5) return "→"; // flat
  return delta > 0 ? "↗" : "↘"; // up / down
}

/**
 * Generate sparkline from series of numbers
 * Shows last 8 values as tiny bar chart
 */
export function sparkline(values: number[]): string {
  const bars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

  if (!values.length) return "";

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);

  return values
    .slice(-8) // Last 8 values
    .map((v) => {
      const normalized = Math.floor(((v - min) / span) * 7);
      const idx = Math.min(7, Math.max(0, normalized));
      return bars[idx];
    })
    .join("");
}

/**
 * Alternative spinner styles
 */
export const SPINNER_STYLES = {
  braille: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  dots: ["⠁", "⠂", "⠄", "⡀", "⢀", "⠠", "⠐", "⠈"],
  circular: ["◐", "◓", "◑", "◒"],
  blocks: ["▖", "▘", "▝", "▗"],
  clock: ["🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗"],
} as const;

/**
 * Get spinner frame with custom style
 */
export function getSpinnerFrame(
  style: keyof typeof SPINNER_STYLES = "braille",
  speed = 120
): string {
  const frames = SPINNER_STYLES[style];
  const idx = Math.floor(Date.now() / speed) % frames.length;
  return frames[idx];
}
