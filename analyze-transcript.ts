#!/usr/bin/env bun
/**
 * Analyze a transcript file to find token-related fields
 * Usage: bun analyze-transcript.ts /path/to/transcript.json
 */

import { readFileSync } from "fs";

const transcriptPath = process.argv[2];

if (!transcriptPath) {
  console.error("Usage: bun analyze-transcript.ts /path/to/transcript.json");
  process.exit(1);
}

try {
  const raw = readFileSync(transcriptPath, "utf8");
  const json = JSON.parse(raw);

  console.log("\n=== TRANSCRIPT ANALYSIS ===\n");

  // Function to find all keys containing certain keywords
  function findKeysRecursive(obj: any, keywords: string[], path = ""): void {
    if (!obj || typeof obj !== "object") return;

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Check if key contains any keyword
      const keyLower = key.toLowerCase();
      const hasKeyword = keywords.some(kw => keyLower.includes(kw.toLowerCase()));

      if (hasKeyword) {
        console.log(`\n📍 Found: ${currentPath}`);
        console.log(`   Type: ${typeof value}`);
        console.log(`   Value: ${JSON.stringify(value).slice(0, 100)}`);
      }

      // Recurse into objects and arrays
      if (typeof value === "object" && value !== null) {
        findKeysRecursive(value, keywords, currentPath);
      }
    }
  }

  // Search for token-related fields
  const keywords = ["token", "budget", "context", "usage", "remaining", "max", "limit"];
  console.log("Searching for fields containing:", keywords.join(", "));
  console.log("─".repeat(60));

  findKeysRecursive(json, keywords);

  // Also show the top-level structure
  console.log("\n" + "─".repeat(60));
  console.log("\n📋 Top-level keys:");
  Object.keys(json).forEach(key => {
    console.log(`   - ${key} (${typeof json[key]})`);
  });

  // If there's a messages array, show info about it
  if (Array.isArray(json.messages)) {
    console.log(`\n💬 Messages array: ${json.messages.length} messages`);
    if (json.messages.length > 0) {
      console.log("\n   Last message keys:");
      const lastMsg = json.messages[json.messages.length - 1];
      Object.keys(lastMsg).forEach(key => {
        console.log(`   - ${key} (${typeof lastMsg[key]})`);
      });
    }
  }

  console.log("\n=== END ANALYSIS ===\n");

} catch (error) {
  console.error("Error reading transcript:", error);
  process.exit(1);
}
