import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { gitBranch, gitRepoName } from "../src/git";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

describe("git", () => {
  const testDir = "/tmp/git-test";

  beforeEach(() => {
    // Clean up and create test directory
    const { rmSync, mkdirSync } = require("fs");
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    const { rmSync } = require("fs");
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {}
  });

  describe("gitBranch", () => {
    it("should return ∅ when git command fails", () => {
      const result = gitBranch("/nonexistent/directory");
      expect(result).toBe("∅");
    });

    it("should return ∅ when not in git repository", () => {
      const result = gitBranch(testDir);
      expect(result).toBe("∅");
    });
  });

  describe("gitRepoName", () => {
    it("should return empty string when not in git repository", () => {
      const result = gitRepoName(testDir);
      expect(result).toBe("");
    });
  });

  describe("git branch fallback behavior", () => {
    it("should fallback to transcript when git command fails", () => {
      // Test that gitBranch handles transcript path parameter
      const result = gitBranch(
        "/nonexistent/directory",
        "/nonexistent/transcript.jsonl"
      );
      expect(result).toBe("∅");
    });

    it("should extract branch from transcript file", () => {
      const transcriptPath = join(testDir, "transcript.jsonl");
      const transcriptData = [
        JSON.stringify({ type: "user", message: { content: "test" } }),
        JSON.stringify({
          type: "user",
          message: { content: "test" },
          gitBranch: "feature/test-branch",
        }),
      ].join("\n");

      writeFileSync(transcriptPath, transcriptData);

      const result = gitBranch("/nonexistent/directory", transcriptPath);
      expect(result).toBe("feature/test-branch");
    });

    it("should handle transcript read errors gracefully", () => {
      const result = gitBranch(
        "/nonexistent/directory",
        "/nonexistent/transcript.jsonl"
      );
      expect(result).toBe("∅");
    });

    it("should handle malformed transcript lines", () => {
      const transcriptPath = join(testDir, "malformed-transcript.jsonl");
      const transcriptData = [
        "invalid json line",
        JSON.stringify({
          type: "user",
          message: { content: "test" },
          gitBranch: "main",
        }),
      ].join("\n");

      writeFileSync(transcriptPath, transcriptData);

      const result = gitBranch("/nonexistent/directory", transcriptPath);
      expect(result).toBe("main");
    });
  });
});
