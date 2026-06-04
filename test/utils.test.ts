import { describe, test, expect } from "bun:test";
import {
  shortenHome,
  clamp,
  formatTokenCount,
  getRelativePath,
  basename,
  findPercentInObject,
  visibleWidth,
} from "../src/utils.ts";

describe("shortenHome", () => {
  test("replaces home directory with ~", () => {
    const home = process.env.HOME || "";
    expect(shortenHome(`${home}/projects`)).toBe("~/projects");
  });

  test("leaves non-home paths unchanged", () => {
    expect(shortenHome("/usr/local/bin")).toBe("/usr/local/bin");
  });

  test("handles empty home", () => {
    expect(shortenHome("/some/path")).toBe("/some/path");
  });
});

describe("clamp", () => {
  test("clamps value to range", () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(50, 0, 100)).toBe(50);
  });

  test("uses default range 0-100", () => {
    expect(clamp(150)).toBe(100);
    expect(clamp(-10)).toBe(0);
    expect(clamp(50)).toBe(50);
  });
});

describe("visibleWidth", () => {
  test("counts plain ASCII as 1 cell each", () => {
    expect(visibleWidth("main")).toBe(4);
    expect(visibleWidth("")).toBe(0);
  });

  test("ignores ANSI color codes", () => {
    expect(visibleWidth("\x1b[32mmain\x1b[0m")).toBe(4);
    expect(visibleWidth("\x1b[38;5;208mok\x1b[0m")).toBe(2);
  });

  test("counts emoji as 2 cells", () => {
    expect(visibleWidth("💎")).toBe(2);
    expect(visibleWidth("💎 main")).toBe(7); // 2 + 1 + 4
    expect(visibleWidth("🚀")).toBe(2);
  });

  test("treats variation selectors as zero-width", () => {
    // 🛠️ is 🛠 (wide) + U+FE0F (zero width)
    expect(visibleWidth("🛠️")).toBe(2);
    // ⚠️ is U+26A0 (wide) + U+FE0F
    expect(visibleWidth("⚠️")).toBe(2);
  });

  test("counts narrow box-drawing/arrow glyphs as 1 cell", () => {
    expect(visibleWidth("▁▂▃")).toBe(3); // sparkline bars
    expect(visibleWidth("↗")).toBe(1); // trend arrow
    expect(visibleWidth("◐")).toBe(1); // circular spinner frame
  });
});

describe("formatTokenCount", () => {
  const cyan = "\x1b[36m";
  const reset = "\x1b[0m";

  test("formats thousands with K in cyan", () => {
    expect(formatTokenCount(1000)).toBe(`1${cyan}K${reset}`);
    expect(formatTokenCount(1500)).toBe(`1.5${cyan}K${reset}`);
    expect(formatTokenCount(200000)).toBe(`200${cyan}K${reset}`);
  });

  test("formats millions with M in cyan and rocket", () => {
    expect(formatTokenCount(1000000)).toBe(`1${cyan}M${reset}🚀`);
    expect(formatTokenCount(1500000)).toBe(`1.5${cyan}M${reset}🚀`);
  });

  test("returns raw number for small values", () => {
    expect(formatTokenCount(500)).toBe("500");
    expect(formatTokenCount(999)).toBe("999");
  });
});

describe("getRelativePath", () => {
  test("returns relative path from root", () => {
    expect(getRelativePath("/home/user/project/src", "/home/user/project")).toBe("src");
    expect(getRelativePath("/home/user/project/src/components", "/home/user/project")).toBe(
      "src/components"
    );
  });

  test("returns . for same directory", () => {
    expect(getRelativePath("/home/user/project", "/home/user/project")).toBe(".");
  });

  test("returns basename if not under root", () => {
    expect(getRelativePath("/other/path", "/home/user/project")).toBe("path");
  });

  test("handles empty inputs", () => {
    expect(getRelativePath("", "")).toBe(".");
  });
});

describe("basename", () => {
  test("returns last component of path", () => {
    expect(basename("/home/user/project")).toBe("project");
    expect(basename("/usr/local/bin")).toBe("bin");
  });

  test("handles trailing slash", () => {
    expect(basename("/home/user/project/")).toBe("project");
  });

  test("handles root path", () => {
    expect(basename("/")).toBe("");
  });
});

describe("findPercentInObject", () => {
  test("finds percent field in object", () => {
    expect(findPercentInObject({ percent: 75 })).toBe(75);
  });

  test("finds percent field in nested object", () => {
    expect(findPercentInObject({ budget: { percent: 50 } })).toBe(50);
  });

  test("returns null if not found", () => {
    expect(findPercentInObject({ value: 100 })).toBeNull();
  });

  test("returns null for non-objects", () => {
    expect(findPercentInObject(null)).toBeNull();
    expect(findPercentInObject("string")).toBeNull();
    expect(findPercentInObject(42)).toBeNull();
  });
});
