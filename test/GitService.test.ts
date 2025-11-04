import { describe, test, expect } from "bun:test";
import { GitService } from "../src/services/GitService.ts";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";

describe("GitService", () => {
  test("gets branch from command for valid git directory", () => {
    const branch = GitService.getBranchFromCommand(process.cwd());
    expect(branch).not.toBeNull();
    expect(typeof branch).toBe("string");
  });

  test("returns null for non-git directory", () => {
    const branch = GitService.getBranchFromCommand("/tmp");
    expect(branch).toBeNull();
  });

  test("gets repo name from command for valid git directory", () => {
    const repoName = GitService.getRepoNameFromCommand(process.cwd());
    expect(repoName).not.toBeNull();
    expect(typeof repoName).toBe("string");
  });

  test("returns null repo name for non-git directory", () => {
    const repoName = GitService.getRepoNameFromCommand("/tmp");
    expect(repoName).toBeNull();
  });

  test("gets branch from transcript file", () => {
    const testDir = "/tmp/test-git-service";
    const transcriptPath = join(testDir, "test.jsonl");

    // Cleanup if exists
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });

    // Create transcript with gitBranch
    const lines = [
      JSON.stringify({ type: "message", content: "test" }),
      JSON.stringify({ type: "user", gitBranch: "feature-branch" }),
    ];
    writeFileSync(transcriptPath, lines.join("\n"));

    const branch = GitService.getBranchFromTranscript(transcriptPath);
    expect(branch).toBe("feature-branch");

    // Cleanup
    rmSync(testDir, { recursive: true });
  });

  test("returns null for non-existent transcript", () => {
    const branch = GitService.getBranchFromTranscript("/non/existent/file.jsonl");
    expect(branch).toBeNull();
  });

  test("returns null for transcript without gitBranch", () => {
    const testDir = "/tmp/test-git-service-2";
    const transcriptPath = join(testDir, "test.jsonl");

    // Cleanup if exists
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });

    // Create transcript without gitBranch
    const lines = [
      JSON.stringify({ type: "message", content: "test" }),
      JSON.stringify({ type: "user", content: "hello" }),
    ];
    writeFileSync(transcriptPath, lines.join("\n"));

    const branch = GitService.getBranchFromTranscript(transcriptPath);
    expect(branch).toBeNull();

    // Cleanup
    rmSync(testDir, { recursive: true });
  });

  test("handles malformed JSON in transcript", () => {
    const testDir = "/tmp/test-git-service-3";
    const transcriptPath = join(testDir, "test.jsonl");

    // Cleanup if exists
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });

    // Create transcript with invalid JSON
    writeFileSync(transcriptPath, "invalid json\n{valid: but no gitBranch}");

    const branch = GitService.getBranchFromTranscript(transcriptPath);
    expect(branch).toBeNull();

    // Cleanup
    rmSync(testDir, { recursive: true });
  });
});
