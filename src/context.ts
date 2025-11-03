/**
 * Context percentage calculation
 */

import { readFileSync } from "fs";
import { clamp } from "./utils";
import { getModelContextWindow } from "./config";
import { readCache, writeCache } from "./cache";
import type { Config } from "./types";

/**
 * Try to compute remaining% from any object that has "used" and "max"-ish keys
 */
export function percentFromObject(o: any): number | null {
  if (!o || typeof o !== "object") return null;

  // candidate key names (adding more common variations)
  const maxKeys = [
    "max_context_tokens",
    "maxContextTokens",
    "context_window",
    "contextWindow",
    "token_window",
    "tokenWindow",
    "model_max_context_tokens",
    "modelMaxContextTokens",
    "available_context_tokens",
    "availableContextTokens",
    "max_tokens",
    "maxTokens",
    "token_limit",
    "tokenLimit",
  ];
  const usedKeys = [
    "context_tokens",
    "contextTokens",
    "used_context_tokens",
    "usedContextTokens",
    "current_context_tokens",
    "currentContextTokens",
    "tokens_in_context",
    "tokensInContext",
    "tokens_used",
    "tokensUsed",
    "used_tokens",
    "usedTokens",
    "input_tokens",
    "inputTokens",
  ];
  const remainingKeys = [
    "remaining_context_tokens",
    "remainingContextTokens",
    "remaining_tokens",
    "remainingTokens",
    "tokens_remaining",
    "tokensRemaining",
  ];
  const remainingPctKeys = [
    "remaining_percent",
    "remainingPercent",
    "contextRemainingPercent",
    "remaining_percentage",
    "remainingPercentage",
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

  // availableContextTokens might already be remaining tokens
  const avail = o["available_context_tokens"] ?? o["availableContextTokens"];
  const max =
    o["max_context_tokens"] ??
    o["maxContextTokens"] ??
    o["context_window"] ??
    o["contextWindow"] ??
    o["token_window"] ??
    o["tokenWindow"] ??
    o["model_max_context_tokens"] ??
    o["modelMaxContextTokens"];
  if (typeof avail === "number" && typeof max === "number" && max > 0) {
    return clamp((avail / max) * 100);
  }

  return null;
}

/**
 * Recursively walk an object looking for any structure that yields a percent
 */
export function findPercentRecursive(o: any, depth = 0): number | null {
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

/**
 * Try to get context percentage and used tokens from transcript file with caching
 */
function tryFromTranscriptWithTokens(
  config: Config,
  transcriptPath: string | undefined,
  modelId?: string,
  statuslineInput?: any
): {
  percentage: number | null;
  usedTokens: number;
  compactOccurred: boolean;
  saveCache: (statuslineOutput: string) => void;
} {
  if (!transcriptPath)
    return {
      percentage: null,
      usedTokens: 0,
      compactOccurred: false,
      saveCache: () => {},
    };
  try {
    const raw = readFileSync(transcriptPath, "utf8");
    const lines = raw.trim().split("\n");

    // Try to read from cache
    const cache = readCache(transcriptPath);
    let startLine = 0;
    let currentUsedTokens = 0;
    let entries: Array<{ line: number; tokens: number }> = [];
    let compactOccurred = false;

    if (cache) {
      // Start from where we left off
      startLine = cache.lastLine;
      currentUsedTokens = cache.lastTokenCount;
      entries = cache.entries || [];

      // Check if a compact occurred (significant drop in tokens) in existing entries
      if (entries.length >= 2) {
        for (let i = 1; i < entries.length; i++) {
          const prev = entries[i - 1].tokens;
          const curr = entries[i].tokens;
          if (prev > 0 && curr < prev * 0.7) {
            compactOccurred = true;
            break;
          }
        }
      }
    }

    // Process only new lines (or all lines if no cache)
    let lastProcessedLine = startLine;
    let lastCompactMetadata: any = null;

    for (let i = startLine; i < lines.length; i++) {
      try {
        const entry = JSON.parse(lines[i]);

        // Check for compact_boundary system message
        if (entry.type === "system" && entry.subtype === "compact_boundary") {
          compactOccurred = true;
          lastCompactMetadata = entry.compactMetadata;
        }

        const usage = entry?.message?.usage;

        if (usage) {
          // Context usage = input_tokens + cache_creation_input_tokens + cache_read_input_tokens
          const contextUsed =
            (usage.input_tokens || 0) +
            (usage.cache_creation_input_tokens || 0) +
            (usage.cache_read_input_tokens || 0);

          // Only update if we have actual tokens (skip 0-token entries like tool uses)
          if (contextUsed > 0) {
            currentUsedTokens = contextUsed;
            lastProcessedLine = i + 1; // +1 because we want to start after this line next time

            // Add entry to history with compact metadata if this is right after a compact
            const entryData: any = {
              line: i + 1,
              tokens: contextUsed,
            };

            if (lastCompactMetadata) {
              entryData.isCompact = true;
              entryData.compactTrigger = lastCompactMetadata.trigger;
              entryData.preCompactTokens = lastCompactMetadata.preTokens;
              lastCompactMetadata = null; // Clear after using
            }

            entries.push(entryData);
          }
        }
      } catch {
        // Skip malformed lines
      }
    }

    // Create a function to save cache with statusline output later
    const saveCache = (statuslineOutput: string) => {
      if (currentUsedTokens > 0) {
        writeCache(
          transcriptPath,
          lastProcessedLine,
          currentUsedTokens,
          entries,
          statuslineInput,
          statuslineOutput
        );
      }
    };

    if (currentUsedTokens > 0) {
      const { tokens: maxTokens } = getModelContextWindow(
        config,
        modelId || ""
      );
      const remaining = maxTokens - currentUsedTokens;
      return {
        percentage: clamp((remaining / maxTokens) * 100),
        usedTokens: currentUsedTokens,
        compactOccurred,
        saveCache,
      };
    }

    return {
      percentage: null,
      usedTokens: 0,
      compactOccurred: false,
      saveCache: () => {},
    };
  } catch {
    return {
      percentage: null,
      usedTokens: 0,
      compactOccurred: false,
      saveCache: () => {},
    };
  }
}

/**
 * Try to get context percentage from transcript file with caching (legacy function)
 */
export function tryFromTranscript(
  config: Config,
  transcriptPath: string | undefined,
  modelId?: string
): number | null {
  return tryFromTranscriptWithTokens(config, transcriptPath, modelId)
    .percentage;
}

/**
 * Get context percentage and used tokens from input data
 */
export function getContextInfo(
  config: Config,
  input: any
): {
  percentage: number | null;
  usedTokens: number;
  compactOccurred: boolean;
  saveCache: (statuslineOutput: string) => void;
} {
  let pct = null;
  let usedTokens = 0;
  let compactOccurred = false;
  let saveCache: (statuslineOutput: string) => void = () => {}; // no-op by default

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
    const result = tryFromTranscriptWithTokens(
      config,
      input?.transcript_path,
      input?.model?.id,
      input
    );
    pct = result.percentage;
    usedTokens = result.usedTokens;
    compactOccurred = result.compactOccurred;
    saveCache = result.saveCache;
  }

  return { percentage: pct, usedTokens, compactOccurred, saveCache };
}

/**
 * Get context percentage from input data (legacy function for compatibility)
 */
export function getContextPercentage(
  config: Config,
  input: any
): number | null {
  return getContextInfo(config, input).percentage;
}
