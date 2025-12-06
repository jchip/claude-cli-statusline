/**
 * Subagent information component
 * Displays the currently active sub-agent type
 */

import type { StatusLineInput } from "../types.ts";
import { Icons } from "../icons.ts";
import { ANSI_COLORS } from "../types.ts";

export class SubagentInfo {
  constructor(public readonly subagentType: string | null) {}

  render(): string {
    if (!this.subagentType) {
      return "";
    }

    // Capitalize first letter of subagent type
    const displayName = this.formatSubagentName(this.subagentType);
    return `${Icons.SUBAGENT}\u00A0${ANSI_COLORS.lightBlue}${displayName}${ANSI_COLORS.reset}`;
  }

  private formatSubagentName(type: string): string {
    // Convert kebab-case or snake_case to Title Case
    // e.g., "code-reviewer" -> "Code-Reviewer"
    //       "explore" -> "Explore"
    return type
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("-");
  }

  static fromInput(input: StatusLineInput): SubagentInfo {
    const subagentType = input.subagent_type ?? null;
    return new SubagentInfo(subagentType);
  }
}
