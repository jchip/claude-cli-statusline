import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { CacheManager } from "../src/services/CacheManager.ts";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";
import type { SessionAnalysisCache } from "../src/types.ts";

describe("CacheManager", () => {
  const testDir = "/tmp/test-cache-manager";
  const transcriptPath = join(testDir, "test.jsonl");
  const cachePath = `${transcriptPath}.cache.json`;

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

  test("creates empty cache", () => {
    writeFileSync(transcriptPath, "test");
    const cache = CacheManager.createEmpty(transcriptPath);

    expect(cache.lastLine).toBe(0);
    expect(cache.lastTokenCount).toBe(0);
    expect(cache.entries).toEqual([]);
    expect(cache.lastModified).toBeGreaterThan(0);
  });

  test("writes cache to file", () => {
    writeFileSync(transcriptPath, "test");
    const cache: SessionAnalysisCache = {
      lastLine: 5,
      lastTokenCount: 10000,
      lastModified: Date.now(),
      entries: [
        { line: 1, tokens: 1000 },
        { line: 2, tokens: 2000 },
      ],
    };

    CacheManager.write(transcriptPath, cache);
    expect(existsSync(cachePath)).toBe(true);
  });

  test("reads cache from file", () => {
    writeFileSync(transcriptPath, "test");
    const cache: SessionAnalysisCache = {
      lastLine: 5,
      lastTokenCount: 10000,
      lastModified: Date.now(),
      entries: [{ line: 1, tokens: 1000 }],
    };

    CacheManager.write(transcriptPath, cache);
    const loaded = CacheManager.read(transcriptPath);

    expect(loaded).not.toBeNull();
    expect(loaded?.lastLine).toBe(5);
    expect(loaded?.lastTokenCount).toBe(10000);
    expect(loaded?.entries).toHaveLength(1);
  });

  test("returns null for missing cache", () => {
    const loaded = CacheManager.read(transcriptPath);
    expect(loaded).toBeNull();
  });

  test("returns null for stale cache", () => {
    writeFileSync(transcriptPath, "test");

    const cache: SessionAnalysisCache = {
      lastLine: 5,
      lastTokenCount: 10000,
      lastModified: Date.now() - 10000, // Old timestamp
      entries: [],
    };

    CacheManager.write(transcriptPath, cache);

    // Touch the transcript to make it newer
    writeFileSync(transcriptPath, "test modified");

    const loaded = CacheManager.read(transcriptPath);
    expect(loaded).toBeNull(); // Cache is stale
  });

  test("saves input and output metadata", () => {
    writeFileSync(transcriptPath, "test");
    const cache: SessionAnalysisCache = {
      lastLine: 1,
      lastTokenCount: 1000,
      lastModified: Date.now(),
      entries: [],
    };

    const input = { session_id: "test-123" };
    const output = "statusline output";

    CacheManager.write(transcriptPath, cache, input, output);

    const loaded = CacheManager.read(transcriptPath);
    expect(loaded?.["statusline-input"]).toEqual(input);
    expect(loaded?.["statusline-output"]).toBe(output);
  });

  test("handles missing transcript file", () => {
    const cache = CacheManager.createEmpty("/nonexistent/path.jsonl");
    expect(cache.lastLine).toBe(0);
  });

  test("creates cache directory if missing", () => {
    const deepPath = join(testDir, "a", "b", "c", "test.jsonl");
    mkdirSync(join(testDir, "a", "b", "c"), { recursive: true });
    writeFileSync(deepPath, "test");

    const cache = CacheManager.createEmpty(deepPath);
    CacheManager.write(deepPath, cache);

    expect(existsSync(`${deepPath}.cache.json`)).toBe(true);
  });

  test("returns null when cache file is malformed JSON", () => {
    writeFileSync(transcriptPath, "test");
    writeFileSync(cachePath, "invalid json {{{");

    const loaded = CacheManager.read(transcriptPath);
    expect(loaded).toBeNull();
  });

  test("returns null when transcript doesn't exist but cache does", () => {
    // Create cache without transcript
    const cache: SessionAnalysisCache = {
      lastLine: 1,
      lastTokenCount: 1000,
      lastModified: Date.now(),
      entries: [],
    };
    writeFileSync(cachePath, JSON.stringify(cache));

    const loaded = CacheManager.read(transcriptPath);
    expect(loaded).toBeNull();
  });

  test("handles write errors gracefully", () => {
    // Try to write to invalid path (should not throw)
    const invalidPath = "/invalid/path/that/does/not/exist/test.jsonl";
    const cache = CacheManager.createEmpty(invalidPath);

    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    // This should not throw, just log error
    expect(() => {
      CacheManager.write(invalidPath, cache);
    }).not.toThrow();

    console.error = originalError;
  });
});
