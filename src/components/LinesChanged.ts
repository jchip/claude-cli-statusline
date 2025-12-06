/**
 * Lines changed component
 * Displays code churn (lines added/removed) from Claude CLI input
 */

import type { StatusLineInput } from "../types.ts";
import { Icons } from "../icons.ts";
import { ANSI_COLORS } from "../types.ts";

export class LinesChanged {
  constructor(
    public readonly linesAdded: number | null,
    public readonly linesRemoved: number | null
  ) {}

  render(): string {
    if (this.linesAdded === null && this.linesRemoved === null) {
      return "";
    }

    const added = this.linesAdded ?? 0;
    const removed = this.linesRemoved ?? 0;

    const addedStr = `${ANSI_COLORS.green}+${added}${ANSI_COLORS.reset}`;
    const removedStr = `${ANSI_COLORS.red}−${removed}${ANSI_COLORS.reset}`;

    return `${Icons.LINES}\u00A0${addedStr}/${removedStr}`;
  }

  static fromInput(input: StatusLineInput): LinesChanged {
    const linesAdded = input.cost?.total_lines_added ?? null;
    const linesRemoved = input.cost?.total_lines_removed ?? null;
    return new LinesChanged(linesAdded, linesRemoved);
  }
}
