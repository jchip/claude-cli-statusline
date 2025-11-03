import { describe, it, expect, mock } from "bun:test";
import {
  percentFromObject,
  findPercentRecursive,
  getContextInfo,
  tryFromTranscript,
  getContextPercentage,
} from "../src/context";
import type { Config } from "../src/types";
import { writeFileSync, mkdirSync, unlinkSync, rmdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const mockConfig: Config = {
  "context-color-levels": [65, 45, 20],
  "model-context-windows": {
    "claude-3-5-sonnet-20241022": 200000,
  },
  "display-name-model-context-windows": {},
  "default-context-window": 200000,
  "compact-buffer": 45000,
  "save-sample": {
    enable: false,
    filename: "sample-input.json",
  },
};

describe("context", () => {
  describe("percentFromObject", () => {
    it("should return null for non-objects", () => {
      expect(percentFromObject(null)).toBe(null);
      expect(percentFromObject("string")).toBe(null);
      expect(percentFromObject(42)).toBe(null);
    });

    it("should extract from remaining_percent keys", () => {
      expect(percentFromObject({ remaining_percent: 75 })).toBe(75);
      expect(percentFromObject({ remainingPercent: 50 })).toBe(50);
    });

    it("should calculate from remaining/max tokens", () => {
      expect(
        percentFromObject({
          remaining_context_tokens: 150000,
          max_context_tokens: 200000,
        })
      ).toBe(75);
    });

    it("should calculate from used/max tokens", () => {
      expect(
        percentFromObject({
          used_context_tokens: 50000,
          max_context_tokens: 200000,
        })
      ).toBe(75);
    });

    it("should handle available_context_tokens", () => {
      expect(
        percentFromObject({
          available_context_tokens: 150000,
          max_context_tokens: 200000,
        })
      ).toBe(75);
    });

    it("should clamp values to 0-100", () => {
      expect(percentFromObject({ remaining_percent: 150 })).toBe(100);
      expect(percentFromObject({ remaining_percent: -10 })).toBe(0);
    });
  });

  describe("findPercentRecursive", () => {
    it("should find percent in nested objects", () => {
      const obj = {
        budget: {
          remaining_percent: 80,
        },
      };
      expect(findPercentRecursive(obj)).toBe(80);
    });

    it("should return null if not found within depth limit", () => {
      const deepObj = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: { level6: { level7: { remaining_percent: 50 } } },
              },
            },
          },
        },
      };
      expect(findPercentRecursive(deepObj)).toBe(null);
    });

    it("should return null for non-objects", () => {
      expect(findPercentRecursive("string")).toBe(null);
    });
  });

  describe("getContextInfo", () => {
    it("should extract from budget field", () => {
      const input = {
        budget: {
          remaining_context_tokens: 150000,
          max_context_tokens: 200000,
        },
      };
      const result = getContextInfo(mockConfig, input);
      expect(result.percentage).toBe(75);
      expect(result.usedTokens).toBe(0);
      expect(result.compactOccurred).toBe(false);
    });

    it("should extract from cost field", () => {
      const input = {
        cost: {
          remaining_percent: 60,
        },
      };
      const result = getContextInfo(mockConfig, input);
      expect(result.percentage).toBe(60);
      expect(result.usedTokens).toBe(0);
      expect(result.compactOccurred).toBe(false);
    });

    it("should recursively search all fields", () => {
      const input = {
        some: {
          nested: {
            data: {
              remaining_context_tokens: 100000,
              max_context_tokens: 200000,
            },
          },
        },
      };
      const result = getContextInfo(mockConfig, input);
      expect(result.percentage).toBe(50);
      expect(result.usedTokens).toBe(0);
      expect(result.compactOccurred).toBe(false);
    });

    it("should return null when no context data found", () => {
      const input = { some: "data" };
      const result = getContextInfo(mockConfig, input);
      expect(result.percentage).toBe(null);
      expect(result.usedTokens).toBe(0);
      expect(result.compactOccurred).toBe(false);
    });

    it("should extract context from transcript file", () => {
      const tempDir = tmpdir();
      const transcriptPath = join(tempDir, "test-transcript.jsonl");

      // Create a mock transcript with usage data
      const transcriptData = [
        JSON.stringify({
          type: "user",
          message: { content: "test" },
        }),
        JSON.stringify({
          type: "assistant",
          message: {
            usage: {
              input_tokens: 100,
              cache_creation_input_tokens: 50,
              cache_read_input_tokens: 25,
            },
          },
        }),
      ].join("\n");

      writeFileSync(transcriptPath, transcriptData);

      const input = { transcript_path: transcriptPath };
      const result = getContextInfo(mockConfig, input);

      // Should calculate: (200000 - 175) / 200000 * 100 = 99.91%
      expect(result.percentage).toBeCloseTo(99.91, 2);
      expect(result.usedTokens).toBe(175);
      expect(result.compactOccurred).toBe(false);

      // Cleanup
      unlinkSync(transcriptPath);
    });

    it("should handle transcript with compact boundary", () => {
      const tempDir = tmpdir();
      const transcriptPath = join(tempDir, "test-transcript-compact.jsonl");

      const transcriptData = [
        JSON.stringify({
          type: "system",
          subtype: "compact_boundary",
          compactMetadata: { trigger: "manual", preTokens: 150000 },
        }),
        JSON.stringify({
          type: "assistant",
          message: {
            usage: {
              input_tokens: 100,
              cache_creation_input_tokens: 50,
              cache_read_input_tokens: 25,
            },
          },
        }),
      ].join("\n");

      writeFileSync(transcriptPath, transcriptData);

      const input = { transcript_path: transcriptPath };
      const result = getContextInfo(mockConfig, input);

      expect(result.compactOccurred).toBe(true);
      expect(result.usedTokens).toBe(175);

      // Cleanup
      unlinkSync(transcriptPath);
    });

    it("should handle transcript read errors gracefully", () => {
      const input = { transcript_path: "/nonexistent/path.jsonl" };
      const result = getContextInfo(mockConfig, input);

      expect(result.percentage).toBe(null);
      expect(result.usedTokens).toBe(0);
      expect(result.compactOccurred).toBe(false);
    });

    it("should handle malformed transcript lines", () => {
      const tempDir = tmpdir();
      const transcriptPath = join(tempDir, "test-malformed.jsonl");

      const transcriptData = [
        "invalid json line",
        JSON.stringify({
          type: "assistant",
          message: {
            usage: {
              input_tokens: 100,
            },
          },
        }),
      ].join("\n");

      writeFileSync(transcriptPath, transcriptData);

      const input = { transcript_path: transcriptPath };
      const result = getContextInfo(mockConfig, input);

      expect(result.percentage).toBeCloseTo(99.95, 2);
      expect(result.usedTokens).toBe(100);

      // Cleanup
      unlinkSync(transcriptPath);
    });

    it("should handle transcript with zero token entries", () => {
      const tempDir = tmpdir();
      const transcriptPath = join(tempDir, "test-zero-tokens.jsonl");

      const transcriptData = [
        JSON.stringify({
          type: "tool_use",
          message: {
            usage: {
              input_tokens: 0,
              cache_creation_input_tokens: 0,
              cache_read_input_tokens: 0,
            },
          },
        }),
        JSON.stringify({
          type: "assistant",
          message: {
            usage: {
              input_tokens: 50,
              cache_creation_input_tokens: 25,
              cache_read_input_tokens: 10,
            },
          },
        }),
      ].join("\n");

      writeFileSync(transcriptPath, transcriptData);

      const input = { transcript_path: transcriptPath };
      const result = getContextInfo(mockConfig, input);

      expect(result.percentage).toBeCloseTo(99.9575, 2);
      expect(result.usedTokens).toBe(85);

      // Cleanup
      unlinkSync(transcriptPath);
    });

    it("should handle transcript with only zero token entries", () => {
      const tempDir = tmpdir();
      const transcriptPath = join(tempDir, "test-only-zero.jsonl");

      const transcriptData = [
        JSON.stringify({
          type: "tool_use",
          message: {
            usage: {
              input_tokens: 0,
              cache_creation_input_tokens: 0,
              cache_read_input_tokens: 0,
            },
          },
        }),
      ].join("\n");

      writeFileSync(transcriptPath, transcriptData);

      const input = { transcript_path: transcriptPath };
      const result = getContextInfo(mockConfig, input);

      expect(result.percentage).toBe(null);
      expect(result.usedTokens).toBe(0);

      // Cleanup
      unlinkSync(transcriptPath);
    });

    it("should handle transcript with cache entries having compact detection", () => {
      const tempDir = tmpdir();
      const transcriptPath = join(tempDir, "test-cache-compact.jsonl");

      // Create transcript
      const transcriptData = [
        JSON.stringify({
          type: "assistant",
          message: {
            usage: {
              input_tokens: 100000, // High token count
            },
          },
        }),
        JSON.stringify({
          type: "assistant",
          message: {
            usage: {
              input_tokens: 10000, // Much lower (70% drop)
            },
          },
        }),
      ].join("\n");

      writeFileSync(transcriptPath, transcriptData);

      // Create cache with the high token count first
      const cacheDir = join(tempDir, ".statusline");
      mkdirSync(cacheDir, { recursive: true });
      const cachePath = join(cacheDir, "test-cache-compact.jsonl.cache.json");
      const cacheData = {
        lastLine: 1,
        lastTokenCount: 100000,
        lastModified: Date.now(),
        entries: [{ line: 1, tokens: 100000 }],
      };
      writeFileSync(cachePath, JSON.stringify(cacheData));

      const input = { transcript_path: transcriptPath };
      const result = getContextInfo(mockConfig, input);

      expect(result.compactOccurred).toBe(false);
      expect(result.usedTokens).toBe(10000);

      // Cleanup
      unlinkSync(transcriptPath);
      rmdirSync(cacheDir, { recursive: true });
    });
  });

  describe("tryFromTranscript", () => {
    it("should return null when transcript path is undefined", () => {
      const result = tryFromTranscript(mockConfig, undefined);
      expect(result).toBe(null);
    });

    it("should handle transcript read errors", () => {
      const result = tryFromTranscript(mockConfig, "/nonexistent/path.jsonl");
      expect(result).toBe(null);
    });
  });

  describe("getContextPercentage", () => {
    it("should return percentage from getContextInfo", () => {
      const input = {
        budget: {
          remaining_context_tokens: 150000,
          max_context_tokens: 200000,
        },
      };
      const result = getContextPercentage(mockConfig, input);
      expect(result).toBe(75);
    });

    it("should return null when no context data found", () => {
      const input = { some: "data" };
      const result = getContextPercentage(mockConfig, input);
      expect(result).toBe(null);
    });
  });
});
