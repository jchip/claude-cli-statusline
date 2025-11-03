#!/usr/bin/env bun
/**
 * Claude CLI statusline
 * Displays: model · root dir · relative cwd · git branch · context remaining %
 */

import { loadConfig } from "./src/config";
import { getContextInfo } from "./src/context";
import { formatStatusLine } from "./src/formatter";
import type { StatusLineInput } from "./src/types";

async function main() {
  // Read input from stdin
  const input: StatusLineInput = await new Response(process.stdin)
    .json()
    .catch(() => ({} as any));

  // Parse --config CLI flag (if specified, use it; otherwise use default)
  const configArg = process.argv.find((arg) => arg.startsWith("--config="));
  const configFile = configArg?.split("=")[1] || "statusline-config.json";

  // Load config fresh on each run (allows dynamic changes)
  const projectDir = input?.workspace?.project_dir;
  const config = loadConfig(projectDir, configFile);

  // Save sample input for debugging if enabled in config or via CLI flag
  const saveSampleArg = process.argv.find((arg) =>
    arg.startsWith("--save-sample")
  );
  if (config["save-sample"].enable || saveSampleArg) {
    try {
      let filename = config["save-sample"].filename;
      if (saveSampleArg && saveSampleArg.includes("=")) {
        filename = saveSampleArg.split("=")[1];
      }
      const samplePath = import.meta.dir + "/" + filename;
      await Bun.write(samplePath, JSON.stringify(input, null, 2));
    } catch {
      // Ignore errors
    }
  }

  // Get context level thresholds from config, can be overridden by CLI flag
  let [greenThreshold, yellowThreshold, orangeThreshold] =
    config["context-color-levels"];

  // CLI flag overrides config
  const contextLevelsArg = process.argv.find((arg) =>
    arg.startsWith("--context-levels=")
  );
  if (contextLevelsArg) {
    try {
      const values = contextLevelsArg
        .split("=")[1]
        .split(",")
        .map((v) => parseInt(v.trim()));
      if (
        values.length === 3 &&
        values.every((v) => !isNaN(v) && v >= 0 && v <= 100)
      ) {
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

  // Get context percentage, used tokens, compact status, and cache saver
  const {
    percentage: pct,
    usedTokens,
    compactOccurred,
    saveCache,
  } = getContextInfo(config, input);

  // Format and output statusline
  const statusLine = formatStatusLine(
    config,
    input,
    pct,
    [greenThreshold, yellowThreshold, orangeThreshold],
    usedTokens,
    compactOccurred
  );

  // Save the statusline output to cache for debugging
  saveCache(statusLine);

  console.log(statusLine);
}

// Run main function
main();
