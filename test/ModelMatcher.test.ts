import { describe, test, expect } from "bun:test";
import { ModelMatcher } from "../src/logic/ModelMatcher.ts";
import { ModelMatchType } from "../src/models/ModelData.ts";
import type { Config } from "../src/types.ts";
import { Icons } from "../src/icons.ts";

const mockConfig: Config = {
  "context-color-levels": [65, 45, 20],
  "model-context-windows": {
    "known-id": 250000,
  },
  "display-name-model-context-windows": {
    "Known Display": 300000,
  },
  "model-display-name-map": {
    "Original Name": "Mapped Name",
  },
  "default-context-window": 200000,
  "compact-buffer": 45000,
  "save-sample": {
    enable: false,
    filename: "sample.json",
  },
};

describe("ModelMatcher", () => {
  test("matches by model ID", () => {
    const result = ModelMatcher.matchByModelId("known-id", mockConfig);
    expect(result).not.toBeNull();
    expect(result?.maxTokens).toBe(250000);
    expect(result?.matchType).toBe(ModelMatchType.ModelId);
  });

  test("returns null for unknown model ID", () => {
    const result = ModelMatcher.matchByModelId("unknown-id", mockConfig);
    expect(result).toBeNull();
  });

  test("matches by display name", () => {
    const result = ModelMatcher.matchByDisplayName("Known Display", mockConfig);
    expect(result).not.toBeNull();
    expect(result?.maxTokens).toBe(300000);
    expect(result?.matchType).toBe(ModelMatchType.DisplayName);
  });

  test("returns null for unknown display name", () => {
    const result = ModelMatcher.matchByDisplayName("Unknown Display", mockConfig);
    expect(result).toBeNull();
  });

  test("gets default context window", () => {
    const result = ModelMatcher.getDefault(mockConfig);
    expect(result.maxTokens).toBe(200000);
    expect(result.matchType).toBe(ModelMatchType.Default);
  });

  test("maps display name when mapping exists", () => {
    const result = ModelMatcher.mapDisplayName("Original Name", mockConfig);
    expect(result).toBe("Mapped Name");
  });

  test("returns original display name when no mapping exists", () => {
    const result = ModelMatcher.mapDisplayName("Unmapped Name", mockConfig);
    expect(result).toBe("Unmapped Name");
  });

  test("gets match indicator for model ID", () => {
    expect(ModelMatcher.getMatchIndicator(ModelMatchType.ModelId)).toBe("");
  });

  test("gets match indicator for display name", () => {
    expect(ModelMatcher.getMatchIndicator(ModelMatchType.DisplayName)).toBe(Icons.DISPLAY_NAME_MATCH);
  });

  test("gets match indicator for default", () => {
    expect(ModelMatcher.getMatchIndicator(ModelMatchType.Default)).toBe(Icons.DEFAULT_WINDOW);
  });

  test("match() tries model ID first", () => {
    const result = ModelMatcher.match("known-id", "Any Display", mockConfig);
    expect(result.maxTokens).toBe(250000);
    expect(result.matchType).toBe(ModelMatchType.ModelId);
  });

  test("match() falls back to display name", () => {
    const result = ModelMatcher.match("unknown-id", "Known Display", mockConfig);
    expect(result.maxTokens).toBe(300000);
    expect(result.matchType).toBe(ModelMatchType.DisplayName);
  });

  test("match() tries mapped display name", () => {
    const result = ModelMatcher.match("unknown-id", "Original Name", mockConfig);
    expect(result.maxTokens).toBe(200000); // Falls to default since "Mapped Name" not in config
    expect(result.matchType).toBe(ModelMatchType.Default);
  });

  test("match() falls back to default", () => {
    const result = ModelMatcher.match("unknown-id", "Unknown Display", mockConfig);
    expect(result.maxTokens).toBe(200000);
    expect(result.matchType).toBe(ModelMatchType.Default);
  });
});
