#!/usr/bin/env bun
/**
 * Claude Code statusline
 * Displays: model · root dir · relative cwd · git branch · context remaining %
 *
 * Strategy to get context %:
 *  1) Look for known/likely fields in the incoming JSON (stdin).
 *  2) If missing, open transcript_path (if provided) and search for used/max context tokens.
 *  3) If still unknown, show "—".
 */

import { spawnSync } from "bun";
import { readFileSync, existsSync } from "fs";
import { basename, join } from "path";

// ----- helpers -----
function shortenHome(path: string): string {
  const home = process.env.HOME || "";
  return path.replace(home, "~");
}

function gitBranch(dir: string): string {
  const r = spawnSync(["git", "-C", dir, "rev-parse", "--abbrev-ref", "HEAD"], {
    stdout: "pipe",
    stderr: "ignore",
  });
  return r.success ? r.stdout.toString().trim() : "∅";
}

function gitRepoName(dir: string): string {
  const r = spawnSync(["git", "-C", dir, "rev-parse", "--show-toplevel"], {
    stdout: "pipe",
    stderr: "ignore",
  });
  if (r.success) {
    const repoPath = r.stdout.toString().trim();
    return repoPath.split("/").pop() || "";
  }
  return "";
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

// Try to compute remaining% from any object that has "used" and "max"-ish keys
function percentFromObject(o: any): number | null {
  if (!o || typeof o !== "object") return null;

  // candidate key names (adding more common variations)
  const maxKeys = [
    "max_context_tokens", "maxContextTokens",
    "context_window", "contextWindow",
    "token_window", "tokenWindow",
    "model_max_context_tokens", "modelMaxContextTokens",
    "available_context_tokens", "availableContextTokens", // may be remaining, handle carefully
    "max_tokens", "maxTokens",
    "token_limit", "tokenLimit"
  ];
  const usedKeys = [
    "context_tokens", "contextTokens",
    "used_context_tokens", "usedContextTokens",
    "current_context_tokens", "currentContextTokens",
    "tokens_in_context", "tokensInContext",
    "tokens_used", "tokensUsed",
    "used_tokens", "usedTokens",
    "input_tokens", "inputTokens"
  ];
  const remainingKeys = [
    "remaining_context_tokens", "remainingContextTokens",
    "remaining_tokens", "remainingTokens",
    "tokens_remaining", "tokensRemaining"
  ];
  const remainingPctKeys = [
    "remaining_percent", "remainingPercent", "contextRemainingPercent",
    "remaining_percentage", "remainingPercentage"
  ];

  // direct percent
  for (const k of remainingPctKeys) {
    const v = o[k];
    if (typeof v === "number" && isFinite(v)) return clamp(v);
  }

  // remaining/max
  for (const rk of remainingKeys) {
    const r = o[rk];
    for (const mk of maxKeys) {
      const m = o[mk];
      if (typeof r === "number" && typeof m === "number" && m > 0) {
        return clamp((r / m) * 100);
      }
    }
  }

  // used/max → remaining%
  for (const uk of usedKeys) {
    const u = o[uk];
    for (const mk of maxKeys) {
      const m = o[mk];
      if (typeof u === "number" && typeof m === "number" && m > 0) {
        return clamp(((m - u) / m) * 100);
      }
    }
  }

  // availableContextTokens might already be remaining tokens; try to pair with a known max
  const avail = (o["available_context_tokens"] ?? o["availableContextTokens"]);
  const max =
    o["max_context_tokens"] ?? o["maxContextTokens"] ??
    o["context_window"] ?? o["contextWindow"] ??
    o["token_window"] ?? o["tokenWindow"] ??
    o["model_max_context_tokens"] ?? o["modelMaxContextTokens"];
  if (typeof avail === "number" && typeof max === "number" && max > 0) {
    return clamp((avail / max) * 100);
  }

  return null;
}

// Recursively walk an object looking for any structure that yields a percent
function findPercentRecursive(o: any, depth = 0): number | null {
  if (!o || typeof o !== "object" || depth > 6) return null;
  const direct = percentFromObject(o);
  if (direct !== null) return direct;
  for (const v of Object.values(o)) {
    if (v && typeof v === "object") {
      const p = findPercentRecursive(v, depth + 1);
      if (p !== null) return p;
    }
  }
  return null;
}

// Load configuration
interface Config {
  "context-color-levels": [number, number, number];
  "model-context-windows": Record<string, number>;
}

function loadConfig(): Config {
  const configPath = join(import.meta.dir, "config.json");
  const defaultConfig: Config = {
    "context-color-levels": [65, 45, 20],
    "model-context-windows": {
      "claude-sonnet-4-5-20250929": 200000,
      "claude-sonnet-4-20250514": 200000,
      "claude-opus-4-20250514": 200000,
      "claude-3-5-sonnet-20241022": 200000,
      "claude-3-5-sonnet-20240620": 200000,
      "claude-3-opus-20240229": 200000,
      "claude-3-sonnet-20240229": 200000,
      "claude-3-haiku-20240307": 200000,
    }
  };

  if (existsSync(configPath)) {
    try {
      const configData = JSON.parse(readFileSync(configPath, "utf8"));
      return {
        "context-color-levels": configData["context-color-levels"] || defaultConfig["context-color-levels"],
        "model-context-windows": configData["model-context-windows"] || defaultConfig["model-context-windows"]
      };
    } catch {
      return defaultConfig;
    }
  }
  return defaultConfig;
}

const config = loadConfig();

function getModelContextWindow(modelId: string): number {
  return config["model-context-windows"][modelId] || 200000; // default to 200k
}

function tryFromTranscript(transcriptPath: string | undefined, modelId?: string): number | null {
  if (!transcriptPath) return null;
  try {
    const raw = readFileSync(transcriptPath, "utf8");

    // Parse JSONL format (one JSON object per line)
    const lines = raw.trim().split('\n');
    let maxUsedTokens = 0;

    // Find the maximum context usage across all messages
    // We look at the last message which typically has the cumulative context
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        const usage = entry?.message?.usage;

        if (usage) {
          // Context usage = input_tokens + cache_creation_input_tokens + cache_read_input_tokens
          // This represents the total tokens in context at this point
          const contextUsed =
            (usage.input_tokens || 0) +
            (usage.cache_creation_input_tokens || 0) +
            (usage.cache_read_input_tokens || 0);

          maxUsedTokens = Math.max(maxUsedTokens, contextUsed);
        }
      } catch {
        // Skip malformed lines
      }
    }

    if (maxUsedTokens > 0 && modelId) {
      const maxTokens = getModelContextWindow(modelId);
      const remaining = maxTokens - maxUsedTokens;
      return clamp((remaining / maxTokens) * 100);
    }

    return null;
  } catch {
    return null;
  }
}

