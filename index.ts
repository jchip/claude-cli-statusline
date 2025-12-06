#!/usr/bin/env bun

/**
 * Claude CLI Statusline
 * Main entry point
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import type { StatusLineInput, SessionAnalysisCache } from "./src/types.ts";
import { ConfigLoader } from "./src/services/ConfigLoader.ts";
import { SessionAnalyzer } from "./src/services/SessionAnalyzer.ts";
import { CacheManager } from "./src/services/CacheManager.ts";
import { ClaudeConfigReader } from "./src/services/ClaudeConfigReader.ts";
import { WorkDir } from "./src/components/WorkDir.ts";
import { GitInfo } from "./src/components/GitInfo.ts";
import { ModelInfo } from "./src/components/ModelInfo.ts";
import { ContextInfo } from "./src/components/ContextInfo.ts";
import { CostInfo } from "./src/components/CostInfo.ts";
import { LinesChanged } from "./src/components/LinesChanged.ts";
import { SessionDuration } from "./src/components/SessionDuration.ts";
import { SubagentInfo } from "./src/components/SubagentInfo.ts";
import { StatusLineComponents } from "./src/components/StatusLineComponents.ts";

async function main() {
  // Step 1: Parse CLI arguments
  const args = process.argv.slice(2);
  const { configFile, colorLevels, saveSample, saveSampleFilename, layout, spinner, clearModel } =
    ConfigLoader.parseArgs(args);

  // Step 2: Read input from stdin
  let inputText = "";
  try {
    inputText = readFileSync(0, "utf-8");
  } catch {
    // No input, use empty object
  }

  let input: StatusLineInput = {};
  let parseError: string | null = null;
  if (inputText.trim()) {
    try {
      input = JSON.parse(inputText);
    } catch (error) {
      parseError = error instanceof Error ? error.message : "invalid JSON";
    }
  }

  // If parse error, output fallback statusline and exit
  if (parseError) {
    process.stdout.write(`⚠️ statusline: ${parseError}`);
    return;
  }

  // Step 3: Load configuration
  const projectDir =
    input?.workspace?.project_dir || input?.cwd || process.cwd();
  let config = ConfigLoader.load(projectDir, configFile);

  // Apply CLI overrides
  config = ConfigLoader.applyOverrides(
    config,
    colorLevels,
    saveSample,
    saveSampleFilename,
    layout,
    spinner,
    clearModel
  );

  // Step 3.5: Clear model from settings.json (unless explicitly disabled)
  if (config["clear-model"] !== false) {
    await ConfigLoader.moveModelToProjectSettings(projectDir);
  }

  // Step 4: Load cache early to get git info
  const transcriptPath = input.transcript_path;
  let analysisCache: SessionAnalysisCache | null = null;
  let cachedGitRepoName: string | null | undefined;
  let cachedGitBranch: string | null | undefined;
  let usedTokens = 0;
  let compactOccurred = false;

  if (transcriptPath && existsSync(transcriptPath)) {
    const analysis = SessionAnalyzer.analyzeTranscript(
      transcriptPath,
      config["compact-drop-threshold"]
    );
    analysisCache = analysis.cache;
    cachedGitRepoName = analysis.cache.gitRepoName;
    cachedGitBranch = analysis.cache.gitBranch;
    usedTokens = analysis.usedTokens;
    compactOccurred = analysis.compactOccurred;
  }

  // Step 5: Gather component data (git uses input JSON, then cached values)
  const workDir = WorkDir.fromInput(input, config["show-project-full-dir"] ?? false);
  const git = GitInfo.fromDirectory(
    projectDir,
    input.transcript_path,
    cachedGitRepoName,
    cachedGitBranch,
    input.gitBranch,
    config["show-git-repo-name"] ?? false,
    config["git-status-icons"]
  );
  const model = ModelInfo.fromInput(input, config);

  // Step 5.5: Read auto-compact setting from Claude CLI config
  const autoCompactEnabled = ClaudeConfigReader.readAutoCompactEnabled();

  // Step 6: Create context with analyzed data
  const exceeds200k = input.exceeds_200k_tokens ?? false;
  const context = ContextInfo.fromData(
    usedTokens,
    model.maxTokens,
    config["compact-buffer"],
    compactOccurred,
    config["context-color-levels"],
    model.matchIndicator,
    autoCompactEnabled,
    exceeds200k
  );

  // Step 6.5: Create cost-related components
  const cost = CostInfo.fromInput(input);
  const lines = LinesChanged.fromInput(input);
  const duration = SessionDuration.fromInput(input);
  const subagent = SubagentInfo.fromInput(input);

  // Step 7: Build and render status line
  const components = new StatusLineComponents(workDir, git, model, context, config, cost, lines, duration, subagent);
  const output = components.render();

  // Step 8: Output to stdout
  process.stdout.write(output);

  // Step 9: Save sample if requested
  if (config["save-sample"].enabled) {
    try {
      const samplePath = config["save-sample"].filename;
      const sampleDir = dirname(samplePath);

      if (!existsSync(sampleDir)) {
        mkdirSync(sampleDir, { recursive: true });
      }

      writeFileSync(samplePath, JSON.stringify(input, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save sample:", error);
    }
  }

  // Step 10: Save cache with metadata (always at the end)
  if (transcriptPath && analysisCache) {
    CacheManager.write(
      transcriptPath,
      analysisCache,
      input,
      output,
      git.repoName,
      git.branch
    );
  }
}

main().catch((error) => {
  const msg = error instanceof Error ? error.message : String(error);
  process.stdout.write(`⚠️ statusline error: ${msg}`);
  process.exit(1);
});
