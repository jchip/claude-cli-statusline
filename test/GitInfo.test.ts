import { describe, test, expect } from "bun:test";
import { GitInfo } from "../src/components/GitInfo.ts";

describe("GitInfo", () => {
  test("creates GitInfo with repo name and branch", () => {
    const git = new GitInfo("my-repo", "main", "project");
    expect(git.repoName).toBe("my-repo");
    expect(git.branch).toBe("main");
    expect(git.projectDirBasename).toBe("project");
  });

  test("creates GitInfo with working tree status", () => {
    const git = new GitInfo("my-repo", "main", "project", false, true);
    expect(git.isClean).toBe(true);

    const gitDirty = new GitInfo("my-repo", "main", "project", false, false);
    expect(gitDirty.isClean).toBe(false);

    const gitNoStatus = new GitInfo("my-repo", "main", "project", false, null);
    expect(gitNoStatus.isClean).toBeNull();
  });

  test("hasGit returns true when branch exists", () => {
    const git = new GitInfo("repo", "main", "project");
    expect(git.hasGit).toBe(true);
  });

  test("hasGit returns false when branch is null", () => {
    const git = new GitInfo(null, null, "project");
    expect(git.hasGit).toBe(false);
  });

  test("showRepoName returns false when config is disabled (default)", () => {
    const git = new GitInfo("my-lib", "main", "project");
    expect(git.showRepoName).toBe(false);
  });

  test("showRepoName returns true when repo name differs from project dir and config enabled", () => {
    const git = new GitInfo("my-lib", "main", "project", true);
    expect(git.showRepoName).toBe(true);
  });

  test("showRepoName returns false when repo name matches project dir and config enabled", () => {
    const git = new GitInfo("project", "main", "project", true);
    expect(git.showRepoName).toBe(false);
  });

  test("showRepoName returns false when repo name is null", () => {
    const git = new GitInfo(null, "main", "project", true);
    expect(git.showRepoName).toBe(false);
  });

  test("renders with no git repo", () => {
    const git = new GitInfo(null, null, "project");
    const output = git.render();
    expect(output).toContain("⎇");
    expect(output).toContain("∅");
    expect(output).toContain("\x1b[33m"); // Yellow color
  });

  test("renders with config disabled (default)", () => {
    const git = new GitInfo("project", "main", "project");
    const output = git.render();
    expect(output).toContain("🐙");
    expect(output).not.toContain("📦");
    expect(output).toContain("⎇");
    expect(output).toContain("main");
    expect(output).toContain("\x1b[32m"); // Green color for branch icon
  });

  test("renders with clean working tree status", () => {
    const git = new GitInfo("project", "main", "project", false, true);
    const output = git.render();
    expect(output).toContain("💎");
    expect(output).toContain("\x1b[32m"); // Green color
  });

  test("renders with dirty working tree status", () => {
    const git = new GitInfo("project", "main", "project", false, false);
    const output = git.render();
    expect(output).toContain("🛠️");
    expect(output).toContain("\x1b[33m"); // Yellow color
  });

  test("renders without status when isClean is null", () => {
    const git = new GitInfo("project", "main", "project", false, null);
    const output = git.render();
    expect(output).not.toContain("✓");
    expect(output).not.toContain("✗");
  });

  test("renders with staged changes", () => {
    const git = new GitInfo("project", "main", "project", false, true, true);
    const output = git.render();
    expect(output).toContain("📤"); // Staged icon
    expect(output).not.toContain("💎"); // No clean icon when staged
  });

  test("renders with staged and dirty", () => {
    const git = new GitInfo("project", "main", "project", false, false, true);
    const output = git.render();
    expect(output).toContain("📤"); // Staged icon
    expect(output).toContain("🛠️"); // Dirty icon
  });

  test("renders with repo name same as project dir and config enabled", () => {
    const git = new GitInfo("project", "main", "project", true);
    const output = git.render();
    expect(output).toContain("🐙");
    expect(output).toContain("📦");
    expect(output).toContain("⎇");
    expect(output).toContain("main");
    expect(output).toContain("\x1b[32m"); // Green color for branch icon
  });

  test("renders with different repo name and config enabled", () => {
    const git = new GitInfo("my-lib", "feature", "project", true);
    const output = git.render();
    expect(output).toContain("🐙");
    expect(output).toContain("my-lib");
    expect(output).toContain("⎇");
    expect(output).toContain("feature");
  });

  test("creates from directory (integration with git)", () => {
    // This will use actual git commands on the current directory
    const git = GitInfo.fromDirectory(process.cwd());

    // Should detect git repo
    expect(git.branch).not.toBeNull();
    expect(git.hasGit).toBe(true);
  });

  test("creates from non-git directory", () => {
    const git = GitInfo.fromDirectory("/tmp");

    // tmp likely isn't a git repo
    expect(git.hasGit).toBe(git.branch !== null);
  });

  test("uses cached repo name when provided", () => {
    const git = GitInfo.fromDirectory(
      process.cwd(),
      undefined,
      "cached-repo",
      "cached-branch"
    );

    expect(git.repoName).toBe("cached-repo");
    expect(git.branch).toBe("cached-branch");
  });

  test("uses cached null values when provided", () => {
    const git = GitInfo.fromDirectory(
      process.cwd(),
      undefined,
      null,
      null
    );

    expect(git.repoName).toBeNull();
    expect(git.branch).toBeNull();
    expect(git.hasGit).toBe(false);
  });

  test("falls back to git commands when cache is undefined", () => {
    const git = GitInfo.fromDirectory(
      process.cwd(),
      undefined,
      undefined,
      undefined,
      undefined
    );

    // Should detect actual git repo
    expect(git.branch).not.toBeNull();
    expect(git.hasGit).toBe(true);
  });

  test("uses input gitBranch when provided", () => {
    const git = GitInfo.fromDirectory(
      process.cwd(),
      undefined,
      undefined,
      undefined,
      "input-branch"
    );

    expect(git.branch).toBe("input-branch");
  });

  test("prefers input gitBranch over cached value", () => {
    const git = GitInfo.fromDirectory(
      process.cwd(),
      undefined,
      "cached-repo",
      "cached-branch",
      "input-branch"
    );

    expect(git.branch).toBe("input-branch");
    expect(git.repoName).toBe("cached-repo"); // Repo name still from cache
  });

  test("uses cached branch when input is not provided", () => {
    const git = GitInfo.fromDirectory(
      process.cwd(),
      undefined,
      "cached-repo",
      "cached-branch",
      undefined
    );

    expect(git.branch).toBe("cached-branch");
  });

  test("reads git branch from transcript when git command fails", () => {
    const { mkdirSync, writeFileSync, existsSync, rmSync } = require("fs");
    const { join } = require("path");

    const testDir = "/tmp/test-git-transcript";
    const transcriptPath = join(testDir, "test.jsonl");

    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });

    // Create transcript with gitBranch
    const lines = [
      JSON.stringify({ type: "user", gitBranch: "feature-branch" }),
    ];
    writeFileSync(transcriptPath, lines.join("\n"));

    // Use non-git directory
    const git = GitInfo.fromDirectory("/tmp", transcriptPath);

    // Should read from transcript
    expect(git.branch).toBe("feature-branch");

    // Cleanup
    rmSync(testDir, { recursive: true });
  });
});
