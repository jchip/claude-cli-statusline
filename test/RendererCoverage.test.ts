/**
 * Additional renderer tests to improve function coverage
 * These renderers are already tested via integration tests,
 * but this ensures the static render methods are directly invoked
 */

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

describe("RendererCoverage", () => {
  test("ContextRenderer.render is callable", () => {
    const data = new ContextData(50000, 200000, 45000, false, "");
    const thresholds = { green: 65, yellow: 45, orange: 20 };
    const result = ContextRenderer.render(data, thresholds);
    expect(typeof result).toBe("string");
  });

  test("ContextRenderer.render with animations", () => {
    const data = new ContextData(50000, 200000, 45000, false, "");
    const thresholds = { green: 65, yellow: 45, orange: 20 };
    const result = ContextRenderer.render(data, thresholds, { animated: true });
    expect(typeof result).toBe("string");
  });

  test("GitRenderer.render is callable", () => {
    const data = new GitData("repo", "main", "project");
    const result = GitRenderer.render(data);
    expect(typeof result).toBe("string");
  });

  test("ModelRenderer.render is callable", () => {
    const data = new ModelData("id", "Model", "Model", 200000, ModelMatchType.ModelId);
    const result = ModelRenderer.render(data);
    expect(typeof result).toBe("string");
  });

  test("WorkDirRenderer.render is callable", () => {
    const data = new WorkDirData("/home/user/project", "/home/user/project", "project", ".");
    const result = WorkDirRenderer.render(data);
    expect(typeof result).toBe("string");
  });

  test("StatusLineRenderer.render is callable", () => {
    const workDir = new WorkDirData("/home/user/project", "/home/user/project", "project", ".");
    const git = new GitData("repo", "main", "project");
    const model = new ModelData("id", "Model", "Model", 200000, ModelMatchType.ModelId);
    const context = new ContextData(50000, 200000, 45000, false, "");
    const thresholds = { green: 65, yellow: 45, orange: 20 };

    const result = StatusLineRenderer.render(workDir, git, model, context, thresholds);
    expect(typeof result).toBe("string");
  });
});
