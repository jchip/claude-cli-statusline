import { describe, test, expect } from "bun:test";
import { GitService } from "../src/services/GitService.ts";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";

describe("GitService", () => {
  describe("findGitDir", () => {
    test("finds .git in current directory", () => {
      const gitDir = GitService.findGitDir(process.cwd());
      expect(gitDir).not.toBeNull();
      expect(gitDir).toContain(".git");
    });

    test("finds .git when starting from subdirectory", () => {
      const gitDir = GitService.findGitDir(join(process.cwd(), "src"));
      expect(gitDir).not.toBeNull();
      expect(gitDir).toContain(".git");
    });

    test("returns null for non-git directory", () => {
      const gitDir = GitService.findGitDir("/tmp");
      expect(gitDir).toBeNull();
    });
  });

  describe("getRepoNameFromConfig", () => {
    test("gets repo name from .git/config", () => {
      const gitDir = GitService.findGitDir(process.cwd());
      expect(gitDir).not.toBeNull();
      const repoName = GitService.getRepoNameFromConfig(gitDir!);
      expect(repoName).toBe("claude-cli-statusline");
    });

    test("returns null for invalid gitDir", () => {
      const repoName = GitService.getRepoNameFromConfig("/tmp/nonexistent");
      expect(repoName).toBeNull();
    });
  });

  describe("getGitStatus", () => {
    test("gets full status for valid git directory", () => {
      const status = GitService.getGitStatus(process.cwd());
      expect(status.branch).not.toBeNull();
      expect(status.gitDir).not.toBeNull();
      expect(typeof status.isClean).toBe("boolean");
      expect(typeof status.hasStaged).toBe("boolean");
    });

    test("returns null branch for non-git directory", () => {
      const status = GitService.getGitStatus("/tmp");
      expect(status.branch).toBeNull();
      expect(status.gitDir).toBeNull();
    });

    test("returns all fields in single call", () => {
      const status = GitService.getGitStatus(process.cwd());
      expect(status).toHaveProperty("branch");
      expect(status).toHaveProperty("isClean");
      expect(status).toHaveProperty("hasStaged");
      expect(status).toHaveProperty("repoName");
      expect(status).toHaveProperty("gitDir");
    });
  });

  describe("getBranchFromTranscript", () => {
    test("gets branch from transcript file", () => {
      const testDir = "/tmp/test-git-service";
      const transcriptPath = join(testDir, "test.jsonl");

      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true });
      }
      mkdirSync(testDir, { recursive: true });

      const lines = [
        JSON.stringify({ type: "message", content: "test" }),
        JSON.stringify({ type: "user", gitBranch: "feature-branch" }),
      ];
      writeFileSync(transcriptPath, lines.join("\n"));

      const branch = GitService.getBranchFromTranscript(transcriptPath);
      expect(branch).toBe("feature-branch");

      rmSync(testDir, { recursive: true });
    });

    test("returns null for non-existent transcript", () => {
      const branch = GitService.getBranchFromTranscript("/non/existent/file.jsonl");
      expect(branch).toBeNull();
    });

    test("returns null for transcript without gitBranch", () => {
      const testDir = "/tmp/test-git-service-2";
      const transcriptPath = join(testDir, "test.jsonl");

      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true });
      }
      mkdirSync(testDir, { recursive: true });

      const lines = [
        JSON.stringify({ type: "message", content: "test" }),
        JSON.stringify({ type: "user", content: "hello" }),
      ];
      writeFileSync(transcriptPath, lines.join("\n"));

      const branch = GitService.getBranchFromTranscript(transcriptPath);
      expect(branch).toBeNull();

      rmSync(testDir, { recursive: true });
    });

    test("handles malformed JSON in transcript", () => {
      const testDir = "/tmp/test-git-service-3";
      const transcriptPath = join(testDir, "test.jsonl");

      if (existsSync(testDir)) {
        rmSync(testDir, { recursive: true });
      }
      mkdirSync(testDir, { recursive: true });

      writeFileSync(transcriptPath, "invalid json\n{valid: but no gitBranch}");

      const branch = GitService.getBranchFromTranscript(transcriptPath);
      expect(branch).toBeNull();

      rmSync(testDir, { recursive: true });
    });
  });
});
