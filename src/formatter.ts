/**
 * Output formatting functions
 */

import { basename } from "path";
import { shortenHome, formatTokenCount } from "./utils";
import { gitBranch, gitRepoName } from "./git";
import { getModelContextWindow } from "./config";
import type { Config, Colors, StatusLineInput } from "./types";

export const colors: Colors = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  orange: "\x1b[38;5;208m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
};

/**
 * Format the context display with color coding and dual percentage
 */
export function formatContextDisplay(
  config: Config,
  pct: number | null,
  modelId: string,
  thresholds: [number, number, number],
  usedTokens: number
): string {
  if (pct === null || !isFinite(pct)) {
    return "⏬ 💤";
  }

  const pctRounded = Math.round(pct);
  const [greenThreshold, yellowThreshold, orangeThreshold] = thresholds;

  // Choose color based on remaining percentage and thresholds
  let color: string;
  if (pctRounded > greenThreshold) color = colors.green;
  else if (pctRounded >= yellowThreshold) color = colors.yellow;
  else if (pctRounded >= orangeThreshold) color = colors.orange;
  else color = colors.red;

  const maxTokens = getModelContextWindow(config, modelId);
  const maxDisplay = formatTokenCount(maxTokens);

  // Calculate percentage until compact (remaining before hitting compact buffer)
  const compactBuffer = config["compact-buffer"];
  const tokensUntilCompact = maxTokens - compactBuffer - usedTokens;
  const pctUntilCompact = Math.max(
    0,
    Math.round((tokensUntilCompact / maxTokens) * 100)
  );

  // Show dual percentage: total remaining ✦ until compact 💫 max
  return `⏬ ${color}${pctRounded}%${colors.reset}✦${color}${pctUntilCompact}%${colors.reset}💫${maxDisplay}`;
}

/**
 * Format git information
 */
export function formatGitInfo(
  root: string,
  cwd: string,
  transcriptPath?: string
): string {
  const branch = gitBranch(cwd, transcriptPath);
  const repoName = gitRepoName(cwd);

  if (repoName && branch !== "∅") {
    const rootDirName = basename(root);
    if (repoName === rootDirName) {
      return `🐙 📦 ${colors.green}⎇${colors.reset} ${branch}`;
    } else {
      return `🐙 ${repoName} ${colors.green}⎇${colors.reset} ${branch}`;
    }
  } else if (branch !== "∅") {
    return `${colors.green}⎇${colors.reset} ${branch}`;
  } else {
    return `${colors.yellow}⎇${colors.reset} ${branch}`;
  }
}

/**
 * Format the complete statusline
 */
export function formatStatusLine(
  config: Config,
  input: StatusLineInput,
  pct: number | null,
  thresholds: [number, number, number],
  usedTokens: number
): string {
  const model = input?.model?.display_name || input?.model?.id || "model";
  const cwd = input?.workspace?.current_dir || ".";
  const root = input?.workspace?.project_dir || cwd;
  const transcriptPath = input?.transcript_path;

  const rootAbbr = shortenHome(root);
  const relCwd =
    cwd === root
      ? "."
      : cwd.startsWith(root + "/")
      ? cwd.slice(root.length + 1)
      : cwd.split("/").pop() || ".";
  const relAbbr = shortenHome(relCwd);

  const gitInfo = formatGitInfo(root, cwd, transcriptPath);
  const ctxDisplay = formatContextDisplay(
    config,
    pct,
    input?.model?.id || "",
    thresholds,
    usedTokens
  );

  return `📦 ${rootAbbr} › 📁 ${relAbbr} ${gitInfo} 🧠 ${model} ${ctxDisplay}`;
}
