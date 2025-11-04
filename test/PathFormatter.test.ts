import { describe, test, expect } from "bun:test";
import { formatProjectDir, computeRelativePath } from "../src/logic/PathFormatter.ts";

describe("PathFormatter", () => {
  test("formats project dir as basename by default", () => {
    const home = process.env.HOME;
    if (home) {
      const result = formatProjectDir(`${home}/projects/my-app`);
      expect(result).toBe("my-app");
    }
  });

  test("formats project dir with full path when enabled", () => {
    const home = process.env.HOME;
    if (home) {
      const result = formatProjectDir(`${home}/projects/my-app`, true);
      expect(result).toBe("~/projects/my-app");
    }
  });

  test("formats project dir basename without home", () => {
    const result = formatProjectDir("/opt/project");
    expect(result).toBe("project");
  });

  test("formats project dir full path without home", () => {
    const result = formatProjectDir("/opt/project", true);
    expect(result).toBe("/opt/project");
  });

  test("computes relative path when in subdirectory", () => {
    const projectDir = "/home/user/project";
    const currentDir = "/home/user/project/src/components";
    const result = computeRelativePath(projectDir, currentDir);
    expect(result).toBe("src/components");
  });

  test("computes relative path when at root", () => {
    const projectDir = "/home/user/project";
    const currentDir = "/home/user/project";
    const result = computeRelativePath(projectDir, currentDir);
    expect(result).toBe(".");
  });

  test("computes relative path handles trailing slashes", () => {
    const projectDir = "/home/user/project/";
    const currentDir = "/home/user/project/";
    const result = computeRelativePath(projectDir, currentDir);
    expect(result).toBe(".");
  });
});
