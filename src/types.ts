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
  "auto-wrap-width"?: number;
  "git-status-icons"?: {
    clean: string;
    dirty: string;
    staged: string;
  };
  "clear-model"?: boolean;
}

/**
 * The JSON the Claude CLI pipes to the statusline command.
 *
 * Field inventory verified against the payload builder in CLI v2.1.239.
 * Fields marked "conditional" are omitted entirely when they don't apply, so
 * every one of them must be treated as optional.
 */
export interface StatusLineInput {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  /** Conditional: id of the prompt currently being answered */
  prompt_id?: string;
  /** Conditional: main-thread agent type (also mirrored in `agent.name`) */
  agent_type?: string;
  /** Conditional: same value as `agent_type` */
  agent?: {
    name?: string;
  };
  /** Conditional: session title/name when one is set */
  session_name?: string;
  model?: {
    id?: string;
    display_name?: string;
  };
  workspace?: {
    current_dir?: string;
    project_dir?: string;
    added_dirs?: string[];
    /** Conditional: path of the git worktree, when in one */
    git_worktree?: string;
    /** Conditional: present when the git remote resolves */
    repo?: {
      host?: string;
      owner?: string;
      name?: string;
    };
  };
  /** CLI version string, e.g. "2.1.239" */
  version?: string;
  output_style?: {
    name?: string;
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
  /**
   * Legacy/never-sent: kept only as a fallback source for the agent name.
   * The CLI sends `agent_type` / `agent.name` instead.
   */
  subagent_type?: string;
  exceeds_200k_tokens?: boolean;
  fast_mode?: boolean;
  /** Conditional: only for models that support effort levels */
  effort?: {
    level?: string;
  };
  thinking?: {
    enabled?: boolean;
  };
  context_window?: {
    /** Cumulative session totals, not the current context size */
    total_input_tokens?: number;
    total_output_tokens?: number;
    context_window_size?: number;
    current_usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
    used_percentage?: number;
    remaining_percentage?: number;
  };
  /** Conditional: present once rate limits have been observed */
  rate_limits?: {
    five_hour?: RateLimitWindow;
    seven_day?: RateLimitWindow;
  };
  /** Conditional: vim mode enabled */
  vim?: {
    mode?: string;
  };
  /** Conditional: remote/cloud session */
  remote?: {
    session_id?: string;
  };
  /** Conditional: PR context */
  pr?: {
    number?: number;
    url?: string;
    review_state?: string;
    kind?: string;
  };
  /** Conditional: inside a worktree session */
  worktree?: {
    name?: string;
    path?: string;
    branch?: string;
    original_cwd?: string;
    original_branch?: string;
  };
  [key: string]: unknown;
}

export interface RateLimitWindow {
  /** 0-100 */
  used_percentage?: number;
  /** Epoch SECONDS */
  resets_at?: number;
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
  // Named layouts (spinner trails so the animated glyph has no volatile fields
  // to its right; it's a no-op when animations are disabled)
  "normal": ["project cwd git model context subagent spinner"],
  "extend": ["project cwd git model context subagent cost duration spinner"],
  "full": ["project cwd git model context subagent cost lines duration spinner"],
  // Legacy names (backward compatibility)
  "layout-1-line": ["project cwd git model context subagent spinner"],
  "layout-2-line": ["project cwd", "git model context subagent spinner"],
} as const;
