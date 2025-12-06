/**
 * Type definitions for the statusline
 */

export interface Config {
  "context-color-levels": [number, number, number];
  "model-context-windows": Record<string, number>;
  "display-name-model-context-windows": Record<string, number>;
  "model-display-name-map": Record<string, string>;
  "default-context-window": number;
  "compact-buffer": number;
  "compact-drop-threshold"?: number;
  "save-sample": {
    enabled: boolean;
    filename: string;
  };
  "animations"?: {
    enabled?: boolean;
    "show-trend"?: boolean;
    "show-sparkline"?: boolean;
    spinner?: "transportation" | "weather" | "hearts" | "fruit" | "planets" | "circles" | "sports" | "flowers" | "hands" | "arrows" | "moon" | "clock" | "circular" | "braille" | "dots" | "blocks";
  };
  "show-git-repo-name"?: boolean;
  "show-project-full-dir"?: boolean;
  "render-layout"?: string[] | string;
  "git-status-icons"?: {
    clean: string;
    dirty: string;
    staged: string;
  };
  "clear-model"?: boolean;
}

export interface StatusLineInput {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  model?: {
    id?: string;
    display_name?: string;
  };
  workspace?: {
    current_dir?: string;
    project_dir?: string;
  };
  gitBranch?: string;
  budget?: Record<string, unknown>;
  cost?: {
    total_cost_usd?: number;
    total_duration_ms?: number;
    total_api_duration_ms?: number;
    total_lines_added?: number;
    total_lines_removed?: number;
  };
  subagent_type?: string;
  exceeds_200k_tokens?: boolean;
  [key: string]: unknown;
}

export interface SessionCacheEntry {
  line: number;
  tokens: number;
  isCompact?: boolean;
  compactTrigger?: "manual" | "auto";
  preCompactTokens?: number;
}

export interface SessionAnalysisCache {
  lastLine: number;
  lastTokenCount: number;
  lastModified: number;
  entries: SessionCacheEntry[];
  gitRepoName?: string | null;
  gitBranch?: string | null;
  "statusline-input"?: StatusLineInput;
  "statusline-output"?: string;
}

export interface TokenUsage {
  input_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  output_tokens?: number;
}

export interface TranscriptEntry {
  type?: string;
  subtype?: string;
  message?: {
    usage?: TokenUsage;
  };
  usage?: TokenUsage;
  compactMetadata?: {
    trigger?: "manual" | "auto";
    preTokens?: number;
    postTokens?: number;
  };
  gitBranch?: string;
  [key: string]: unknown;
}

export interface ContextData {
  usedTokens: number;
  maxTokens: number;
  remainingPercent: number;
  remainingAfterBuffer: number;
  compactOccurred: boolean;
  modelMatchType: "id" | "displayName" | "default";
  exceeds200k: boolean;
}

export interface ColorThresholds {
  green: number;
  yellow: number;
  orange: number;
}

export const ANSI_COLORS = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  orange: "\x1b[38;5;208m",
  red: "\x1b[31m",
  lightBlue: "\x1b[36m", // Cyan - darker than 94
  reset: "\x1b[0m",
} as const;

export const PREDEFINED_LAYOUTS = {
  // Named layouts
  "normal": ["project cwd git model context subagent"],
  "extend": ["project cwd git model context subagent cost duration"],
  "full": ["project cwd git model context subagent cost lines duration"],
  // Legacy names (backward compatibility)
  "layout-1-line": ["project cwd git model context subagent"],
  "layout-2-line": ["project cwd", "git model context subagent"],
} as const;
