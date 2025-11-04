import { describe, test, expect } from "bun:test";
import { ModelInfo, type ModelMatchType } from "../src/components/ModelInfo.ts";
import { ModelMatchType as ModelMatchTypeEnum } from "../src/models/ModelData.ts";
import type { Config } from "../src/types.ts";

const mockConfig: Config = {
  "context-color-levels": [65, 45, 20],
  "model-context-windows": {
    "claude-sonnet-4-5-20250929": 200000,
    "known-model": 250000,
  },
  "display-name-model-context-windows": {
    "Sonnet 4.5": 200000,
    "Sonnet 4.5 (1M context)": 1000000,
  },
  "model-display-name-map": {
    "Sonnet 4.5 (1M context)": "Sonnet 4.5",
  },
  "default-context-window": 200000,
  "compact-buffer": 45000,
  "save-sample": {
    enable: false,
    filename: "sample.json",
  },
};

describe("ModelInfo", () => {
  test("creates ModelInfo with all properties", () => {
    const model = new ModelInfo("test-id", "Test Model", "Test", 200000, ModelMatchTypeEnum.ModelId);
    expect(model.id).toBe("test-id");
    expect(model.displayName).toBe("Test Model");
    expect(model.mappedDisplayName).toBe("Test");
    expect(model.maxTokens).toBe(200000);
    expect(model.matchType).toBe(ModelMatchTypeEnum.ModelId);
  });

  test("shows no indicator for model ID match", () => {
    const model = new ModelInfo("test-id", "Test", "Test", 200000, ModelMatchTypeEnum.ModelId);
    expect(model.matchIndicator).toBe("");
  });

  test("shows 🏷️ indicator for display name match", () => {
    const model = new ModelInfo("test-id", "Test", "Test", 200000, ModelMatchTypeEnum.DisplayName);
    expect(model.matchIndicator).toBe("🏷️");
  });

  test("shows ⚙️ indicator for default match", () => {
    const model = new ModelInfo("test-id", "Test", "Test", 200000, ModelMatchTypeEnum.Default);
    expect(model.matchIndicator).toBe("⚙️");
  });

  test("renders with model display name", () => {
    const model = new ModelInfo("test-id", "Test", "Test Model", 200000, ModelMatchTypeEnum.ModelId);
    const output = model.render();
    expect(output).toContain("🧠");
    expect(output).toContain("Test Model");
  });

  test("creates from input with model ID match", () => {
    const input = {
      model: {
        id: "known-model",
        display_name: "Known Model",
      },
    };
    const model = ModelInfo.fromInput(input, mockConfig);
    expect(model.maxTokens).toBe(250000);
    expect(model.matchType).toBe(ModelMatchTypeEnum.ModelId);
  });

  test("creates from input with display name match", () => {
    const input = {
      model: {
        id: "unknown-id",
        display_name: "Sonnet 4.5 (1M context)",
      },
    };
    const model = ModelInfo.fromInput(input, mockConfig);
    expect(model.maxTokens).toBe(1000000);
    expect(model.matchType).toBe(ModelMatchTypeEnum.DisplayName);
    expect(model.mappedDisplayName).toBe("Sonnet 4.5");
  });

  test("creates from input with default fallback", () => {
    const input = {
      model: {
        id: "unknown-id",
        display_name: "Unknown Model",
      },
    };
    const model = ModelInfo.fromInput(input, mockConfig);
    expect(model.maxTokens).toBe(200000);
    expect(model.matchType).toBe(ModelMatchTypeEnum.Default);
  });

  test("handles missing model info", () => {
    const model = ModelInfo.fromInput({}, mockConfig);
    expect(model.id).toBe("unknown");
    expect(model.displayName).toBe("model");
    expect(model.maxTokens).toBe(200000);
  });
});
