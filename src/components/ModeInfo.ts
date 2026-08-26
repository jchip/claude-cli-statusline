/**
 * Run-mode indicators component
 * Displays effort level, thinking state, and fast mode
 */

import type { StatusLineInput } from "../types.ts";
import { Icons } from "../icons.ts";
import { ANSI_COLORS } from "../types.ts";

export class ModeInfo {
  readonly effortLevel: string | null;
  readonly thinkingEnabled: boolean;
  readonly fastMode: boolean;

  constructor(
    effortLevel: string | null,
    thinkingEnabled: boolean = false,
    fastMode: boolean = false
  ) {
    this.effortLevel = effortLevel;
    this.thinkingEnabled = thinkingEnabled;
    this.fastMode = fastMode;
  }

  render(): string {
    const parts: string[] = [];

    if (this.effortLevel) {
      parts.push(
        `${Icons.EFFORT} ${ANSI_COLORS.lightBlue}${this.effortLevel}${ANSI_COLORS.reset}`
      );
    }

    if (this.thinkingEnabled) {
      parts.push(Icons.THINKING);
    }

    if (this.fastMode) {
      parts.push(Icons.FAST_MODE);
    }

    return parts.join(" ");
  }

  /**
   * `effort` is only sent for models that support effort levels; `thinking`
   * and `fast_mode` are always sent. Anything absent or off renders nothing.
   */
  static fromInput(input: StatusLineInput): ModeInfo {
    return new ModeInfo(
      input.effort?.level ?? null,
      input.thinking?.enabled === true,
      input.fast_mode === true
    );
  }
}
