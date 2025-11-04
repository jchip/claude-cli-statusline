# Animation Features

The statusline includes optional animation features to make it feel more alive and provide visual feedback about trends.

## Features

### 1. Spinner Animation
Replaces the static ⏬ icon with an animated braille spinner that rotates smoothly.

**Example:**
```
⠸ 75%✦52%⚡️200K
```

The spinner animates automatically whenever Claude CLI updates the statusline.

### 2. Trend Arrow
Shows the direction of context usage change compared to the previous update.

**Arrows:**
- `↗` - Context usage increased
- `→` - Context usage stayed flat (< 0.5% change)
- `↘` - Context usage decreased
- `·` - No previous data yet

**Example:**
```
⏬ 75%✦52%⚡️200K ↗
```

### 3. Sparkline
Displays a mini bar chart of recent context usage (last 8 data points).

**Example:**
```
⏬ 75%✦52%⚡️200K ↗▂▄▅▆█
```

The sparkline provides at-a-glance trend visualization without cluttering the display.

## Configuration

Animations are **disabled by default** to maintain a clean, static statusline. Enable them via configuration:

### Enable in Config File

Add to `.claude/statusline-config.json` (project) or `~/.claude/statusline-config.json` (user):

```json
{
  "animations": {
    "enabled": true,
    "show-trend": true,
    "show-sparkline": true
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable spinner animation |
| `show-trend` | boolean | `false` | Show trend arrow |
| `show-sparkline` | boolean | `false` | Show mini bar chart |

### Example Configurations

**Minimal animation (just spinner):**
```json
{
  "animations": {
    "enabled": true
  }
}
```

**Full animation suite:**
```json
{
  "animations": {
    "enabled": true,
    "show-trend": true,
    "show-sparkline": true
  }
}
```

**Trend only (no spinner):**
```json
{
  "animations": {
    "enabled": false,
    "show-trend": true,
    "show-sparkline": false
  }
}
```

## State Persistence

Trend and sparkline features require minimal state persistence to track history:

**State File:** `~/.claude/.statusline.state.json`

The state file stores:
- Last percentage value
- Series of recent percentages (max 24 entries)
- Last update timestamp

State is automatically managed and requires no user intervention. It persists across Claude CLI sessions.

## Visual Examples

### Static (default)
```
⏬ 75%✦52%⚡️200K
```

### With spinner only
```
⠸ 75%✦52%⚡️200K
```

### With trend arrow
```
⏬ 75%✦52%⚡️200K ↗
```

### With sparkline
```
⏬ 75%✦52%⚡️200K ▂▄▅▆█
```

### Full animation suite
```
⠸ 75%✦52%⚡️200K ↗▂▄▅▆█
```

## Performance

Animations are lightweight and have minimal performance impact:

- **Spinner:** Pure calculation based on `Date.now()`, no I/O
- **Trend/Sparkline:** Single file read/write (~100 bytes) per update
- **Memory:** < 1KB for state storage

All animations are designed to work within Claude CLI's periodic update model.

## Implementation Details

### Spinner Frames
Uses braille characters for smooth animation:
```
⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏
```

Frame changes every 120ms based on system time, creating consistent animation across updates.

### Trend Calculation
Compares current percentage to previous:
- Delta > +0.5% → `↗`
- Delta < -0.5% → `↘`
- Delta within ±0.5% → `→`

### Sparkline Normalization
Values are normalized to 0-7 range and mapped to bar characters:
```
▁ ▂ ▃ ▄ ▅ ▆ ▇ █
```

Shows last 8 values, automatically scales to fit min/max range.

## Troubleshooting

### Spinner not animating
**Cause:** Terminal doesn't support braille characters
**Solution:** Disable with `"enabled": false` in config

### Trend arrow shows wrong direction
**Cause:** State file corruption or first run
**Solution:** Delete `~/.claude/.statusline.state.json` to reset

### Sparkline looks flat
**Cause:** Not enough variation in context usage
**Solution:** This is normal - sparkline auto-scales to available range

### State file location
If unsure where state is stored:
```bash
ls -la ~/.claude/.statusline.state.json
```

To reset state:
```bash
rm ~/.claude/.statusline.state.json
```

## Future Enhancements

Possible future features (not currently implemented):
- Custom spinner styles selection
- Configurable sparkline length
- Color-coded sparkline bars
- Animation speed control
- Pulse effect on rapid changes
