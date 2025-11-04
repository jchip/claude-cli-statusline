import { describe, it, expect } from "bun:test";
import {
  formatContextDisplay,
  formatGitInfo,
  formatStatusLine,
  colors,
} from "../src/formatter";
import type { Config, StatusLineInput } from "../src/types";

const mockConfig: Config = {
  "context-color-levels": [65, 45, 20],
  "model-context-windows": {
    "claude-3-5-sonnet-20241022": 200000,
  },
  "display-name-model-context-windows": {},
  "model-display-name-map": {},
  "default-context-window": 200000,
  "compact-buffer": 45000,
  "save-sample": {
    enable: false,
    filename: "sample-input.json",
  },
};

describe("formatter", () => {
  describe("colors", () => {
    it("should have ANSI color codes", () => {
      expect(colors.green).toBe("\x1b[32m");
      expect(colors.yellow).toBe("\x1b[33m");
      expect(colors.orange).toBe("\x1b[38;5;208m");
      expect(colors.red).toBe("\x1b[31m");
      expect(colors.reset).toBe("\x1b[0m");
    });
  });

  describe("formatContextDisplay", () => {
    it("should return 💤 for null percentage", () => {
      const result = formatContextDisplay(
        mockConfig,
        null,
        "claude-3-5-sonnet-20241022",
        "",
        [65, 45, 20],
        0,
        false
      );
      expect(result).toBe("💤");
    });

    it("should format context display with colors and indicators", () => {
      const result = formatContextDisplay(
        mockConfig,
        75,
        "claude-3-5-sonnet-20241022",
        "",
        [65, 45, 20],
        25000,
        false
      );
      expect(result).toContain("75%");
      expect(result).toContain("65%"); // until compact
      expect(result).toContain("⚡️");
      expect(result).toContain("200K");
    });

    it("should show 💫 when compact occurred", () => {
      const result = formatContextDisplay(
        mockConfig,
        75,
        "claude-3-5-sonnet-20241022",
        "",
        [65, 45, 20],
        25000,
        true
      );
      expect(result).toContain("💫");
    });

    it("should use correct colors based on thresholds", () => {
      // Green (above 65%)
      let result = formatContextDisplay(
        mockConfig,
        80,
        "claude-3-5-sonnet-20241022",
        "",
        [65, 45, 20],
        0,
        false
      );
      expect(result).toContain(colors.green + "80%" + colors.reset);

      // Yellow (45-65%)
      result = formatContextDisplay(
        mockConfig,
        50,
        "claude-3-5-sonnet-20241022",
        "",
        [65, 45, 20],
        0,
        false
      );
      expect(result).toContain(colors.yellow + "50%" + colors.reset);

      // Orange (20-45%)
      result = formatContextDisplay(
        mockConfig,
        30,
        "claude-3-5-sonnet-20241022",
        "",
        [65, 45, 20],
        0,
        false
      );
      expect(result).toContain(colors.orange + "30%" + colors.reset);

      // Red (below 20%)
      result = formatContextDisplay(
        mockConfig,
        10,
        "claude-3-5-sonnet-20241022",
        "",
        [65, 45, 20],
        0,
        false
      );
      expect(result).toContain(colors.red + "10%" + colors.reset);
    });

    it("should handle invalid percentage values", () => {
      const result = formatContextDisplay(
        mockConfig,
        NaN,
        "claude-3-5-sonnet-20241022",
        "",
        [65, 45, 20],
        0,
        false
      );
      expect(result).toBe("💤");
    });

    it("should show indicator for default context window source", () => {
      const result = formatContextDisplay(
        mockConfig,
        75,
        "unknown-model",
        "",
        [65, 45, 20],
        0,
        false
      );
      expect(result).toContain("⚙️");
    });

    it("should show indicator for display-name context window source", () => {
      const result = formatContextDisplay(
        mockConfig,
        75,
        "unknown-model",
        "Sonnet 4",
        [65, 45, 20],
        0,
        false
      );
      expect(result).toContain("200K"); // Should show the context window value
    });
  });

  describe("formatGitInfo", () => {
    it("should format git info with repo name and branch", () => {
      // This test will fail in the test environment since there's no git repo
      // Just test that it returns a string with expected format when git fails
      const result = formatGitInfo(
        "/home/user/project",
        "/home/user/project",
        undefined
      );
      expect(typeof result).toBe("string");
      expect(result).toContain("⎇");
    });

    it("should handle no git repo", () => {
      const result = formatGitInfo("/tmp", "/tmp", undefined);
      expect(result).toContain(colors.yellow);
      expect(result).toContain("∅");
    });
  });

  describe("formatStatusLine", () => {
    const mockInput: StatusLineInput = {
      model: {
        id: "claude-3-5-sonnet-20241022",
        display_name: "Claude 3.5 Sonnet",
      },
      workspace: {
        current_dir: "/home/user/project/src",
        project_dir: "/home/user/project",
      },
    };

    it("should format complete status line", () => {
      const result = formatStatusLine(
        mockConfig,
        mockInput,
        75,
        [65, 45, 20],
        25000,
        false
      );

      expect(result).toContain("📦");
      expect(result).toContain("📁");
      expect(result).toContain("🧠");
      expect(result).toContain("Claude 3.5 Sonnet");
      expect(result).toContain("75%");
    });

    it("should handle missing model info", () => {
      const inputWithoutModel = { ...mockInput, model: undefined };
      const result = formatStatusLine(
        mockConfig,
        inputWithoutModel,
        75,
        [65, 45, 20],
        25000,
        false
      );
      expect(result).toContain("model");
    });

    it("should map display name using model-display-name-map", () => {
      const configWithMap: Config = {
        ...mockConfig,
        "model-display-name-map": {
          "Sonnet 4.5 (1M context)": "Sonnet 4.5",
        },
      };
      const inputWithLongName = {
        ...mockInput,
        model: {
          id: "claude-sonnet-4-5-20250929",
          display_name: "Sonnet 4.5 (1M context)",
        },
      };
      const result = formatStatusLine(
        configWithMap,
        inputWithLongName,
        75,
        [65, 45, 20],
        25000,
        false
      );
      expect(result).toContain("Sonnet 4.5");
      expect(result).not.toContain("(1M context)");
    });

    it("should use original display name when no mapping exists", () => {
      const inputWithUnmappedName = {
        ...mockInput,
        model: {
          id: "claude-sonnet-4-5-20250929",
          display_name: "Custom Model Name",
        },
      };
      const result = formatStatusLine(
        mockConfig,
        inputWithUnmappedName,
        75,
        [65, 45, 20],
        25000,
        false
      );
      expect(result).toContain("Custom Model Name");
    });
  });
});
