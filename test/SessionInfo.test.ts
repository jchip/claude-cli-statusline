import { describe, test, expect } from "bun:test";
import { SessionInfo } from "../src/components/SessionInfo.ts";
import type { StatusLineInput } from "../src/types.ts";

describe("SessionInfo", () => {
  test("renders nothing without an identity", () => {
    expect(new SessionInfo(null, null).render()).toBe("");
    expect(SessionInfo.fromInput({}).render()).toBe("");
  });

  test("renders session name with icon and color", () => {
    const output = new SessionInfo("name", "my session").render();

    expect(output).toContain("📌");
    expect(output).toContain("my session");
    expect(output).toContain("\x1b[36m");
    expect(output).toContain("\x1b[0m");
  });

  test("fromInput uses session_name when nothing else is present", () => {
    const input: StatusLineInput = { session_name: "statusline work" };
    const session = SessionInfo.fromInput(input);

    expect(session.kind).toBe("name");
    expect(session.label).toBe("statusline work");
  });

  test("fromInput uses pr number over session name", () => {
    const input: StatusLineInput = {
      session_name: "statusline work",
      pr: { number: 42, url: "https://example.com/pr/42" },
    };
    const session = SessionInfo.fromInput(input);

    expect(session.kind).toBe("pr");
    expect(session.label).toBe("#42");
    expect(session.render()).toContain("🔀");
  });

  test("fromInput uses worktree over pr and session name", () => {
    const input: StatusLineInput = {
      session_name: "statusline work",
      pr: { number: 42 },
      worktree: { name: "feature-x", path: "/tmp/wt/feature-x" },
    };
    const session = SessionInfo.fromInput(input);

    expect(session.kind).toBe("worktree");
    expect(session.label).toBe("feature-x");
    expect(session.render()).toContain("🌳");
  });

  test("fromInput falls back to workspace.git_worktree basename", () => {
    const input: StatusLineInput = {
      workspace: { git_worktree: "/Users/jc/dev/wt/hotfix" },
    };
    const session = SessionInfo.fromInput(input);

    expect(session.kind).toBe("worktree");
    expect(session.label).toBe("hotfix");
  });

  test("fromInput ignores a trailing separator in the worktree path", () => {
    const input: StatusLineInput = {
      workspace: { git_worktree: "/Users/jc/dev/wt/hotfix/" },
    };

    expect(SessionInfo.fromInput(input).label).toBe("hotfix");
  });

  test("fromInput ignores an empty worktree path", () => {
    const input: StatusLineInput = {
      workspace: { git_worktree: "" },
      session_name: "fallback",
    };

    expect(SessionInfo.fromInput(input).kind).toBe("name");
  });
});
