/**
 * State manager for statusline trends and sparklines
 * Persists minimal state for animation effects
 *
 * @deprecated This class is no longer used. Animation state is now stored
 * in the session cache file (transcript.json.cache.json) to avoid conflicts
 * between multiple Claude sessions. See SessionAnalysisCache.animationState
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export interface StatusLineState {
  lastPercent?: number;
  series?: number[];
  lastUpdated?: number;
}

/**
 * @deprecated Use SessionAnalysisCache.animationState instead
 */
export class StatusLineStateManager {
  private static readonly STATE_FILE = ".statusline.state.json";
  private static readonly MAX_SERIES_LENGTH = 24;

  /**
   * Get state file path
   */
  private static getStatePath(): string {
    const home = process.env.HOME || "";
    return join(home, ".claude", this.STATE_FILE);
  }

  /**
   * Load state from file
   */
  static load(): StatusLineState {
    try {
      const path = this.getStatePath();
      if (!existsSync(path)) {
        return {};
      }
      return JSON.parse(readFileSync(path, "utf-8"));
    } catch {
      return {};
    }
  }

  /**
   * Save state to file
   */
  static save(state: StatusLineState): void {
    try {
      const path = this.getStatePath();
      writeFileSync(path, JSON.stringify(state));
    } catch {
      // Silently fail - state is optional
    }
  }

  /**
   * Update state with new percentage value
   * Maintains series of recent values for sparkline
   */
  static updateWithPercent(currentPercent: number): StatusLineState {
    const state = this.load();

    const newState: StatusLineState = {
      lastPercent: currentPercent,
      series: [
        ...(state.series || []),
        Math.round(currentPercent),
      ].slice(-this.MAX_SERIES_LENGTH),
      lastUpdated: Date.now(),
    };

    this.save(newState);
    return newState;
  }

  /**
   * Get trend arrow comparing current to previous
   */
  static getTrendArrow(currentPercent: number): string {
    const state = this.load();
    const prev = state.lastPercent;
    const curr = currentPercent;

    if (prev == null) return "·";

    const delta = curr - prev;
    if (Math.abs(delta) < 0.5) return "→"; // flat
    return delta > 0 ? "↗" : "↘"; // up / down
  }

  /**
   * Get sparkline from stored series
   */
  static getSparkline(): string {
    const state = this.load();
    const series = state.series || [];

    if (series.length === 0) return "";

    const bars = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = Math.max(1, max - min);

    return series
      .slice(-8)
      .map((v) => {
        const normalized = Math.floor(((v - min) / span) * 7);
        const idx = Math.min(7, Math.max(0, normalized));
        return bars[idx];
      })
      .join("");
  }

  /**
   * Clear state (for testing or reset)
   */
  static clear(): void {
    try {
      const path = this.getStatePath();
      if (existsSync(path)) {
        writeFileSync(path, "{}");
      }
    } catch {
      // Silently fail
    }
  }
}
