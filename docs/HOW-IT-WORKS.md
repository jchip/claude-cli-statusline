# How It Works

## Context Usage Calculation

The statusline calculates context usage by:

1. Reading the transcript file (JSONL format) from the path provided by Claude CLI
2. Parsing each line to find `message.usage` objects containing token counts
3. Summing up: `input_tokens + cache_creation_input_tokens + cache_read_input_tokens`
4. Comparing against the model's context window (200k tokens for current models)
5. Displaying the remaining percentage with color-coded visual indicators

## Architecture

The statusline uses a modular architecture with:

### Components (`src/components/`)

- **GitInfo**: Git repository and branch information
- **WorkDir**: Project root and current directory display
- **ModelInfo**: Model name display
- **ContextInfo**: Context usage calculation and display
- **StatusLineComponents**: Aggregates all components into the final statusline

### Services (`src/services/`)

- **ConfigLoader**: Loads and merges configuration from multiple sources
- **CacheManager**: Manages transcript analysis caching for performance
- **SessionAnalyzer**: Analyzes transcript files and detects auto-compact events

### Core (`index.ts`)

The main entry point that:
1. Reads input JSON from stdin
2. Loads configuration
3. Delegates to StatusLineComponents to build the statusline
4. Outputs the formatted statusline to stdout

## Supported Models

- Claude Sonnet 4.5 (200k context)
- Claude Opus 4 (200k context)
- Claude 3.5 Sonnet (200k context)
- Claude 3 Opus/Sonnet/Haiku (200k context)

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
