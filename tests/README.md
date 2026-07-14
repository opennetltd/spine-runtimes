# Spine Runtimes Snapshot Testing

This test suite implements snapshot testing to ensure all Spine runtime implementations produce identical outputs to the Java reference implementation (spine-libgdx).

## Why Snapshot Testing?

When porting the Spine runtime to different languages, subtle bugs can be introduced - a constraint might be calculated incorrectly, the order of operations might have been ported incorrectly, or a default value might differ. Traditional unit tests can't catch all these discrepancies.

We use snapshot testing to solve this. Each runtime serializes its entire object graph to a standardized format, allowing byte-for-byte comparison between the reference implementation and ports. If outputs differ, we know exactly where the port diverged from the reference.

## The Challenge: Automatic Serializer Generation

To serialize the complete object graph, we need serializers that output every field and getter from every type in the runtime. Writing these by hand is:
- Tedious and error-prone
- Likely to miss fields or getters
- Difficult to maintain as the API evolves

We thus implement **automatic serializer generation** using API analysis and code generation.

## How It Works

### 1. API Analysis and core generation
We use [`lsp-cli`](https://github.com/badlogic/lsp-cli) to analyze the Java reference implementation:
```bash
./generate-serializers.sh
```

This process:
1. **Analyzes Java API** (`analyze-java-api.ts`): Uses Language Server Protocol to discover all types, fields, and getters in spine-libgdx (`tests/output/spine-libgdx-symbols.json`)
2. **Generates IR** (`generate-serializer-ir.ts`): Creates an enriched Intermediate Representation with all serialization metadata (`tests/output/analysis-result.json`)
3. **Generates Serializers**: Language-specific generators create serializers from the IR:
   - `generate-java-serializer.ts` → `spine-libgdx/spine-libgdx-tests/src/com/esotericsoftware/spine/utils/SkeletonSerializer.java`
   - `generate-cpp-serializer.ts` → `spine-cpp/tests/SkeletonSerializer.h`
   - C, C#, Dart, Haxe, Swift and TypeScript TBD

The IR contains everything needed to generate identical serializers across languages:
- Type hierarchies and inheritance chains
- All properties (fields and getters) per type
- Enum value mappings
- Abstract type handling with instanceof chains
- Property categorization (primitive, object, array, enum)

### 2. Snapshot Testing

Each runtime has a `HeadlessTest` that:
1. **Loads** a skeleton file and atlas
2. **Creates** a SkeletonData structure and serializes it
3. **Constructs** a Skeleton and AnimationState from the SkeletonData
4. **Applies** an animation (if specified)
5. **Serializes** the resulting Skeleton and AnimationState

Run tests with:
```bash
# Test any runtime
./test.sh <language> <skeleton-path> <atlas-path> [animation-name]

# Compare Java vs C++ for spineboy's walk animation
./test.sh java ../examples/spineboy/export/spineboy-pro.skel ../examples/spineboy/export/spineboy-pma.atlas walk > java-output.json
./test.sh cpp ../examples/spineboy/export/spineboy-pro.skel ../examples/spineboy/export/spineboy-pma.atlas walk > cpp-output.json
diff java-output.json cpp-output.json
```

Languages: `java`, `cpp`, `c`, `ts`

## Debugging Port Failures

When outputs differ, you can pinpoint the exact issue:

2. **Value differences**: Different calculations or default values
3. **Animation differences**: Issues in constraint evaluation or animation mixing

Example: If a transform constraint is ported incorrectly, the skeleton state after animation will differ, showing exactly which bones have wrong transforms. This is a starting point for debugging.

## Output Format

The serializers produce consistent JSON with:
- All object properties in deterministic order
- Floats formatted to 6 decimal places
- Enums as strings
- Circular references marked as `"<circular>"`
- Type information for every object

Example output structure:
```
=== SKELETON DATA ===
{
  "type": "SkeletonData",
  "bones": [...],
  "slots": [...],
  ...
}
=== SKELETON STATE ===
{
  "type": "Skeleton",
  "bones": [...],
  "slots": [...],
  ...
}
=== ANIMATION STATE ===
{
  "type": "AnimationState",
  "tracks": [...],
  ...
}
```

## Project Structure

```
tests/
├── src/                          # TypeScript source files
│   ├── headless-test-runner.ts   # Main test runner
│   ├── analyze-java-api.ts       # Java API analyzer
│   ├── generate-serializer-ir.ts # IR generator
│   ├── generate-java-serializer.ts # Java serializer generator
│   ├── generate-cpp-serializer.ts  # C++ serializer generator
│   └── types.ts                  # Shared TypeScript types
├── test.sh                       # Main test script
├── generate-serializers.sh       # Regenerate all serializers
└── output/                       # Generated files (gitignored)
```

## HeadlessTest Locations

- **Java**: `spine-libgdx/spine-libgdx-tests/src/com/esotericsoftware/spine/HeadlessTest.java`
- **C++**: `spine-cpp/tests/HeadlessTest.cpp`
- **C**: `spine-c/tests/headless-test.c`
- **TypeScript**: `spine-ts/spine-core/tests/HeadlessTest.ts`