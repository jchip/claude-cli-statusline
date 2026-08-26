/**
 * Session identity component
 * Displays whichever identity the CLI reports, so multiple windows running in
 * the same project can be told apart.
 *
 * Priority: worktree > pull request > session name.
 */

import type { StatusLineInput } from "../types.ts";
import { Icons } from "../icons.ts";
import { ANSI_COLORS } from "../types.ts";

export type SessionIdentityKind = "worktree" | "pr" | "name";

export class SessionInfo {
  readonly kind: SessionIdentityKind | null;
  readonly label: string | null;

  constructor(kind: SessionIdentityKind | null, label: string | null) {
    this.kind = kind;
    this.label = label;
  }

  render(): string {
    if (!this.kind || !this.label) {
      return "";
    }

    const icon =
      this.kind === "worktree"
        ? Icons.WORKTREE
        : this.kind === "pr"
          ? Icons.PULL_REQUEST
          : Icons.SESSION;

    return `${icon} ${ANSI_COLORS.lightBlue}${this.label}${ANSI_COLORS.reset}`;
  }

  static fromInput(input: StatusLineInput): SessionInfo {
    const worktreeName =
      input.worktree?.name ?? SessionInfo.basename(input.workspace?.git_worktree);
    if (worktreeName) {
      return new SessionInfo("worktree", worktreeName);
    }

    const prNumber = input.pr?.number;
    if (typeof prNumber === "number") {
      return new SessionInfo("pr", `#${prNumber}`);
    }

    const sessionName = input.session_name;
    if (sessionName) {
      return new SessionInfo("name", sessionName);
    }

    return new SessionInfo(null, null);
  }

  private static basename(path?: string): string | null {
    if (!path) {
      return null;
    }
    const segments = path.split(/[\\/]/).filter((segment) => segment);
    return segments.length > 0 ? segments[segments.length - 1]! : null;
  }
}
