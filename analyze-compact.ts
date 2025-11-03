#!/usr/bin/env bun
/**
 * Analyze JSONL transcript to understand auto-compact behavior
 */

import { readFileSync } from "fs";

const transcriptPath =
  process.argv[2] || "6ec59c23-a43e-49bc-a6a6-3cd430a74a05.jsonl";

try {
  const raw = readFileSync(transcriptPath, "utf8");
  const lines = raw.trim().split("\n");

  console.log(`Total lines in transcript: ${lines.length}\n`);

  let lineNum = 0;
  let previousTokens = 0;

  for (const line of lines) {
    lineNum++;
    try {
      const entry = JSON.parse(line);
      const usage = entry?.message?.usage;

      if (usage) {
        const inputTokens = usage.input_tokens || 0;
        const cacheCreation = usage.cache_creation_input_tokens || 0;
        const cacheRead = usage.cache_read_input_tokens || 0;
        const outputTokens = usage.output_tokens || 0;

        const totalContext = inputTokens + cacheCreation + cacheRead;

        // Detect potential auto-compact (significant drop in context tokens)
        if (previousTokens > 0 && totalContext < previousTokens * 0.5) {
          console.log(
            `\n🔄 POTENTIAL AUTO-COMPACT DETECTED at line ${lineNum}:`
          );
          console.log(
            `  Previous context: ${previousTokens.toLocaleString()} tokens`
          );
          console.log(`  New context: ${totalContext.toLocaleString()} tokens`);
          console.log(
            `  Drop: ${(
              previousTokens - totalContext
            ).toLocaleString()} tokens (${Math.round(
              (1 - totalContext / previousTokens) * 100
            )}%)`
          );
          console.log(
            `  Remaining %: ${Math.round(
              ((200000 - totalContext) / 200000) * 100
            )}%`
          );
        }

        // Show last 5 entries
        if (lineNum > lines.length - 5) {
          console.log(`\nLine ${lineNum}:`);
          console.log(`  Input tokens: ${inputTokens.toLocaleString()}`);
          console.log(`  Cache creation: ${cacheCreation.toLocaleString()}`);
          console.log(`  Cache read: ${cacheRead.toLocaleString()}`);
          console.log(`  Output tokens: ${outputTokens.toLocaleString()}`);
          console.log(`  Total context: ${totalContext.toLocaleString()}`);
          console.log(
            `  Remaining %: ${Math.round(
              ((200000 - totalContext) / 200000) * 100
            )}%`
          );
        }

        previousTokens = totalContext;
      }
    } catch (e) {
      // Skip malformed lines
    }
  }

  console.log(`\n✅ Analysis complete`);
} catch (error) {
  console.error("Error reading transcript:", error);
}
