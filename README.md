# Claude CLI Statusline

A TypeScript statusline for Claude CLI that displays project info, git status, model, and context usage with color-coded indicators.

[![npm version](https://img.shields.io/npm/v/claude-cli-statusline.svg)](https://www.npmjs.com/package/claude-cli-statusline)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

1. Ensure you have [Bun](https://bun.sh) installed

### `bunx` (Recommended)

2. Add to your Claude config (`~/.claude/settings.json` or your project's `.claude/settings.local.json`):

```json
{
  "statusLine": {
    "type": "command",
    "command": "bunx claude-cli-statusline"
  }
}
```

### Global Installation (Optional)

You can optionally install it globally with Bun to avoid `bunx` downloading it:

```bash
bun add -g claude-cli-statusline
```

### Manually Clone/Copy

2. Clone or copy this repo to your home directory (e.g., `~/claude-cli-statusline`)
3. Add to your Claude config (`~/.claude/settings.json` or your project's `.claude/settings.local.json`):

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/claude-cli-statusline/index.ts"
  }
}
```

Or with a custom config file:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/claude-cli-statusline/index.ts --config=my-config.json"
  }
}
```

**Note:** Adjust the path if you installed it elsewhere.

## What it shows

**Default (`"extend"` layout - single line):**
```
📦 project-name 📁 relative/dir 🐙💎 ⎇ branch 🧠 Model ⏬ 89%✦67%⚡️200K 🔍 Explore 💵 $0.05 ⏱️ 1h23m
```

**Without sub-agent active:**
```
📦 project-name 📁 relative/dir 🐙💎 ⎇ branch 🧠 Model ⏬ 89%✦67%⚡️200K 💵 $0.05 ⏱️ 1h23m
```

**With `"render-layout": "normal"` (basic info only):**
```
📦 project-name 📁 relative/dir 🐙💎 ⎇ branch 🧠 Model ⏬ 89%✦67%⚡️200K 🔍 Explore
```

**With `"render-layout": "layout-2-line"` (two lines):**
```
📦 project-name 📁 relative/dir
🐙💎 ⎇ branch 🧠 Model ⏬ 89%✦67%⚡️200K 🔍 Explore
```

**Icons:**

- 📦 Project root directory (basename only by default)
  - With `show-project-full-dir: true` in config: shows full path like `~/path/to/project`
- 📁 Current relative directory
- 🐙 Git repo (octopus icon only by default)
  - 💎 Clean working tree (🟢 green) - no uncommitted changes
  - 🛠️ Dirty working tree (🟡 yellow) - has uncommitted changes
  - 📤 Staged changes (🔵 light blue) - changes ready to commit
  - With `show-git-repo-name: true` in config:
    - `🐙💎 📦` when repo name matches directory name
    - `🐙💎 repo-name` when repo name differs from directory name
  - Git repo name is extracted from remote URL (e.g., `git@github.com:user/my-repo.git` → `my-repo`)
- ⎇ Git branch (🟢 green if in repo, 🟡 yellow if no repo)
  - ∅ No git repository
- 🧠 Model name
- ⏬ Context display: `89%✦67%⚡️200K`
  - First percentage (89%): Total remaining context
  - ✦ separator
  - Second percentage (67%): Remaining before auto-compact (calculated as percentage of usable space after buffer)
  - ⚡️ Not compacted or 💫 if context was compacted (auto or manual)
  - Max context window (200K, 1M, etc.) with cyan-colored K/M suffix

**Context Colors:**

- 🟢 Green: >65% remaining
- 🟡 Yellow: 45-65% remaining
- 🟠 Orange: 20-45% remaining
- 🔴 Red: <20% remaining

**Layout:**

The statusline uses a single-line layout by default. You can customize the layout using the `render-layout` config option or the `--layout` CLI flag. See the [render-layout](#render-layout) section for details.

## Animation Features (Optional)

The statusline supports an optional animated spinner with multiple style choices:

**Available spinner styles:**
- `transportation` (default): 🚗 🚕 🚙 🚌 🚎 🚓 🚑 🚒
- `weather`: ☀️ 🌤️ ⛅ 🌥️ ☁️ 🌦️ 🌧️ ⛈️
- `hearts`: ❤️ 🧡 💛 💚 💙 💜 🖤 🤍
- `fruit`: 🍎 🍊 🍋 🍏 🫐 🍇 🍓 🍒
- `planets`: 🌍 🪐 🌎 🌏 🌑 🌒 🌓 🌔
- `circles`: 🔴 🟠 🟡 🟢 🔵 🟣 🟤 ⚫
- `sports`: ⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱
- `flowers`: 🌹 🌺 🌻 🌼 🌷 🌸 💐 🏵️
- `hands`: ✋ 🤚 🖐️ 👌 🤌 🤏
- `arrows`: ➡️ ↗️ ⬆️ ↖️ ⬅️ ↙️ ⬇️ ↘️
- `moon`: 🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘
- `clock`: 🕐 🕑 🕒 🕓 🕔 🕕 🕖 🕗 🕘 🕙 🕚 🕛
- `circular`: ◐ ◴ ◓ ◷ ◑ ◶ ◒ ◵
- `braille`: ⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏
- `dots`: ⠁ ⠂ ⠄ ⡀ ⢀ ⠠ ⠐ ⠈
- `blocks`: ▖ ▘ ▝ ▗

**Example with animations (transportation):**
```
🚗 75%✦52%⚡️200K🚌
```

**Enable animations in config:**

```json
{
  "animations": {
    "enabled": true,
    "spinner": "transportation"
  }
}
```

**Or use CLI:**

```bash
bun ~/claude-cli-statusline/index.ts --spinner=hearts
```

Note: When animations are enabled, the spinner appears after the max context window.

**Note:** Animations are **disabled by default** to maintain a clean, static statusline.

## CLI Options

You can pass options to customize the statusline behavior:

### `--config=<filename>`

Specify a custom config file. If the path is relative, it searches in order:

1. Project `.claude/` directory
2. User `~/.claude/` directory
3. Script directory

**Default:** `statusline-config.json`

**Examples:**

```bash
# Use absolute path
bun ~/claude-cli-statusline/index.ts --config=/path/to/my-config.json

# Use relative path (searches in .claude dirs)
bun ~/claude-cli-statusline/index.ts --config=my-config.json
```

### `--context-levels=green,yellow,orange`

Customize the color thresholds for context usage display. Values must be integers between 0-100 and in descending order.

**Default:** `--context-levels=65,45,20`

**Example:**

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/claude-cli-statusline/index.ts --context-levels=75,50,25"
  }
}
```

This sets:

- Green: >75% remaining
- Yellow: 50-75% remaining
- Orange: 25-50% remaining
- Red: <25% remaining

### `--save-sample[=filename]`

Save the input JSON to a file for debugging purposes.

**Default filename:** `sample-input.json`

**Example:**

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/claude-cli-statusline/index.ts --save-sample"
  }
}
```

Or with custom filename:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/claude-cli-statusline/index.ts --save-sample=debug.json"
  }
}
```

### `--layout=<layout>`

Specify the statusline layout. Can be a predefined layout name or a custom layout name you've defined.

**Predefined layouts:**
- `normal` - Basic info only
- `extend` - Adds cost & duration (default)
- `full` - Everything including lines
- `layout-1-line` - Legacy alias for `normal`
- `layout-2-line` - Two lines

**Example:**

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/claude-cli-statusline/index.ts --layout=extend"
  }
}
```

