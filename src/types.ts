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
  "save-sample": {
    enable: boolean;
    filename: string;
  };
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
  budget?: any;
  cost?: any;
  [key: string]: any;
}

export interface Colors {
  green: string;
  yellow: string;
  orange: string;
  red: string;
  reset: string;
}
