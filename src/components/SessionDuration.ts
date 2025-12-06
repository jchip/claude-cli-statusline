/**
 * Session duration component
 * Displays session duration from Claude CLI input
 */

import type { StatusLineInput } from "../types.ts";
import { Icons } from "../icons.ts";
import { ANSI_COLORS } from "../types.ts";

export class SessionDuration {
  constructor(public readonly durationMs: number | null) {}

  render(): string {
    if (this.durationMs === null) {
      return "";
    }

    const formatted = this.formatDuration(this.durationMs);
    return `${Icons.DURATION}\u00A0${ANSI_COLORS.yellow}${formatted}${ANSI_COLORS.reset}`;
  }

  private formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours === 0 && minutes === 0) {
      return "<1m";
    }

    if (hours === 0) {
      return `${minutes}m`;
    }

    if (minutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h${minutes}m`;
  }

  static fromInput(input: StatusLineInput): SessionDuration {
    const durationMs = input.cost?.total_duration_ms ?? null;
    return new SessionDuration(durationMs);
  }
}
