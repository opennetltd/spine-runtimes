# spine-c-new codegen should not special case spine_bool but use stdbool instead

**Status:** Refining
**Created:** 2025-07-08T22:03:22
**Agent PID:** 23353

## Original Todo
- spine-c-new codegen should not special case spine_bool but use stdbool instead.

## Description
The spine-c-new codegen currently defines `spine_bool` as `int32_t` for C compatibility. This task involves updating the codegen to use the standard C99 `bool` type from `<stdbool.h>` instead of the custom `spine_bool` typedef. This will make the C API more modern and standard-compliant.

Currently:
- `spine_bool` is typedef'd as `int32_t` in base.h
- The codegen maps C++ `bool` to `spine_bool` throughout
- All generated code uses `spine_bool` instead of standard `bool`

The change will:
- Use standard C99 `bool` from `<stdbool.h>`
- Remove the special-casing in the codegen
- Make the API more standards-compliant

## Implementation Plan
- [ ] Update typedef in base.h to use stdbool.h instead of int32_t (spine-c-new/src/base.h:65)
- [ ] Update type mapping in types.ts from 'spine_bool' to 'bool' (spine-c-new/codegen/src/types.ts:70)
- [ ] Update pointer type handling for bool* in types.ts (spine-c-new/codegen/src/types.ts:148-149)
- [ ] Update reference type handling for bool& in types.ts (spine-c-new/codegen/src/types.ts:176)
- [ ] Update array element mapping in array-scanner.ts (spine-c-new/codegen/src/array-scanner.ts:103)
- [ ] Update return type check in array-generator.ts (spine-c-new/codegen/src/generators/array-generator.ts:148)
- [ ] Update default values for bool in array-generator.ts (spine-c-new/codegen/src/generators/array-generator.ts:209,216)
- [ ] Update default return value check in method-generator.ts (spine-c-new/codegen/src/generators/method-generator.ts:346)
- [ ] Run codegen to regenerate all C wrapper code
- [ ] Update test file to ensure bool types work correctly (spine-c-new/test/test.c)
- [ ] Automated test: Run codegen and verify it completes without errors
- [ ] Automated test: Verify generated code compiles with C compiler
- [ ] User test: Build spine-c-new with cmake and verify compilation succeeds
- [ ] User test: Run test.c to verify bool values work correctly (true/false instead of 1/0)

## Notes