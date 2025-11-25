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
  static render(data: GitData, statusIcons?: { clean: string; dirty: string; staged: string }): string {
    const parts: string[] = [];

    if (!data.hasGit) {
      // No git repo
      parts.push(ANSI_COLORS.yellow);
      parts.push(Icons.GIT_BRANCH);
      parts.push(Icons.NO_GIT);
      parts.push(ANSI_COLORS.reset);
      return parts.join(" ");
    }

    // Has git - combine octopus with status icons (no space)
    const cleanIcon = statusIcons?.clean ?? Icons.GIT_CLEAN;
    const dirtyIcon = statusIcons?.dirty ?? Icons.GIT_DIRTY;
    const stagedIcon = statusIcons?.staged ?? Icons.GIT_STAGED;

    let gitIcon = Icons.GIT_REPO;

    // Show staged icon if there are staged changes
    if (data.hasStaged === true) {
      gitIcon += `${ANSI_COLORS.lightBlue}${stagedIcon}${ANSI_COLORS.reset}`;
    }

    // Show dirty status for working tree (only if there are unstaged changes)
    // Don't show clean icon if staged icon is already shown
    if (data.isClean !== null) {
      if (!data.isClean) {
        // Has unstaged changes - show dirty icon
        gitIcon += `${ANSI_COLORS.yellow}${dirtyIcon}${ANSI_COLORS.reset}`;
      } else if (data.hasStaged !== true) {
        // Clean and no staged changes - show clean icon
        gitIcon += `${ANSI_COLORS.green}${cleanIcon}${ANSI_COLORS.reset}`;
      }
      // If clean but has staged changes - don't show clean icon
    }

    parts.push(gitIcon);

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

    return parts.join("\u00A0");
  }
}
