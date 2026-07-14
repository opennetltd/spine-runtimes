# Circular Reference Display Enhancement
**Status:** Done
**Agent PID:** 67832

## Original Todo
<circular> should include the type and a unique id for the object, so i can quckly understand what's been omitted navigate to it

## Description
Replace "<circular>" with deterministic object identifiers in Spine serializers. The implementation uses a hybrid approach: objects with name properties use "<ObjectType-name>" format (e.g. "<EventData-walk>"), while objects without names use numbered IDs "<ObjectType-1>", "<ObjectType-2>", etc. This ensures identical output across Java/C++ by using deterministic reference strings that are generated only when objects are first encountered.

## Implementation Plan
- [x] Update Java generator script - Modified `tests/src/generate-java-serializer.ts` to use Map<Object, String> visitedObjects with `nextId` counter, generating name-based or numbered reference strings
- [x] Update C++ generator script - Modified `tests/src/generate-cpp-serializer.ts` to use HashMap<void*, String> with `_nextId` counter, matching Java logic with proper Spine String API usage
- [x] Regenerate serializers - Generated updated Java and C++ SkeletonSerializer classes with new circular reference handling
- [x] Fix deterministic IDs - Implemented hybrid system: `<Type-name>` for named objects, `<Type-N>` for unnamed objects, ensuring identical output across languages
- [x] Update test runner - Test runner handles new circular reference format correctly
- [x] Automated test: Serialization tests pass with no regressions
- [x] User test: Circular references now show meaningful format like `<EventData-walk>` or `<Animation-1>` instead of `<circular>`
- [x] Add reference string field: Include refString as first field in each object's JSON to enable quick navigation from circular references to full objects

## Notes
### Implementation Details:
- **Circular Reference Logic**: Changed from simple boolean tracking to String-based reference storage
- **Reference String Generation**: Only occurs when object is first encountered (after cycle detection check)
- **Name Detection**: Uses `p.getter === 'getName()' && p.valueType === 'String'` to identify objects with meaningful names
- **Deterministic Numbering**: Both Java and C++ use identical counter logic, ensuring same numbered IDs for unnamed objects
- **Types with Names**: BoneData, EventData, IkConstraintData, PathConstraintData, PhysicsConstraintData, Animation, and attachment types
- **Output Format**: 
  - Named: `<EventData-walk>`, `<BoneData-head>`, `<Animation-run>`
  - Unnamed: `<TrackEntry-1>`, `<Bone-2>`, `<SliderTimeline-3>`
- **Navigation Enhancement**: Each serialized object includes `"refString"` as its first field, making it easy to jump from circular reference to full object definition

### Commands:
- `tests/generate-serializers.sh` -> generates the serializers
- `tests/test.sh cpp -s spineboy -f` -> compiles and runs the tests, and outputs whether the generated json files are identical