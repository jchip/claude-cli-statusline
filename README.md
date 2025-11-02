# Claude CLI Statusline

A TypeScript statusline for Claude CLI that displays project info, git status, model, and context usage with color-coded indicators.

## Installation

1. Ensure you have [Bun](https://bun.sh) installed
2. Clone or copy this repo to your home directory (e.g., `~/claude-cli-statusline`)
3. Add to your Claude config (`~/.claude/config.json` or your project's `.claude/config.json`):

```json
{
  "statusLine": {
    "type": "command",
    "command": "bun ~/claude-cli-statusline/index.ts"
  }
}
```

**Note:** Adjust the path if you installed it elsewhere.

## What it shows

```
📦 ~/path/to/root › 📁 relative/dir 🐙 📦 ⎇ branch 🧠 Model ⏬ 52%
```

**Icons:**
- 📦 Project root directory
- 📁 Current relative directory
- 🐙 📦 Git repo (octopus + box when repo name matches root directory)
- 🐙 repo-name Git repo (octopus + name when repo name differs from root)
- ⎇ Git branch (🟢 green if in repo, 🟡 yellow if no repo)
- ∅ No git repository
- 🧠 Model name
- ⏬ Context remaining (color-coded percentage)

**Context Colors:**
- 🟢 Green: >65% remaining
- 🟡 Yellow: 45-65% remaining
- 🟠 Orange: 20-45% remaining
- 🔴 Red: <20% remaining

## Options

You can pass options to customize the statusline behavior:

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
