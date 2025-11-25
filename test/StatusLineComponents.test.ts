import { describe, test, expect } from "bun:test";
import { StatusLineComponents } from "../src/components/StatusLineComponents.ts";
import { WorkDir } from "../src/components/WorkDir.ts";
import { GitInfo } from "../src/components/GitInfo.ts";
import { ModelInfo } from "../src/components/ModelInfo.ts";
import { ContextInfo } from "../src/components/ContextInfo.ts";

describe("StatusLineComponents", () => {
  test("creates StatusLineComponents with all components", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    const git = new GitInfo("project", "main", "project");
    const model = new ModelInfo("test-id", "Test", "Test", 200000, "id");
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });

    const components = new StatusLineComponents(workDir, git, model, context);

    expect(components.workDir).toBe(workDir);
    expect(components.git).toBe(git);
    expect(components.model).toBe(model);
    expect(components.context).toBe(context);
  });

  test("renders complete statusline", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    const git = new GitInfo("project", "main", "project");
    const model = new ModelInfo("test-id", "Sonnet 4.5", "Sonnet 4.5", 200000, "id");
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });

    const components = new StatusLineComponents(workDir, git, model, context);
    const output = components.render();

    // Check all major components are present
    expect(output).toContain("📦"); // WorkDir icon
    expect(output).not.toContain("›"); // Dir separator removed
    expect(output).toContain("📁"); // Current dir icon
    expect(output).toContain("🐙"); // Git repo icon
    expect(output).toContain("⎇"); // Git branch icon
    expect(output).toContain("main"); // Branch name
    expect(output).toContain("🧠"); // Model icon
    expect(output).toContain("Sonnet 4.5"); // Model name
    expect(output).toContain("⏬"); // Context icon
    expect(output).toContain("75%"); // Remaining percent
    expect(output).toContain("✦"); // Separator
    expect(output).toContain("⚡️"); // Not compacted
    expect(output).toContain("200"); // Max tokens
    expect(output).toContain("K"); // Max tokens suffix
  });

  test("renders with compacted context", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    const git = new GitInfo("project", "main", "project");
    const model = new ModelInfo("test-id", "Test", "Test", 200000, "id");
    const context = new ContextInfo(100000, 200000, 45000, true, {
      green: 65,
      yellow: 45,
      orange: 20,
    });

    const components = new StatusLineComponents(workDir, git, model, context);
    const output = components.render();

    expect(output).toContain("💫"); // Compacted icon
  });

  test("renders with display name match indicator", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    const git = new GitInfo("project", "main", "project");
    const model = new ModelInfo("test-id", "Test", "Test", 1000000, "displayName");
    const context = new ContextInfo(
      0,
      1000000,
      45000,
      false,
      { green: 65, yellow: 45, orange: 20 },
      "🏷️"
    );

    const components = new StatusLineComponents(workDir, git, model, context);
    const output = components.render();

    expect(output).toContain("1"); // 1M tokens
    expect(output).toContain("M"); // 1M tokens suffix
    expect(output).toContain("🏷️"); // Display name indicator
  });

  test("renders with default window indicator", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    const git = new GitInfo("project", "main", "project");
    const model = new ModelInfo("unknown-id", "Unknown", "Unknown", 200000, "default");
    const context = new ContextInfo(
      0,
      200000,
      45000,
      false,
      { green: 65, yellow: 45, orange: 20 },
      "⚙️"
    );

    const components = new StatusLineComponents(workDir, git, model, context);
    const output = components.render();

    expect(output).toContain("⚙️"); // Default indicator
  });

  test("renders with no git repo", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    const git = new GitInfo(null, null, "project");
    const model = new ModelInfo("test-id", "Test", "Test", 200000, "id");
    const context = new ContextInfo(0, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });

    const components = new StatusLineComponents(workDir, git, model, context);
    const output = components.render();

    expect(output).toContain("∅"); // No git
  });

  test("renders with subdirectory", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project/src/components");
    const git = new GitInfo("project", "main", "project");
    const model = new ModelInfo("test-id", "Test", "Test", 200000, "id");
    const context = new ContextInfo(0, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });

    const components = new StatusLineComponents(workDir, git, model, context);
    const output = components.render();

    expect(output).toContain("src/components"); // Relative path
  });

  test("renders with custom single-line layout", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    const git = new GitInfo("project", "main", "project");
    const model = new ModelInfo("test-id", "Sonnet 4.5", "Sonnet 4.5", 200000, "id");
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });

    const config = {
      "context-color-levels": [65, 45, 20] as [number, number, number],
      "model-context-windows": {},
      "display-name-model-context-windows": {},
      "model-display-name-map": {},
      "default-context-window": 200000,
      "compact-buffer": 45000,
      "save-sample": { enabled: false, filename: "" },
      "render-layout": ["project cwd git model context"],
    };

    const components = new StatusLineComponents(workDir, git, model, context, config);
    const output = components.render();

    // Should be single line (no newline)
    expect(output).not.toContain("\n");
    expect(output).toContain("📦");
    expect(output).toContain("📁");
    expect(output).toContain("🐙");
    expect(output).toContain("🧠");
    expect(output).toContain("⏬");
  });

  test("renders with custom two-line layout", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    const git = new GitInfo("project", "main", "project");
    const model = new ModelInfo("test-id", "Sonnet 4.5", "Sonnet 4.5", 200000, "id");
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });

    const config = {
      "context-color-levels": [65, 45, 20] as [number, number, number],
      "model-context-windows": {},
      "display-name-model-context-windows": {},
      "model-display-name-map": {},
      "default-context-window": 200000,
      "compact-buffer": 45000,
      "save-sample": { enabled: false, filename: "" },
      "render-layout": ["project cwd", "git model context"],
    };

    const components = new StatusLineComponents(workDir, git, model, context, config);
    const output = components.render();

    const lines = output.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("📦");
    expect(lines[0]).toContain("📁");
    expect(lines[1]).toContain("🐙");
    expect(lines[1]).toContain("🧠");
    expect(lines[1]).toContain("⏬");
  });

  test("renders with custom component order", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    const git = new GitInfo("project", "main", "project");
    const model = new ModelInfo("test-id", "Sonnet 4.5", "Sonnet 4.5", 200000, "id");
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });

    const config = {
      "context-color-levels": [65, 45, 20] as [number, number, number],
      "model-context-windows": {},
      "display-name-model-context-windows": {},
      "model-display-name-map": {},
      "default-context-window": 200000,
      "compact-buffer": 45000,
      "save-sample": { enabled: false, filename: "" },
      "render-layout": ["context model", "project cwd git"],
    };

    const components = new StatusLineComponents(workDir, git, model, context, config);
    const output = components.render();

    const lines = output.split("\n");
    expect(lines).toHaveLength(2);

    // First line should have context and model
    expect(lines[0]).toContain("⏬");
    expect(lines[0]).toContain("🧠");

    // Second line should have project, cwd, and git
    expect(lines[1]).toContain("📦");
    expect(lines[1]).toContain("📁");
    expect(lines[1]).toContain("🐙");
  });

  test("renders with minimal layout (only git and context)", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    const git = new GitInfo("project", "main", "project");
    const model = new ModelInfo("test-id", "Sonnet 4.5", "Sonnet 4.5", 200000, "id");
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });

    const config = {
      "context-color-levels": [65, 45, 20] as [number, number, number],
      "model-context-windows": {},
      "display-name-model-context-windows": {},
      "model-display-name-map": {},
      "default-context-window": 200000,
      "compact-buffer": 45000,
      "save-sample": { enabled: false, filename: "" },
      "render-layout": ["git context"],
    };

    const components = new StatusLineComponents(workDir, git, model, context, config);
    const output = components.render();

    // Should only contain git and context
    expect(output).toContain("🐙");
    expect(output).toContain("⏬");

    // Should not contain project or cwd icons
    expect(output).not.toContain("📦");
    expect(output).not.toContain("📁");

    // Should not contain model icon
    expect(output).not.toContain("🧠");
  });

  test("uses default layout when render-layout not specified", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    const git = new GitInfo("project", "main", "project");
    const model = new ModelInfo("test-id", "Sonnet 4.5", "Sonnet 4.5", 200000, "id");
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });

    const config = {
      "context-color-levels": [65, 45, 20] as [number, number, number],
      "model-context-windows": {},
      "display-name-model-context-windows": {},
      "model-display-name-map": {},
      "default-context-window": 200000,
      "compact-buffer": 45000,
      "save-sample": { enabled: false, filename: "" },
    };

    const components = new StatusLineComponents(workDir, git, model, context, config);
    const output = components.render();

    // Default layout is layout-1-line (single line)
    expect(output).not.toContain("\n");
    expect(output).toContain("📦");
    expect(output).toContain("📁");
    expect(output).toContain("🐙");
    expect(output).toContain("🧠");
    expect(output).toContain("⏬");
  });

  test("renders with predefined layout-1-line", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    const git = new GitInfo("project", "main", "project");
    const model = new ModelInfo("test-id", "Sonnet 4.5", "Sonnet 4.5", 200000, "id");
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });

    const config = {
      "context-color-levels": [65, 45, 20] as [number, number, number],
      "model-context-windows": {},
      "display-name-model-context-windows": {},
      "model-display-name-map": {},
      "default-context-window": 200000,
      "compact-buffer": 45000,
      "save-sample": { enabled: false, filename: "" },
      "render-layout": "layout-1-line" as const,
    };

    const components = new StatusLineComponents(workDir, git, model, context, config);
    const output = components.render();

    // Should be single line
    expect(output).not.toContain("\n");
    expect(output).toContain("📦");
    expect(output).toContain("📁");
    expect(output).toContain("🐙");
    expect(output).toContain("🧠");
    expect(output).toContain("⏬");
  });

  test("renders with predefined layout-2-line", () => {
    const workDir = new WorkDir("/home/user/project", "/home/user/project");
    const git = new GitInfo("project", "main", "project");
    const model = new ModelInfo("test-id", "Sonnet 4.5", "Sonnet 4.5", 200000, "id");
    const context = new ContextInfo(50000, 200000, 45000, false, {
      green: 65,
      yellow: 45,
      orange: 20,
    });

    const config = {
      "context-color-levels": [65, 45, 20] as [number, number, number],
      "model-context-windows": {},
      "display-name-model-context-windows": {},
      "model-display-name-map": {},
      "default-context-window": 200000,
      "compact-buffer": 45000,
      "save-sample": { enabled: false, filename: "" },
      "render-layout": "layout-2-line" as const,
    };

    const components = new StatusLineComponents(workDir, git, model, context, config);
    const output = components.render();

    // Should be two lines
    const lines = output.split("\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("📦");
    expect(lines[0]).toContain("📁");
    expect(lines[1]).toContain("🐙");
    expect(lines[1]).toContain("🧠");
    expect(lines[1]).toContain("⏬");
  });
});
