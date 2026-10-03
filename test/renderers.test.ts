import { describe, test, expect } from "bun:test";
import { ContextRenderer } from "../src/renderers/ContextRenderer.ts";
import { GitRenderer } from "../src/renderers/GitRenderer.ts";
import { ModelRenderer } from "../src/renderers/ModelRenderer.ts";
import { WorkDirRenderer } from "../src/renderers/WorkDirRenderer.ts";
import { StatusLineRenderer } from "../src/renderers/StatusLineRenderer.ts";
import { ContextData } from "../src/models/ContextData.ts";
import { GitData } from "../src/models/GitData.ts";
import { ModelData, ModelMatchType } from "../src/models/ModelData.ts";
import { WorkDirData } from "../src/models/WorkDirData.ts";

describe("ContextRenderer", () => {
  test("renders context info", () => {
    const data = new ContextData(50000, 200000, 45000, false, "");
    const thresholds = { green: 65, yellow: 45, orange: 20 };
    const output = ContextRenderer.render(data, thresholds);

    expect(output).toContain("⏬");
    expect(output).toContain("75%");
    expect(output).toContain("✦");
    expect(output).toContain("📖");
    expect(output).toContain("200");
    expect(output).toContain("K");
  });

  test("renders context with match indicator", () => {
    const data = new ContextData(50000, 200000, 45000, false, "🔖");
    const thresholds = { green: 65, yellow: 45, orange: 20 };
    const output = ContextRenderer.render(data, thresholds);

    expect(output).toContain("🔖");
  });

  test("renders context with compacted icon", () => {
    const data = new ContextData(50000, 200000, 45000, true, "");
    const thresholds = { green: 65, yellow: 45, orange: 20 };
    const output = ContextRenderer.render(data, thresholds);

    expect(output).toContain("💫");
  });
});

describe("GitRenderer", () => {
  test("renders git info with no repository", () => {
    const data = new GitData(null, null, "project");
    const output = GitRenderer.render(data);

    expect(output).toContain("⎇");
    expect(output).toContain("∅");
  });

  test("renders git info with config disabled (default)", () => {
    const data = new GitData("project", "main", "project");
    const output = GitRenderer.render(data);

    expect(output).toContain("🐙");
    expect(output).not.toContain("📦");
    expect(output).toContain("⎇");
    expect(output).toContain("main");
  });

  test("renders git info with repo name same as project and config enabled", () => {
    const data = new GitData("project", "main", "project", true);
    const output = GitRenderer.render(data);

    expect(output).toContain("🐙");
    expect(output).toContain("📦");
    expect(output).toContain("⎇");
    expect(output).toContain("main");
  });

  test("renders git info with different repo name and config enabled", () => {
    const data = new GitData("my-repo", "feature", "project", true);
    const output = GitRenderer.render(data);

    expect(output).toContain("🐙");
    expect(output).toContain("my-repo");
    expect(output).toContain("⎇");
    expect(output).toContain("feature");
  });

  test("renders git info with clean working tree status", () => {
    const data = new GitData("project", "main", "project", false, true);
    const output = GitRenderer.render(data);

    expect(output).toContain("💎");
    expect(output).toContain("\x1b[32m"); // Green color
  });

  test("renders git info with dirty working tree status", () => {
    const data = new GitData("project", "main", "project", false, false);
    const output = GitRenderer.render(data);

    expect(output).toContain("🚧");
    expect(output).toContain("\x1b[33m"); // Yellow color
  });

  test("renders git info without status when isClean is null", () => {
    const data = new GitData("project", "main", "project", false, null);
    const output = GitRenderer.render(data);

    expect(output).not.toContain("✓");
    expect(output).not.toContain("✗");
  });

  test("renders git info with staged changes", () => {
    const data = new GitData("project", "main", "project", false, true, true);
    const output = GitRenderer.render(data);

    expect(output).toContain("📤"); // Staged icon
    expect(output).not.toContain("💎"); // No clean icon when staged
    expect(output).toContain("\x1b[36m"); // Light blue color for staged
  });

  test("renders git info with staged and dirty", () => {
    const data = new GitData("project", "main", "project", false, false, true);
    const output = GitRenderer.render(data);

    expect(output).toContain("📤"); // Staged icon
    expect(output).toContain("🚧"); // Dirty icon
    expect(output).toContain("\x1b[36m"); // Light blue color for staged
    expect(output).toContain("\x1b[33m"); // Yellow color for dirty
  });

  test("renders git info with only staged (no clean/dirty info)", () => {
    const data = new GitData("project", "main", "project", false, null, true);
    const output = GitRenderer.render(data);

    expect(output).toContain("📤"); // Staged icon
    expect(output).not.toContain("💎"); // No clean icon
    expect(output).not.toContain("🚧"); // No dirty icon
  });
});

describe("ModelRenderer", () => {
  test("renders model info", () => {
    const data = new ModelData(
      "test-id",
      "Test Model",
      "Test Model",
      200000,
      ModelMatchType.ModelId
    );
    const output = ModelRenderer.render(data);

    expect(output).toContain("🧠");
    expect(output).toContain("Test Model");
  });
});

describe("WorkDirRenderer", () => {
  test("renders work dir info (no separator)", () => {
    const data = new WorkDirData(
      "/home/user/project",
      "/home/user/project/src",
      "~/project",
      "src"
    );
    const output = WorkDirRenderer.render(data);

    expect(output).toContain("📦");
    expect(output).toContain("~/project");
    expect(output).not.toContain("›");
    expect(output).toContain("📁");
    expect(output).toContain("src");
  });
});

describe("StatusLineRenderer", () => {
  test("renders complete status line", () => {
    const workDir = new WorkDirData(
      "/home/user/project",
      "/home/user/project/src",
      "~/project",
      "src"
    );
    const git = new GitData("project", "main", "project");
    const model = new ModelData(
      "test-id",
      "Test",
      "Test",
      200000,
      ModelMatchType.ModelId
    );
    const context = new ContextData(50000, 200000, 45000, false, "");
    const thresholds = { green: 65, yellow: 45, orange: 20 };

    const output = StatusLineRenderer.render(workDir, git, model, context, thresholds);

    expect(output).toContain("📦");
    expect(output).toContain("🐙");
    expect(output).toContain("🧠");
    expect(output).toContain("⏬");
  });
});
