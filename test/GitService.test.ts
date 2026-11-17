import { describe, test, expect } from "bun:test";
import { GitService } from "../src/services/GitService.ts";
import { writeFileSync, mkdirSync, rmSync, existsSync, mkdtempSync, statSync, utimesSync } from "fs";
import { spawnSync } from "child_process";
import { tmpdir } from "os";
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
    test("never writes the index (no optional lock)", () => {
      // A plain `git status` refreshes stale stat info and rewrites .git/index,
      // taking .git/index.lock while it does. The status line runs constantly,
      // so it must not take that lock and collide with the user's git commands.
      const dir = mkdtempSync(join(tmpdir(), "statusline-lock-"));
      try {
        const git = (...args: string[]) => {
          const env = { ...process.env };
          delete env.GIT_OPTIONAL_LOCKS;
          const r = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd: dir, env });
          expect(r.status).toBe(0);
        };
        git("init", "-q");
        writeFileSync(join(dir, "a.txt"), "hello\n");
        git("add", "a.txt");
        git("commit", "-q", "-m", "init");
        // Same content, older mtime: the index's stat info is now stale.
        const past = new Date(Date.now() - 3600_000);
        utimesSync(join(dir, "a.txt"), past, past);
        const indexPath = join(dir, ".git", "index");
        const before = statSync(indexPath).mtimeMs;

        const status = GitService.getGitStatus(dir);

        expect(status.isClean).toBe(true);
        expect(statSync(indexPath).mtimeMs).toBe(before);
        expect(existsSync(join(dir, ".git", "index.lock"))).toBe(false);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

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
