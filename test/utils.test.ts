import { describe, it, expect } from "bun:test";
import {
  shortenHome,
  clamp,
  formatTokenCount,
  getRelativePath,
} from "../src/utils";

describe("utils", () => {
  describe("shortenHome", () => {
    it("should replace home directory with ~", () => {
      const home = process.env.HOME || "/home/user";
      const path = `${home}/projects/myproject`;
      expect(shortenHome(path)).toBe("~/projects/myproject");
    });

    it("should not modify paths not starting with home", () => {
      const path = "/some/other/path";
      expect(shortenHome(path)).toBe("/some/other/path");
    });
  });

  describe("clamp", () => {
    it("should return value within bounds", () => {
      expect(clamp(50)).toBe(50);
      expect(clamp(150)).toBe(100);
      expect(clamp(-10)).toBe(0);
    });

    it("should work with custom bounds", () => {
      expect(clamp(15, 10, 20)).toBe(15);
      expect(clamp(5, 10, 20)).toBe(10);
      expect(clamp(25, 10, 20)).toBe(20);
    });
  });

  describe("formatTokenCount", () => {
    it("should format large numbers with M suffix", () => {
      expect(formatTokenCount(1000000)).toBe("1M");
      expect(formatTokenCount(1500000)).toBe("1.50M");
      expect(formatTokenCount(1234567)).toBe("1.23M");
    });

    it("should format thousands with K suffix", () => {
      expect(formatTokenCount(1000)).toBe("1K");
      expect(formatTokenCount(1500)).toBe("1.50K");
      expect(formatTokenCount(1234)).toBe("1.23K");
    });

    it("should return plain number for small values", () => {
      expect(formatTokenCount(999)).toBe("999");
      expect(formatTokenCount(100)).toBe("100");
      expect(formatTokenCount(0)).toBe("0");
    });
  });

  describe("getRelativePath", () => {
    it("should return . for identical paths", () => {
      expect(getRelativePath("/home/user/project", "/home/user/project")).toBe(
        "."
      );
    });

    it("should return relative path when cwd starts with root", () => {
      expect(
        getRelativePath("/home/user/project/src", "/home/user/project")
      ).toBe("src");
      expect(
        getRelativePath("/home/user/project/src/utils", "/home/user/project")
      ).toBe("src/utils");
    });

    it("should return basename when cwd doesn't start with root", () => {
      expect(getRelativePath("/some/other/path", "/home/user/project")).toBe(
        "path"
      );
    });
  });
});
