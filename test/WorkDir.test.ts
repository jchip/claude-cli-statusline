import { describe, test, expect } from "bun:test";
import { WorkDir } from "../src/components/WorkDir.ts";

describe("WorkDir", () => {
  test("creates WorkDir with project and current dirs", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project/src");
    expect(workDir.projectDir).toBe("/home/user/project");
    expect(workDir.currentDir).toBe("/home/user/project/src");
  });

  test("displays basename by default", () => {
    const home = process.env.HOME || "";
    const workDir = new WorkDir(`${home}/project`, `${home}/project/src`);
    expect(workDir.projectDirDisplay).toBe("project");
  });

  test("displays full path when config enabled", () => {
    const home = process.env.HOME || "";
    const workDir = new WorkDir(`${home}/project`, `${home}/project/src`, true);
    expect(workDir.projectDirDisplay).toBe("~/project");
  });

  test("calculates relative path", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project/src");
    expect(workDir.relativePath).toBe("src");
  });

  test("returns . for same directory", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    expect(workDir.relativePath).toBe(".");
  });

  test("renders statusline with relative path (no separator)", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project/src");
    const output = workDir.render();
    expect(output).toContain("📦");
    expect(output).not.toContain("›");
    expect(output).toContain("📁");
    expect(output).toContain("src");
  });

  test("renders statusline with . for same directory (no separator)", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    const output = workDir.render();
    expect(output).toContain("📦");
    expect(output).not.toContain("›");
    expect(output).toContain("📁");
    expect(output).toContain(".");
  });

  test("creates from input with workspace fields", () => {
    const input = {
      workspace: {
        project_dir: "/home/user/project",
        current_dir: "/home/user/project/src",
      },
    };
    const workDir = WorkDir.fromInput(input);
    expect(workDir.projectDir).toBe("/home/user/project");
    expect(workDir.currentDir).toBe("/home/user/project/src");
  });

  test("creates from input with cwd fallback", () => {
    const input = {
      cwd: "/home/user/project",
    };
    const workDir = WorkDir.fromInput(input);
    expect(workDir.projectDir).toBe("/home/user/project");
    expect(workDir.currentDir).toBe("/home/user/project");
  });

  test("creates from input with process.cwd fallback", () => {
    const workDir = WorkDir.fromInput({});
    expect(workDir.projectDir).toBe(process.cwd());
    expect(workDir.currentDir).toBe(process.cwd());
  });
});
