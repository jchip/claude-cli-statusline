#!/usr/bin/env bun
/**
 * Debug script to show what data is passed to statusline
 * Run this as your statusline temporarily to see the actual JSON structure
 */

const input = await new Response(process.stdin).json().catch(() => ({} as any));

console.log("\n=== STATUSLINE INPUT DEBUG ===");
console.log(JSON.stringify(input, null, 2));
console.log("=== END DEBUG ===\n");

// Also show what we'd display normally
const model = input?.model?.display_name || input?.model?.id || "model";
console.log(`\nModel: ${model}`);
console.log(`Budget field: ${input?.budget ? JSON.stringify(input.budget) : "NOT FOUND"}`);
console.log(`Transcript path: ${input?.transcript_path || "NOT PROVIDED"}`);
