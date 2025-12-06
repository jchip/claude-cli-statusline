import { describe, test, expect } from "bun:test";
import { GitResolver } from "../src/logic/GitResolver.ts";

describe("GitResolver", () => {
  describe("resolve", () => {
    test("uses input branch when provided", () => {
      const result = GitResolver.resolve(
        "/tmp",
        "input-branch",
        "cached-branch",
        "cached-repo"
      );
      expect(result.branch).toBe("input-branch");
    });

    test("uses cached branch when input not provided", () => {
      const result = GitResolver.resolve(
        "/tmp",
        undefined,
        "cached-branch",
        "cached-repo"
      );
      expect(result.branch).toBe("cached-branch");
    });

    test("uses git command when no input or cache", () => {
      const result = GitResolver.resolve(process.cwd());
      expect(result.branch).not.toBeNull();
      expect(typeof result.branch).toBe("string");
    });

    test("returns null for non-git directory with no cache", () => {
      const result = GitResolver.resolve("/tmp");
      expect(result.branch).toBeNull();
    });

    test("uses cached repo name when provided", () => {
      const result = GitResolver.resolve(
        "/tmp",
        "input-branch",
        undefined,
        "cached-repo"
      );
      expect(result.repoName).toBe("cached-repo");
    });

    test("gets repo name from config when cache not provided", () => {
      const result = GitResolver.resolve(process.cwd());
      expect(result.repoName).toBe("claude-cli-statusline");
    });

    test("returns status info for git directory", () => {
      const result = GitResolver.resolve(process.cwd());
      expect(typeof result.isClean).toBe("boolean");
      expect(typeof result.hasStaged).toBe("boolean");
    });

    test("returns null status for non-git directory", () => {
      const result = GitResolver.resolve("/tmp");
      expect(result.isClean).toBeNull();
      expect(result.hasStaged).toBeNull();
    });
  });

  describe("getProjectDirBasename", () => {
    test("gets project dir basename", () => {
      const basename = GitResolver.getProjectDirBasename("/path/to/project");
      expect(basename).toBe("project");
    });

    test("handles trailing slash", () => {
      const basename = GitResolver.getProjectDirBasename("/path/to/project/");
      expect(basename).toBe("project");
    });
  });
});
