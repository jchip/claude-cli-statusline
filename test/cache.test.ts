import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { readCache, writeCache } from "../src/cache";
import { mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";

const testDir = "/tmp/cache-test";
const testTranscript = join(testDir, "transcript.jsonl");

describe("cache", () => {
  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("readCache", () => {
    it("should return null when cache doesn't exist", () => {
      const result = readCache(testTranscript);
      expect(result).toBe(null);
    });

    it("should return null when transcript is newer than cache", () => {
      // Create the transcript file first
      const fs = require("fs");
      fs.writeFileSync(testTranscript, "test");

      // Create cache
      writeCache(testTranscript, 10, 50000, [{ line: 1, tokens: 50000 }]);

      // Sleep for 1ms to ensure different timestamp
      const start = Date.now();
      while (Date.now() === start) {}

      // Modify transcript timestamp to be newer by changing its content
      fs.writeFileSync(testTranscript, "modified content");

      const result = readCache(testTranscript);
      expect(result).toBe(null);
    });

    it("should handle cache read errors gracefully", () => {
      // Create the transcript file first
      const fs = require("fs");
      fs.writeFileSync(testTranscript, "test");

      // Create cache
      writeCache(testTranscript, 10, 50000, [{ line: 1, tokens: 50000 }]);

      // Corrupt the cache file
      const cacheDir = join(testDir, ".statusline");
      const cacheFile = join(cacheDir, "transcript.jsonl.cache.json");
      fs.writeFileSync(cacheFile, "invalid json");

      const result = readCache(testTranscript);
      expect(result).toBe(null);
    });
  });

  describe("writeCache", () => {
    it("should create cache directory and file", () => {
      // Create the transcript file first since writeCache needs it for statSync
      const fs = require("fs");
      fs.writeFileSync(testTranscript, "test transcript");

      const entries = [{ line: 1, tokens: 50000 }];
      writeCache(testTranscript, 10, 50000, entries);

      const cacheDir = join(testDir, ".statusline");
      expect(existsSync(cacheDir)).toBe(true);

      const cacheFile = join(cacheDir, "transcript.jsonl.cache.json");
      expect(existsSync(cacheFile)).toBe(true);
    });

    it("should write cache data correctly", () => {
      // Create the transcript file first
      const fs = require("fs");
      fs.writeFileSync(testTranscript, "test transcript");

      const entries = [
        { line: 1, tokens: 30000 },
        {
          line: 5,
          tokens: 50000,
          isCompact: true,
          compactTrigger: "auto" as const,
          preCompactTokens: 80000,
        },
      ];
      const statuslineInput = { test: "data" };
      const statuslineOutput = "📦 test output";

      writeCache(
        testTranscript,
        10,
        50000,
        entries,
        statuslineInput,
        statuslineOutput
      );

      const result = readCache(testTranscript);
      expect(result).not.toBe(null);
      expect(result!.lastLine).toBe(10);
      expect(result!.lastTokenCount).toBe(50000);
      expect(result!.entries).toEqual(entries);
      expect(result!["statusline-input"]).toEqual(statuslineInput);
      expect(result!["statusline-output"]).toEqual(statuslineOutput);
    });
  });

  describe("cache integration", () => {
    it("should read previously written cache", () => {
      // Create the transcript file first
      const fs = require("fs");
      fs.writeFileSync(testTranscript, "test transcript");

      const entries = [{ line: 1, tokens: 25000 }];
      writeCache(testTranscript, 5, 25000, entries);

      const result = readCache(testTranscript);
      expect(result).not.toBe(null);
      expect(result!.lastLine).toBe(5);
      expect(result!.lastTokenCount).toBe(25000);
      expect(result!.entries).toEqual(entries);
    });
  });
});
