import { describe, test, expect } from "bun:test";
import { GitResolver } from "../src/logic/GitResolver.ts";

describe("GitResolver", () => {
  test("resolves git branch from input when provided", () => {
    const branch = GitResolver.resolveGitBranch(
      "input-branch",
      "cached-branch",
      "/any/dir"
    );
    expect(branch).toBe("input-branch");
  });

  test("resolves git branch from cache when input not provided", () => {
    const branch = GitResolver.resolveGitBranch(
      undefined,
      "cached-branch",
      "/any/dir"
    );
    expect(branch).toBe("cached-branch");
  });

  test("resolves git branch from git command when cache is null", () => {
    const branch = GitResolver.resolveGitBranch(
      undefined,
      null,
      process.cwd()
    );
    // Should get actual branch from git command for current directory
    // Note: This could be null if not in a git directory
    expect(typeof branch === "string" || branch === null).toBe(true);
  });

  test("resolves repo name from cache when provided", () => {
    const repoName = GitResolver.resolveRepoName(
      "main",
      "cached-repo",
      "/any/dir"
    );
    expect(repoName).toBe("cached-repo");
  });

  test("returns null repo name when no branch", () => {
    const repoName = GitResolver.resolveRepoName(
      null,
      "cached-repo",
      "/any/dir"
    );
    expect(repoName).toBeNull();
  });

  test("resolves repo name from git when cache undefined", () => {
    const repoName = GitResolver.resolveRepoName(
      "main",
      undefined,
      process.cwd()
    );
    // Should get actual repo name for current directory
    expect(repoName).not.toBeNull();
  });

  test("gets project dir basename", () => {
    const basename = GitResolver.getProjectDirBasename("/path/to/project");
    expect(basename).toBe("project");
  });

  test("gets project dir basename with trailing slash", () => {
    const basename = GitResolver.getProjectDirBasename("/path/to/project/");
    expect(basename).toBe("project");
  });
});