**Note:** This CLI flag overrides the `render-layout` setting in the config file.

### `--auto-width=<columns>`

Enable auto-wrap mode. All widgets from the current layout are flattened into a
single ordered list and packed into balanced lines around the given width.
Wrapping only kicks in when the content exceeds the width — otherwise everything
stays on one line.

Width is measured in terminal cells: ANSI color codes are ignored and emoji are
counted as 2 cells. The width is a **soft target**, not a hard cap: line breaks
are chosen to minimize total raggedness, and a line may spill slightly over the
target when that absorbs a widget (e.g. a short `cwd`) that would otherwise be
stranded alone on its own line. A widget wider than the target always overflows
(it can't be split). This avoids both lopsided and orphaned lines.

**Example:**

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/claude-cli-statusline/index.ts --layout=full --auto-width=50"
  }
}
```

**Note:** This CLI flag overrides the `auto-wrap-width` setting in the config file. Set to `0` or omit to disable.

### `--spinner=<style>`

Specify the animated spinner style. Choose from 16 different styles.

**Available styles:**
`transportation`, `weather`, `hearts`, `fruit`, `planets`, `circles`, `sports`, `flowers`, `hands`, `arrows`, `moon`, `clock`, `circular`, `braille`, `dots`, `blocks`

**Example:**

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/claude-cli-statusline/index.ts --spinner=hearts"
  }
}
```

