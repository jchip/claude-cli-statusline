/**
 * Icons used in the statusline
 *
 * Use only single-codepoint emoji that default to emoji presentation (e.g. 📖, 🔧).
 * Avoid a text symbol plus U+FE0F (e.g. ⚙️, ⏱️) and ZWJ sequences. Terminals draw
 * them 2 cells wide but may advance the cursor 1 cell, so text overlaps.
 * test/icons.test.ts enforces this.
 */

export class Icons {
  static readonly WORKDIR = "📦";
  static readonly CURRENT_DIR = "📁";
  static readonly GIT_REPO = "🐙";
  static readonly GIT_BRANCH = "⎇";
  static readonly MODEL = "🧠";
  static readonly CONTEXT = "⏬";
  static readonly SEPARATOR = "✦";
  static readonly SEPARATOR_DIR = "›";
  static readonly NOT_COMPACTED = "📖";
  static readonly COMPACTED = "💫";
  static readonly DISPLAY_NAME_MATCH = "🔖";
  static readonly DEFAULT_WINDOW = "🔧";
  static readonly NO_GIT = "∅";
  static readonly NO_CONTEXT = "💤";
  static readonly DIR_SEPARATOR = "›"; // Deprecated: use SEPARATOR_DIR
  static readonly GIT_CLEAN = "💎";
  static readonly GIT_DIRTY = "🚧";
  static readonly GIT_STAGED = "📤";
  static readonly COST = "💵";
  static readonly LINES = "📝";
  static readonly DURATION = "⏳";
  static readonly SUBAGENT = "🔍";
  static readonly EFFORT = "💪";
  static readonly THINKING = "💭";
  static readonly FAST_MODE = "💨";
  static readonly WORKTREE = "🌳";
  static readonly PULL_REQUEST = "🔀";
  static readonly SESSION = "📌";
}
