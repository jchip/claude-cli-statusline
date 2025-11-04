# Testing Documentation

## Test Suite

The project has a comprehensive test suite built with Bun's testing framework.

### Running Tests

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage

# Run specific test file
bun test test/utils.test.ts

# Watch mode
bun test --watch
```

### Test Statistics

- **119 passing tests** across 9 test files
- **224 expect() assertions**
- **~110ms** total runtime
- **High coverage** on core components

### Test Files

```
test/
├── utils.test.ts                    # Utility functions
├── WorkDir.test.ts                  # WorkDir component
├── GitInfo.test.ts                  # GitInfo component
├── ModelInfo.test.ts                # ModelInfo component
├── ContextInfo.test.ts              # ContextInfo component
├── StatusLineComponents.test.ts     # Integration tests
├── ConfigLoader.test.ts             # Config management
├── CacheManager.test.ts             # Cache management
└── SessionAnalyzer.test.ts          # Session analysis
```

## Test Categories

### Unit Tests

Individual component and function tests:

- **Utils**: Path manipulation, token formatting, clamping
- **WorkDir**: Directory display and relative paths
- **GitInfo**: Git repository and branch detection
- **ModelInfo**: Model lookup and context window resolution
- **ContextInfo**: Token calculation and color coding

### Integration Tests

Tests that combine multiple components:

- **StatusLineComponents**: Full statusline rendering
- **SessionAnalyzer**: Transcript parsing with caching
- **ConfigLoader**: Configuration hierarchy and merging

### Feature Tests

Tests for specific features:

- CLI argument parsing (`--config`, `--context-levels`, `--save-sample`)
- Configuration hierarchy (project → user → system)
- Compact detection (explicit and implicit)
- Incremental caching
- Model context window lookup with indicators

## Test Examples

### Testing a Component

```typescript
import { test, expect } from "bun:test";
import { ContextInfo } from "../src/components/ContextInfo.ts";

test("calculates remaining percent", () => {
  const context = new ContextInfo(50000, 200000, 45000, false, {
    green: 65,
    yellow: 45,
    orange: 20,
  });
  expect(context.remainingPercent).toBe(75);
});
```

### Testing with Mocks

```typescript
import { beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync, existsSync } from "fs";

const testDir = "/tmp/test-data";

beforeEach(() => {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true });
  }
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true });
  }
});
```

### Testing File Operations

```typescript
test("writes cache to file", () => {
  const cache = { lastLine: 5, lastTokenCount: 10000, entries: [] };
  CacheManager.write(transcriptPath, cache);
  expect(existsSync(cachePath)).toBe(true);
});
```

## Coverage Goals

### Current Coverage

| Module | Line Coverage | Function Coverage |
|--------|---------------|-------------------|
| Components | 100% | 100% |
| Utils | 100% | 100% |
| Services | 80-87% | 92-100% |
| Overall | 85%+ | 96%+ |

### Untested Paths

Some paths are intentionally not fully tested:

1. **Error handling**: Git command failures, file system errors
2. **Edge cases**: Non-existent files, malformed JSON
3. **External dependencies**: Git binary, file system permissions

These are covered through integration testing and manual testing.

## Writing New Tests

### Component Test Template

```typescript
import { describe, test, expect } from "bun:test";
import { MyComponent } from "../src/components/MyComponent.ts";

describe("MyComponent", () => {
  test("creates component with properties", () => {
    const component = new MyComponent("value1", "value2");
    expect(component.prop1).toBe("value1");
    expect(component.prop2).toBe("value2");
  });

  test("renders output", () => {
    const component = new MyComponent("test", "data");
    const output = component.render();
    expect(output).toContain("expected-text");
  });

  test("creates from input", () => {
    const input = { field: "value" };
    const component = MyComponent.fromInput(input);
    expect(component.prop1).toBe("value");
  });
});
```

### Service Test Template

```typescript
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { MyService } from "../src/services/MyService.ts";
import { mkdirSync, rmSync, existsSync } from "fs";

describe("MyService", () => {
  const testDir = "/tmp/test-my-service";

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  test("processes data correctly", () => {
    const result = MyService.process(input);
    expect(result).toBeDefined();
  });
});
```

## Continuous Integration

Tests are automatically run on:

- Every commit (local pre-commit hook)
- Pull requests (GitHub Actions)
- Before publishing (npm prepublish script)

## Debugging Tests

### Run Single Test

```bash
bun test test/ContextInfo.test.ts
```

### Add Debug Output

```typescript
test("debug example", () => {
  const result = someFunction();
  console.log("Debug:", result); // Will show in test output
  expect(result).toBe(expected);
});
```

### Use Bun's Debugger

```bash
bun --inspect test
```

## Best Practices

1. **Test behavior, not implementation**: Focus on what the code does, not how
2. **Use descriptive names**: Test names should explain what is being tested
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Keep tests isolated**: Each test should be independent
5. **Clean up resources**: Use beforeEach/afterEach for setup/teardown
6. **Test edge cases**: Empty inputs, null values, boundary conditions
7. **Mock external dependencies**: Use mocks for file system, git commands, etc.

## Future Improvements

- [ ] Add performance benchmarks
- [ ] Add mutation testing
- [ ] Add visual regression tests for output formatting
- [ ] Add fuzzing tests for transcript parsing
- [ ] Increase SessionAnalyzer coverage to 80%+