**Note:** This CLI flag overrides the `animations.spinner` setting in the config file. Animations must be enabled separately with `animations.enabled: true` in your config.

## Available Widgets

The statusline displays information through widgets that can be arranged using layouts. Each widget shows a specific metric:

| Widget | Icon | Description |
|--------|------|-------------|
| `project` | 📦 | Project directory name (workspace root) |
| `cwd` | 📁 | Current working directory relative to project root |
| `git` | 🐙 | Git repository status (clean/dirty/staged) and branch name |
| `model` | 🧠 | AI model name (e.g., "Sonnet 4.5") |
| `context` | ⏬ | Context usage (remaining % before full/compact, max tokens) |
| `subagent` | 🔍 | Currently active sub-agent (e.g., "Code-Reviewer", "Explore") |
| `cost` | 💵 | Total session cost in USD (cumulative across context resets) |
| `lines` | 📝 | Lines added/removed during session (vanity metric, doesn't reset with context) |
| `duration` | ⏱️ | Total session duration in hours/minutes (cumulative across context resets) |
| `spinner` | 🚗 | Animated activity spinner (only when `animations.enabled` is true); place it last so the animated glyph has no volatile fields to its right |

**Note on metrics:**
- **Actionable**: `git` status tells you if you need to commit changes, `subagent` shows which specialist is handling the task
- **Informational**: `context` shows when compaction will occur
- **Vanity metrics**: `cost`, `lines`, and `duration` are cumulative session stats that don't reset with `/clear`

## Config

**The config is reloaded on every statusline update**, so you can modify it while Claude CLI is running.

### Default Config File

See [statusline-config.json](statusline-config.json) for the default configuration file with all available options and their default values.

### Config File Search Order

When using relative paths (default or via `--config`), files are searched in:

1. **Project**: `.claude/<filename>` in workspace project directory
2. **User**: `~/.claude/<filename>` in home directory
3. **Script**: `<filename>` in statusline script directory

### `compact-buffer`

The number of tokens to reserve as a buffer before auto-compact. Claude CLI automatically compacts the conversation when remaining tokens reach this threshold.

**Default:** `45000` tokens

This setting affects the second percentage in the display (e.g., `89%✦67%`):

- First percentage: Total remaining context (89% = 178K tokens remaining out of 200K)
- Second percentage: Remaining before auto-compact (67% = percentage of usable space remaining)
  - Calculation: `(usableSpace - used) / usableSpace * 100`
  - Where `usableSpace = maxTokens - compactBuffer`
  - This matches Claude CLI's buffer calculation method

When the second percentage reaches 0%, Claude CLI will auto-compact the conversation, which resets the context and may cause the percentages to jump back up.

### `context-color-levels`

An array of three descending integers [green, yellow, orange] that define the thresholds for context remaining percentage:

- First value: minimum % for green (default: 65)
- Second value: minimum % for yellow (default: 45)
- Third value: minimum % for orange (default: 20)
- Below third value: red

**Note:** CLI flag `--context-levels` overrides these config values.

### `model-context-windows`

A mapping of model IDs to their context window sizes in tokens. This is used to calculate the remaining context percentage from the transcript usage data.

Add entries here if you need to support additional models or if Claude releases models with different context windows.

**Default:** 200,000 tokens for unknown models

### `display-name-model-context-windows`

A mapping of model display names to their context window sizes. Used as a fallback when model ID is not found.

**Example:**

```json
{
  "display-name-model-context-windows": {
    "Sonnet 4.5": 200000,
    "Opus 4": 200000,
    "Haiku 4": 200000
  }
}
```

When a context window is found via display name, it shows with a 🏷️ indicator: `⏬ 60%✦15%💫200K🏷️`

### `default-context-window`

The default context window size to use when neither model ID nor display name is found in the config.

**Default:** `200000` tokens

When using the default, it shows with a ⚙️ indicator: `⏬ 60%✦15%💫200K⚙️`

## Performance Optimizations

### Config File Hierarchy

You can place configuration files at different levels:

**Project-level** (`.claude/statusline-config.json`):

```bash
cd /path/to/your/project
mkdir -p .claude
cat > .claude/statusline-config.json << 'EOF'
{
  "context-color-levels": [70, 50, 25],
  "save-sample": {
    "enable": true,
    "filename": "debug-input.json"
  }
}
EOF
```

**User-level** (`~/.claude/statusline-config.json`):

```bash
mkdir -p ~/.claude
cat > ~/.claude/statusline-config.json << 'EOF'
{
  "context-color-levels": [65, 45, 20],
  "model-context-windows": {
    "claude-sonnet-4-5-20250929": 200000
  }
}
EOF
```

This allows you to have different settings per project while maintaining user-wide defaults.

### `save-sample`

An object to control saving the input JSON on every statusline update. Useful for debugging or analyzing the data structure Claude CLI provides.

**Properties:**

- `enable` (boolean): Enable/disable sample saving
- `filename` (string): The filename to use when saving

**Default:**

```json
{
  "enable": false,
  "filename": "sample-input.json"
}
```

**Note:** You can change `enable` to `true` while Claude CLI is running, and the next statusline update will start saving samples. The CLI flag `--save-sample[=filename]` overrides these config values.

### `show-git-repo-name`

Controls whether to show the git repository name in the statusline.

**Default:** `false` (disabled)

When `false` (default):
- Shows only: `🐙 ⎇ branch` (octopus icon + branch)

When `true`:
- Shows `🐙 📦 ⎇ branch` if repo name matches directory name
- Shows `🐙 repo-name ⎇ branch` if repo name differs from directory name

**Git repo name detection:**
- First tries to extract from remote URL: `git remote get-url origin`
- For example: `git@github.com:user/my-repo.git` → `my-repo`
- Falls back to directory basename if no remote is configured

**Example:**

```json
{
  "show-git-repo-name": true
}
```

**Why disabled by default:** This keeps the statusline shorter and cleaner, as the repository name is often redundant with the project directory name. Enable it if you work in directories where the folder name differs from the actual git repository name (e.g., cloned with a different name, renamed directory, or forked repos).

### `show-project-full-dir`

Controls whether to show the full project directory path or just the basename.

**Default:** `false` (disabled - shows basename only)

When `false` (default):
- Shows only basename: `📦 project-name`

When `true`:
- Shows full path with home shortening: `📦 ~/path/to/project-name`

**Example:**

```json
{
  "show-project-full-dir": true
}
```

**Why disabled by default:** The basename is usually sufficient and keeps the statusline more concise. Enable it if you need to distinguish between multiple projects with the same name in different locations.

### `git-status-icons`

Customize the icons used to indicate git repository status (staged/clean/dirty).

**Default:**
```json
{
  "clean": "💎",
  "dirty": "🛠️",
  "staged": "📤"
}
```

**Status combinations:**
- Clean (no changes): `🐙💎` (octopus + gem in green)
- Unstaged changes: `🐙🛠️` (octopus + tools in yellow)
- Staged changes: `🐙📤` (octopus + outbox in light blue)
- Staged + unstaged: `🐙📤🛠️` (staged with additional unstaged changes)

**Example (using different icons):**

```json
{
  "git-status-icons": {
    "clean": "✓",
    "dirty": "✗",
    "staged": "→"
  }
}
```

**Note:** The icons are displayed directly adjacent to the octopus git icon (🐙) with no space between them. When there are staged changes, only the staged icon (📤) is shown. The dirty icon (🛠️) is only shown if there are unstaged changes. The clean icon (💎) is only shown when there are no changes at all (no staged, no unstaged).

### `render-layout`

Controls the layout and ordering of statusline components. You can use predefined layouts or create custom layouts.

**Default:** `"extend"` (single line with cost and duration)

**Predefined Layouts:**
- `"normal"` - Basic info only: `["project cwd git model context subagent spinner"]`
- `"extend"` - Adds cost & duration: `["project cwd git model context subagent cost duration spinner"]` (default)
- `"full"` - Everything including lines: `["project cwd git model context subagent cost lines duration spinner"]`
- `"layout-1-line"` - Legacy alias for `normal`
- `"layout-2-line"` - Two lines: `["project cwd", "git model context subagent spinner"]`

The trailing `spinner` token renders only when `animations.enabled` is true; otherwise it is omitted.

**Available widgets for custom layouts:**

You can use any combination of: `project`, `cwd`, `git`, `model`, `context`, `subagent`, `cost`, `lines`, `duration`, `spinner`

See the [Available Widgets](#available-widgets) section for details on what each widget displays.

**Examples:**

Using predefined layouts:
```json
{
  "render-layout": "normal"  // Basic info only
}
```

```json
{
  "render-layout": "extend"  // Adds cost & duration (default)
}
```

```json
{
  "render-layout": "full"  // Everything including lines
}
```

```json
{
  "render-layout": "layout-1-line"  // Legacy alias for "normal"
}
```

Custom single line:
```json
{
  "render-layout": ["project cwd git model context"]
}
```

Custom two lines:
```json
{
  "render-layout": [
    "project cwd",
    "git model context"
  ]
}
```

Custom order (context first):
```json
{
  "render-layout": [
    "context model",
    "project cwd git"
  ]
}
```

Minimal (git and context only):
```json
{
  "render-layout": ["git context"]
}
```

### `auto-wrap-width`

Enable auto-wrap mode by setting a target width (in terminal columns). When set
to a positive number, the widgets from `render-layout` are flattened into a
single ordered list and packed into **balanced** lines that stay within the
width. Wrapping only happens when the content exceeds the width — otherwise it
stays on one line.

**Default:** unset (disabled)

Width is measured in visible terminal cells: ANSI color codes are ignored and
emoji/wide glyphs count as 2 cells. The width is a **soft target** rather than a
hard cap: line breaks are chosen to minimize total raggedness (how far each line
sits from the target), and a line may spill slightly over the target when that
absorbs a widget that would otherwise be stranded alone on a short line. This
spreads content evenly and avoids orphaned lines. A widget wider than the target
always overflows, since it can't be split.

**Example:**

```json
{
  "render-layout": "full",
  "auto-wrap-width": 50
}
```

With the `full` layout and a width of `50`, a long status line is split into
balanced lines, for example:

```
📦 claude-cli-statusline 📁 src/components
🐙🛠️ ⎇ main 🧠 Opus 4.8 ⏬ 88%⚡️1M🚀
💵 $1.23 📝 +120/−45 ⏱️ 1h
```

**Note:** The `--auto-width=<columns>` CLI flag overrides this setting. Order of
the widgets comes from `render-layout`; the width only controls wrapping.

## Model Isolation Feature

**Problem:** Claude CLI updates the user-level settings (`~/.claude/settings.json`) whenever you change models. This causes all other CLI sessions to immediately pick up the model change, which is often unexpected behavior.

**Solution:** The statusline automatically isolates model selections per project by moving them from user-level to project-level settings.

### How it works

When you change models in Claude CLI:

1. **User picks a specific model** (e.g., Sonnet, Opus):
   - Statusline detects the user settings file was recently modified (within 5 seconds)
   - Moves `model` from `~/.claude/settings.json` to `.claude/settings.local.json` in your project
   - Clears it from user settings so other projects aren't affected
   - Result: This model choice only affects the current project

2. **User picks "Default"**:
   - Statusline detects user settings was recently modified with no model set
   - Removes `model` from project-local settings if it was set before user settings
   - Result: Project returns to using whatever default is configured

### Benefits

- ✓ Model selections are project-specific
- ✓ Multiple Claude CLI sessions can use different models without interfering
- ✓ Other projects maintain their own model preferences
- ✓ Completely automatic - no manual file editing needed

### Configuration

This feature is enabled by default via the `clear-model` config option:

```json
{
  "clear-model": true
}
```

To disable (not recommended):

```json
{
  "clear-model": false
}
```

**Why enabled by default:** This fixes unexpected behavior where changing models in one terminal session affects all other sessions. Most users want project-specific model selections.

## Development

### Testing

Run the test suite:

```bash
bun test
```

Run with coverage:

```bash
bun coverage
```

### Building

The project uses Bun as the runtime and doesn't require compilation. All TypeScript files are executed directly.

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Debugging

If the context usage shows "—" instead of a percentage, use the debug script to see what data is available:

### Step 1: Temporarily switch to debug mode

Edit your Claude config to use the debug script:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/claude-cli-statusline/tools/debug.ts"
  }
}
```

### Step 2: Run Claude CLI

Start a Claude CLI session and observe the debug output. It will show:

- The complete JSON structure passed to the statusline
- Whether a `budget` field exists
- The transcript file path

### Step 3: Check the transcript file

If a transcript path is shown, you can manually inspect it:

```bash
cat /path/to/transcript.json | jq .
```

Look for fields like:

- `usage`
- `metadata`
- `budget`
- `messages[].usage`
- Any fields containing "token", "context", or "budget"

### Step 4: Update the field names

If you find token usage data in a different location, update `index.ts` to include those field names in the appropriate arrays:

- `maxKeys` - for maximum token limits
- `usedKeys` - for tokens used
- `remainingKeys` - for tokens remaining
- `remainingPctKeys` - for direct percentage values

### Step 5: Switch back to normal statusline

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/claude-cli-statusline/index.ts"
  }
}
```
