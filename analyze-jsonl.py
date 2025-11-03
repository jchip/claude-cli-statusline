#!/usr/bin/env python3
import json
import sys

filename = sys.argv[1] if len(sys.argv) > 1 else "6ec59c23-a43e-49bc-a6a6-3cd430a74a05.jsonl"

with open(filename, 'r') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}\n")

# Track token usage
entries = []
for i, line in enumerate(lines, 1):
    try:
        data = json.loads(line)
        usage = data.get('message', {}).get('usage', {})
        if usage:
            input_tokens = usage.get('input_tokens', 0)
            cache_creation = usage.get('cache_creation_input_tokens', 0)
            cache_read = usage.get('cache_read_input_tokens', 0)
            total = input_tokens + cache_creation + cache_read
            
            if total > 0:
                entries.append({
                    'line': i,
                    'total': total,
                    'input': input_tokens,
                    'cache_creation': cache_creation,
                    'cache_read': cache_read,
                    'remaining_pct': round((200000 - total) / 200000 * 100)
                })
    except:
        pass

# Show last 20 entries with tokens
print("Last 20 entries with token usage:")
for entry in entries[-20:]:
    print(f"Line {entry['line']:>4}: {entry['total']:>7} tokens "
          f"(input:{entry['input']:>6}, cache_cr:{entry['cache_creation']:>6}, cache_rd:{entry['cache_read']:>6}) "
          f"→ {entry['remaining_pct']:>2}% remaining")

# Detect compaction
print("\n🔍 Detecting auto-compact events (>30% drop in tokens):")
for i in range(1, len(entries)):
    prev = entries[i-1]['total']
    curr = entries[i]['total']
    if prev > 0 and curr < prev * 0.7:
        drop_pct = round((1 - curr/prev) * 100)
        print(f"\n🔄 COMPACT at line {entries[i]['line']}:")
        print(f"   Before: {prev:>7} tokens ({entries[i-1]['remaining_pct']}% remaining)")
        print(f"   After:  {curr:>7} tokens ({entries[i]['remaining_pct']}% remaining)")
        print(f"   Drop:   {prev-curr:>7} tokens ({drop_pct}%)")