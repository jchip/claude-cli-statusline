/**
 * Renderer for git information
 * Pure presentation logic - takes data and produces formatted string
 */

import { GitData } from "../models/GitData.ts";
import { ANSI_COLORS } from "../types.ts";
import { Icons } from "../icons.ts";

export class GitRenderer {
  /**
   * Render git info as formatted string
   */
  static render(data: GitData): string {
    const parts: string[] = [];

    if (!data.hasGit) {
      // No git repo
      parts.push(ANSI_COLORS.yellow);
      parts.push(Icons.GIT_BRANCH);
      parts.push(Icons.NO_GIT);
      parts.push(ANSI_COLORS.reset);
      return parts.join(" ");
    }

    // Has git
    parts.push(Icons.GIT_REPO);

    // Add working tree status if available (after octopus)
    if (data.isClean !== null) {
      if (data.isClean) {
        parts.push(`${ANSI_COLORS.green}${Icons.GIT_CLEAN}${ANSI_COLORS.reset}`);
      } else {
        parts.push(`${ANSI_COLORS.yellow}${Icons.GIT_DIRTY}${ANSI_COLORS.reset}`);
      }
    }

    if (data.showRepoName) {
      // Show repo name when different from project dir (config enabled)
      parts.push(data.repoName!);
    } else if (data.showPackageIcon) {
      // Repo name same as project dir (config enabled)
      parts.push(Icons.WORKDIR);
    }
    // else: config disabled, show only octopus icon

    parts.push(`${ANSI_COLORS.green}${Icons.GIT_BRANCH}${ANSI_COLORS.reset}`);
    parts.push(data.branch!);

    return parts.join(" ");
  }
}
