import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { SessionAnalyzer } from "../src/services/SessionAnalyzer.ts";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";

describe("SessionAnalyzer", () => {
  const testDir = "/tmp/test-session-analyzer";
  const transcriptPath = join(testDir, "test.jsonl");

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  test("analyzes transcript with token usage", () => {
    const lines = [
      JSON.stringify({
        type: "user",
        message: { role: "user", content: "Hello" },
      }),
      JSON.stringify({
        type: "assistant",
        message: {
          role: "assistant",
          content: "Hi",
          usage: {
            input_tokens: 1000,
            cache_creation_input_tokens: 500,
            cache_read_input_tokens: 200,
            output_tokens: 50,
          },
        },
      }),
    ];

    writeFileSync(transcriptPath, lines.join("\n"));

    const result = SessionAnalyzer.analyzeTranscript(transcriptPath);
    expect(result.usedTokens).toBe(1700); // 1000 + 500 + 200
    expect(result.compactOccurred).toBe(false);
  });

  test("detects compact boundary", () => {
    const lines = [
      JSON.stringify({
        type: "assistant",
        message: {
          usage: { input_tokens: 100000, cache_creation_input_tokens: 0 },
        },
      }),
      JSON.stringify({
        type: "system",
        subtype: "compact_boundary",
        compactMetadata: {
          trigger: "auto",
          preTokens: 100000,
          postTokens: 20000,
        },
      }),
    ];

    writeFileSync(transcriptPath, lines.join("\n"));

    const result = SessionAnalyzer.analyzeTranscript(transcriptPath);
    expect(result.usedTokens).toBe(20000);
    expect(result.compactOccurred).toBe(true);
  });

  test("detects implicit compact (>30% drop)", () => {
    const lines = [
      JSON.stringify({
        type: "assistant",
        message: {
          usage: { input_tokens: 100000 },
        },
      }),
      JSON.stringify({
        type: "assistant",
        message: {
          usage: { input_tokens: 50000 }, // 50% drop
        },
      }),
    ];

    writeFileSync(transcriptPath, lines.join("\n"));

    const result = SessionAnalyzer.analyzeTranscript(transcriptPath);
    expect(result.compactOccurred).toBe(true);
  });

  test("handles empty transcript", () => {
    writeFileSync(transcriptPath, "");

    const result = SessionAnalyzer.analyzeTranscript(transcriptPath);
    expect(result.usedTokens).toBe(0);
    expect(result.compactOccurred).toBe(false);
  });

  test("skips invalid JSON lines", () => {
    const lines = [
      "invalid json",
      JSON.stringify({
        type: "assistant",
        message: { usage: { input_tokens: 1000 } },
      }),
    ];

    writeFileSync(transcriptPath, lines.join("\n"));

    const result = SessionAnalyzer.analyzeTranscript(transcriptPath);
    expect(result.usedTokens).toBe(1000);
  });

  test("incremental analysis from cache", () => {
    // Create initial transcript
    const initialLines = [
      JSON.stringify({
        type: "assistant",
        message: { usage: { input_tokens: 1000 } },
      }),
    ];
    writeFileSync(transcriptPath, initialLines.join("\n"));

    // First analysis
    const result1 = SessionAnalyzer.analyzeTranscript(transcriptPath);
    expect(result1.usedTokens).toBe(1000);
    expect(result1.cache.lastLine).toBe(1);

    // Append new lines
    const newLines = [
      JSON.stringify({
        type: "assistant",
        message: { usage: { input_tokens: 1500 } },
      }),
    ];
    writeFileSync(transcriptPath, [...initialLines, ...newLines].join("\n"));

    // Second analysis should be incremental
    const result2 = SessionAnalyzer.analyzeTranscript(transcriptPath);
    expect(result2.usedTokens).toBe(1500);
    expect(result2.cache.lastLine).toBe(2);
  });

  test("handles usage at top level", () => {
    const lines = [
      JSON.stringify({
        type: "assistant",
        usage: { input_tokens: 1000 }, // Top-level usage
      }),
    ];

    writeFileSync(transcriptPath, lines.join("\n"));

    const result = SessionAnalyzer.analyzeTranscript(transcriptPath);
    expect(result.usedTokens).toBe(1000);
  });
});
