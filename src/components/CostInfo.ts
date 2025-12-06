/**
 * Session cost component
 * Displays total session cost from Claude CLI input
 */

import type { StatusLineInput } from "../types.ts";
import { Icons } from "../icons.ts";
import { ANSI_COLORS } from "../types.ts";

export class CostInfo {
  constructor(public readonly costUsd: number | null) {}

  render(): string {
    if (this.costUsd === null) {
      return "";
    }

    const formatted = `$${this.costUsd.toFixed(2)}`;
    return `${Icons.COST}\u00A0${ANSI_COLORS.green}${formatted}${ANSI_COLORS.reset}`;
  }

  static fromInput(input: StatusLineInput): CostInfo {
    const costUsd = input.cost?.total_cost_usd ?? null;
    return new CostInfo(costUsd);
  }
}
