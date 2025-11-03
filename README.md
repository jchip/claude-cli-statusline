# Claude CLI Statusline

A TypeScript statusline for Claude CLI that displays project info, git status, model, and context usage with color-coded indicators.

## Installation

1. Ensure you have [Bun](https://bun.sh) installed

### `bunx` and npm package

2. Add to your Claude config (`~/.claude/settings.json` or your project's `.claude/settings.json`):

```json
{
  "statusLine": {
    "type": "command",
    "command": "bunx claude-cli-statusline"
  }
}
```

### Manually Clone/Copy

2. Clone or copy this repo to your home directory (e.g., `~/claude-cli-statusline`)
3. Add to your Claude config (`~/.claude/settings.json` or your project's `.claude/settings.json`):

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

```
📦 ~/path/to/root › 📁 relative/dir 🐙 📦 ⎇ branch 🧠 Model ⏬ 89%✦67%💫200K
```

**Icons:**

- 📦 Project root directory
- 📁 Current relative directory
- 🐙 📦 Git repo (octopus + box when repo name matches root directory)
- 🐙 repo-name Git repo (octopus + name when repo name differs from root)
- ⎇ Git branch (🟢 green if in repo, 🟡 yellow if no repo)
  - ∅ No git repository
- 🧠 Model name
- ⏬ Context display: `89%✦67%⚡️200K`
  - First percentage (89%): Total remaining context
  - ✦ separator
  - Second percentage (67%): Remaining before auto-compact
  - ⚡️ separator or 💫 if context was compacted (auto or manual)
  - Max context window (200K) - configurable in config file

**Context Colors:**

- 🟢 Green: >65% remaining
- 🟡 Yellow: 45-65% remaining
- 🟠 Orange: 20-45% remaining
- 🔴 Red: <20% remaining

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

## Config

**The config is reloaded on every statusline update**, so you can modify it while Claude CLI is running.

### Default Config File

Create `statusline-config.json` in the script directory with:

```json
{
  "context-color-levels": [65, 45, 20],
  "model-context-windows": {
    "claude-sonnet-4-5-20250929": 200000,
    "claude-sonnet-4-20250514": 200000,
    "claude-opus-4-20250514": 200000,
    "claude-3-5-sonnet-20241022": 200000,
    "claude-3-5-sonnet-20240620": 200000,
    "claude-3-opus-20240229": 200000,
    "claude-3-sonnet-20240229": 200000,
    "claude-3-haiku-20240307": 200000
  },
  "compact-buffer": 45000,
  "save-sample": {
    "enable": false,
    "filename": "sample-input.json"
  }
}
```

### Config File Search Order

When using relative paths (default or via `--config`), files are searched in:

1. **Project**: `.claude/<filename>` in workspace project directory
2. **User**: `~/.claude/<filename>` in home directory
3. **Script**: `<filename>` in statusline script directory

### `compact-buffer`

The number of tokens to reserve as a buffer before auto-compact. Claude CLI automatically compacts the conversation when remaining tokens reach this threshold.

**Default:** `45000` tokens

This setting affects the second percentage in the display (e.g., `89%|67%`):

- First percentage: Total remaining context (89% = 120K tokens remaining)
- Second percentage: Remaining before auto-compact (67% = 30K tokens until compact at 45K buffer)

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

### Transcript Caching

The statusline automatically caches transcript analysis results in a `.statusline` directory next to the transcript file. This provides:

- **Incremental updates**: Only new lines are analyzed on each run
- **Fast startup**: Cached results are reused and extended as the session continues
- **Session persistence**: Cache persists across auto-compacts (same session, same cache)
- **Automatic reset**: New session (via `/reset`) creates a new transcript and cache file

The cache stores:

- Last analyzed line number
- Last token count
- Transcript modification time
- Complete history of all analyzed entries (line number + token count)
- **Statusline input data** (the complete JSON input from Claude CLI)
- **Statusline output string** (the formatted statusline that was displayed)

This comprehensive cache allows for:

- **Detecting auto-compact events** (sudden drops in token count)
- **Analyzing token usage patterns** over time
- **Debugging context issues** with full input data
- **Debugging display issues** with the actual output string
- **Eliminating need for separate sample files** - the cache includes everything

Cache location: `~/.claude/projects/<project>/.statusline/<session-id>.jsonl.cache.json`

This makes the statusline extremely fast even with large transcript files (1MB+), while providing complete debugging information including the exact output that was displayed.

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

## How it works

The script calculates context usage by:

1. Reading the transcript file (JSONL format) from the path provided by Claude CLI
2. Parsing each line to find `message.usage` objects containing token counts
3. Summing up: `input_tokens + cache_creation_input_tokens + cache_read_input_tokens`
4. Comparing against the model's context window (200k tokens for current models)
5. Displaying the remaining percentage with color-coded visual indicators

**Supported Models:**

- Claude Sonnet 4.5 (200k context)
- Claude Opus 4 (200k context)
- Claude 3.5 Sonnet (200k context)
- Claude 3 Opus/Sonnet/Haiku (200k context)

## Debugging

If the context usage shows "—" instead of a percentage, use the debug script to see what data is available:

### Step 1: Temporarily switch to debug mode

Edit your Claude config to use the debug script:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/claude-cli-statusline/debug.ts"
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