// ----- main -----
const input = await new Response(process.stdin).json().catch(() => ({} as any));

// Save sample input for debugging if --save-sample flag is passed
const saveSampleArg = process.argv.find(arg => arg.startsWith("--save-sample"));
if (saveSampleArg) {
  try {
    let filename = "sample-input.json";
    if (saveSampleArg.includes("=")) {
      filename = saveSampleArg.split("=")[1];
    }
    const samplePath = import.meta.dir + "/" + filename;
    await Bun.write(samplePath, JSON.stringify(input, null, 2));
  } catch {
    // Ignore errors
  }
}

// Get context level thresholds from config, can be overridden by CLI flag
// Default: green > 65%, yellow 45-65%, orange 20-45%, red < 20%
let [greenThreshold, yellowThreshold, orangeThreshold] = config["context-color-levels"];

// CLI flag overrides config
const contextLevelsArg = process.argv.find(arg => arg.startsWith("--context-levels="));
if (contextLevelsArg) {
  try {
    const values = contextLevelsArg.split("=")[1].split(",").map(v => parseInt(v.trim()));
    if (values.length === 3 && values.every(v => !isNaN(v) && v >= 0 && v <= 100)) {
      const [green, yellow, orange] = values;
      // Ensure they are in descending order
      if (green > yellow && yellow > orange) {
        greenThreshold = green;
        yellowThreshold = yellow;
        orangeThreshold = orange;
      }
    }
  } catch {
    // Ignore parsing errors, use config values
  }
}

const model = input?.model?.display_name || input?.model?.id || "model";
const cwd = input?.workspace?.current_dir || ".";
const root = input?.workspace?.project_dir || cwd;

// relative cwd to root
let relCwd: string;
if (cwd === root) relCwd = ".";
else if (cwd.startsWith(root + "/")) relCwd = cwd.slice(root.length + 1);
else relCwd = cwd.split("/").pop() || ".";

const rootAbbr = shortenHome(root);
const relAbbr = shortenHome(relCwd);
const branch = gitBranch(cwd);
const repoName = gitRepoName(cwd);

// try to get % from the input first (check common locations)
let pct = null;

// Check budget field if it exists
if (input?.budget) {
  pct = percentFromObject(input.budget);
}

// Check cost field for token info
if (pct === null && input?.cost) {
  pct = percentFromObject(input.cost);
}

// Recursively search all fields
if (pct === null) {
  pct = findPercentRecursive(input);
}

// if not found, try transcript file
if (pct === null) {
  pct = tryFromTranscript(input?.transcript_path, input?.model?.id);
}

// ANSI color codes
const colors = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  orange: "\x1b[38;5;208m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
};

// Helper to format token count in human-readable format
function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    const m = tokens / 1000000;
    return m % 1 === 0 ? `${m}M` : `${m.toFixed(2)}M`;
  } else if (tokens >= 1000) {
    const k = tokens / 1000;
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(2)}K`;
  }
  return `${tokens}`;
}

// format with visual indicator
let ctxDisplay: string;
if (pct !== null && isFinite(pct)) {
  const pctRounded = Math.round(pct);
  // Choose color based on remaining percentage and thresholds
  let color: string;
  if (pctRounded > greenThreshold) color = colors.green; // plenty left
  else if (pctRounded >= yellowThreshold) color = colors.yellow; // moderate
  else if (pctRounded >= orangeThreshold) color = colors.orange; // getting low
  else color = colors.red; // almost full

  // Get the max context window for the current model
  const maxTokens = getModelContextWindow(input?.model?.id || "");
  const maxDisplay = formatTokenCount(maxTokens);

  ctxDisplay = `⏬ ${color}${pctRounded}%${colors.reset} ${maxDisplay}`;
} else {
  ctxDisplay = "⏬ —";
}

// Format git info
let gitInfo = "";
if (repoName && branch !== "∅") {
  // Check if repo name matches the root directory name
  const rootDirName = basename(root);
  if (repoName === rootDirName) {
    // Use box icon instead of octopus+name if they match
    gitInfo = `🐙 📦 ${colors.green}⎇${colors.reset} ${branch}`;
  } else {
    // Show octopus + repo name if different
    gitInfo = `🐙 ${repoName} ${colors.green}⎇${colors.reset} ${branch}`;
  }
} else if (branch !== "∅") {
  gitInfo = `${colors.green}⎇${colors.reset} ${branch}`;
} else {
  gitInfo = `${colors.yellow}⎇${colors.reset} ${branch}`;
}

console.log(`📦 ${rootAbbr} › 📁 ${relAbbr} ${gitInfo} 🧠 ${model} ${ctxDisplay}`);
