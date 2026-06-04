import { describe, test, expect } from "bun:test";
import { wrapBalanced } from "../src/logic/LayoutWrapper.ts";

// Visible width = number of chars (these fixtures use plain ASCII), parts
// joined by a single space.
const widthOf = (line: string) => line.length;

describe("wrapBalanced", () => {
  test("keeps everything on one line when it fits", () => {
    const parts = ["aaa", "bbb", "ccc"];
    expect(wrapBalanced(parts, 50)).toEqual(["aaa bbb ccc"]);
  });

  test("returns a single empty line for no parts", () => {
    expect(wrapBalanced([], 50)).toEqual([""]);
  });

  test("wraps when the combined width exceeds the limit", () => {
    const parts = ["aaaaaaaaaa", "bbbbbbbbbb", "cccccccccc"]; // 10 each
    const lines = wrapBalanced(parts, 22); // fits 2 per line (10+1+10=21)
    expect(lines.length).toBe(2);
    for (const line of lines) {
      expect(widthOf(line)).toBeLessThanOrEqual(22);
    }
    // No content lost or reordered
    expect(lines.join(" ").split(" ")).toEqual(parts);
  });

  test("balances width instead of front-loading the first line", () => {
    // Greedy fill at width 50 would pack "aaa"(30)+"bbb"(10) = 41 on line 1
    // and leave "ccc"(30) alone. Balancing should split the two wide parts.
    const parts = ["a".repeat(30), "b".repeat(10), "c".repeat(30)];
    const lines = wrapBalanced(parts, 50);
    expect(lines.length).toBe(2);
    // The widest line should be no wider than necessary (the two 30s can't
    // share a line, so each wide part anchors a line; the 10 joins one).
    const widths = lines.map(widthOf);
    expect(Math.max(...widths)).toBeLessThanOrEqual(41);
    expect(lines.join(" ").split(" ")).toEqual(parts);
  });

  test("minimizes the widest line for a fixed number of lines", () => {
    // Four equal parts, limit fits two per line -> 2 balanced lines.
    const parts = ["xxxxxxxxxx", "yyyyyyyyyy", "zzzzzzzzzz", "wwwwwwwwww"];
    const lines = wrapBalanced(parts, 25);
    expect(lines.length).toBe(2);
    expect(lines.map(widthOf)).toEqual([21, 21]);
  });

  test("places an oversized part on its own line", () => {
    const parts = ["short", "x".repeat(80), "tiny"];
    const lines = wrapBalanced(parts, 40);
    expect(lines).toContain("x".repeat(80));
    expect(lines.join(" ").split(" ")).toEqual(parts);
  });

  test("preserves the order and content of all parts", () => {
    const parts = Array.from({ length: 7 }, (_, i) => "p".repeat(i + 3));
    const lines = wrapBalanced(parts, 20);
    // Soft target: lines may spill slightly over, but nothing is lost/reordered.
    expect(lines.join(" ").split(" ")).toEqual(parts);
    expect(lines.length).toBeLessThanOrEqual(parts.length);
  });

  test("merges a short widget up instead of stranding it as an orphan", () => {
    // A tiny widget (cwd, width 2) wedged between two wide ones (project 20,
    // branch 22) would be orphaned on its own short line by a hard-cap packer.
    // Min-raggedness merges it onto the project line, spilling slightly over.
    const project = "P".repeat(20);
    const cwd = "cc"; // width 2
    const branch = "G".repeat(22);
    const lines = wrapBalanced([project, cwd, branch], 25);

    expect(lines.length).toBe(2);
    expect(lines[0]).toBe(`${project} ${cwd}`); // cwd merged up
    expect(lines[1]).toBe(branch);
  });

  test("pulls a short trailing widget up when the overflow is modest", () => {
    // Last widget (7) would sit alone; merging spills only 3 over the target,
    // so it's pulled onto the line above instead of trailing on its own.
    const head = "h".repeat(50);
    const tail = "t".repeat(7);
    expect(wrapBalanced([head, tail], 55)).toEqual([`${head} ${tail}`]);
  });

  test("keeps a trailing widget separate when merging would overflow badly", () => {
    // Merging here would spill 26 over the target — too much — so the trailing
    // widget stays on its own line.
    const head = "h".repeat(50);
    const tail = "t".repeat(30);
    const lines = wrapBalanced([head, tail], 55);
    expect(lines).toEqual([head, tail]);
  });
});
