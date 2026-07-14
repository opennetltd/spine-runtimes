# Review spine-c-new codegen

**Status:** In Progress
**Created:** 2025-07-08T22:31:47
**Agent PID:** 42523

## Context for Resumption
**Read these files in full into your context**
1. `/Users/badlogic/workspaces/spine-runtimes/spine-c-new/codegen/README.md` - Description of codegen

## Description
Interactive review of the spine-c-new code generator with user confirmation at each step. Going through each file together to understand the code and identify issues or improvements.

## Loop
- For each file in codegen:
  - Pick next file (check for incomplete sections, or ask user)
  - Add ## filename section in task.md if non-existant
  - Open file in VS Code via vs-claude
  - STOP and ask user to review file and provide feedback
  - Add checkbox for each issue reported by user in file's section
  - When user says implement, work through the checkboxes in the file's section
  - Mark section (complete) when done
  - Continue to next file

## index.ts (complete)
- [x] Fix extract-spine-cpp-types.js - `isAbstract` should ALWAYS be true/false, never null (currently 134/149 classes have null)
- [x] Fix extract-spine-cpp-types.js to check inherited pure methods after inheritance pass
- [x] After fixing extraction, simplify index.ts to just check `type.isAbstract === true`
- [x] Remove `isAbstractType`, `getPureVirtualMethods` and `implementsMethod` functions from index.ts
- [x] Fix type filtering logic:
  - Only exclude template classes (check `type.isTemplate === true`)
  - Include abstract classes (check `type.isAbstract === true` but don't generate create() for them)
  - Include everything else
  - Apply exclusions filter after this base filtering
- [x] Remove unused `opaqueTypeGen` variable (line 135)
- [x] Extract const/non-const conflict checking (lines 141-198) into its own function `checkConstNonConstConflicts` with proper documentation

## exclusions.ts
- [x] Add field exclusion parsing support (field: Type::field)
- [x] Add granular field accessor exclusions: field-get: Type::field and field-set: Type::field
- [x] Support excluding all field accessors for a type: field: Type, field-get: Type, field-set: Type
- [x] Change Exclusion type to be a discriminated union: `{ kind: 'type', typeName: string } | { kind: 'method', typeName: string, methodName: string, isConst?: boolean }`
- [x] Document in the Exclusion type definition (in types.ts) that `isConst` refers to method const (i.e., `void meh() const`), not return type const
- [x] Remove unnecessary logging of `isConst` in parseExclusion
- [x] Add documentation to loadExclusions function describing its purpose and the exclusions.txt file format
- [x] Fix isMethodExcluded to check method.isConst instead of looking at return type for const - the current logic is wrong

## types.ts (complete)

### Clean up type interfaces
- [x] Update Member to discriminated union: `{kind: 'field', name, type, ...} | {kind: 'method', name, returnType, parameters, ...} | ...`
- [x] Remove unused Parameter.defaultValue field
- [x] Audit all interface fields against actual JSON output

### Rewrite type extraction in TypeScript (complete)
- [x] Port extract-spine-cpp-types.js to TypeScript using the cleaned-up interfaces
- [x] Verify identical output with original script

### Simplify toCTypeName logic
- [x] Remove all special type mappings: primitives pass through unchanged, no utf8, no spine_void
- [x] Implement isPrimitive(): tokenize by whitespace, check if ALL tokens start with lowercase
- [x] Make toCTypeName strict: error if type isn't primitive or in filtered types list
- [x] Remove redundant enum check (same output as class handling)
- [x] Investigate function pointer special cases: TextureLoader is a class (should be handled normally), DisposeRendererObject is a function pointer typedef (needs proper handling)

### Documentation
- [x] Document all conversion functions with examples

### Other files
- [x] Include stdint.h in base.h (already included)
- [x] Remove utf8 typedef from base.h

## array-scanner.ts (complete)
- [x] Fix cTypeName for multi-word primitive types like "unsigned short" - should be "spine_array_unsigned_short" not "spine_array_unsigned short"
- [x] Add proper typing for exclusions parameter (use Exclusion[] type)
- [x] Move ArraySpecialization interface to types.ts
- [x] Move extractArrayTypes function to top-level scope (not inside scanArraySpecializations)
- [x] Actually pass includedTypes to scanArraySpecializations in index.ts since we skip excluded types anyway - remove the redundant exclusion check
- [x] Remove enumTypes parameter - use includedTypes to get all enums instead
- [x] Add reference to source Member in ArraySpecialization interface (for debugging)
- [x] Make template parameter check more robust - if parent type is template, use its templateParams to check if element type is a template param
- [x] Use isPrimitive from types.ts instead of local implementation
- [x] Remove "Map primitive types" logic - just use primitive type name as-is and replace whitespace with _ for cTypeName
- [x] cElementType.replace(/_t$/, '') - already removed, wasn't needed
- [x] Move nested arrays and string arrays handling to else branch "unknown type - skip"
- [x] Better document why we can't handle nested arrays and string arrays (minimal inline comments)
- [x] Warning should show full path to problematic array type (cppType + member path)
- [x] Update extractArrayTypes to directly modify arrayTypes Map with proper typing: Map<string, {type: Type, member: Member}[]>
- [x] Fix handling of primitive pointer types like Array<float*> - should keep pointer in cElementType and generate unique cTypeName
- [x] Skip multi-level pointers (e.g., Array<float**>) as unsupported
- [x] Log found specializations after warnings for debugging
- [x] Sort specializations: primitives first, enums next, then pointers
- [x] Add check for const element types (e.g., Array<const Event*>) and error - arrays should never have const element types
- [x] Warn about Array<T> where T is a template parameter - show which template classes use generic arrays
- [x] Extract warnings logic from array-scanner into warnings.ts for reuse by other generators

## index.ts (continued)
- [x] Add function to check all method return and parameter types for multi-level pointers (e.g., **) and error out early

## checks.ts
- [x] Add checkFieldAccessorConflicts to detect when generated getters/setters would conflict with existing methods

## ir-generator.ts
- [x] Add static RTTI method for classes that have getRTTI() - generate spine_<type>_rtti() that returns &Type::rtti
- [x] Handle method overloads with same name but different parameters - use descriptive suffix like constructors (e.g., spine_animation_search, spine_animation_search_with_step)
- [x] Honor constructor exclusions (e.g., method: Atlas::Atlas) - constructors weren't checking exclusions
- [x] Add logging with indentation when methods/constructors are excluded due to exclusions
- [x] Add getters and setters for public fields - generate spine_<type>_get_<field> and spine_<type>_set_<field> methods (type extractor only provides public members)
- [x] Fix redundant enum value names - remove duplicate enum name prefix from values (e.g., TextureFilter::TextureFilterNearest becomes SPINE_TEXTURE_FILTER_NEAREST)
- [x] Add field exclusion support (field: Type::field) and check for unsupported types like Array<String> in fields
- [x] Add checkTypeSupport function to validate types before trying to convert them
- [x] Fix constructor generation - only generate constructors that are explicitly public, never assume implicit default constructor (could be private)
- [x] Don't error on missing constructors for abstract classes - they can't be instantiated anyway but are useful to wrap
- [x] Fix constructor argument handling - cast pointer parameters from opaque C types to C++ types (e.g., spine_skeleton_data to SkeletonData*)
- [x] Unify argument handling - buildCppArgs now used by constructors, methods, and array methods
- [x] Unify return statement generation - generateReturnStatement shared between methods and array methods

## array-generator.ts (complete)
- [x] Remove unused typesJson field - it's passed to constructor but never used as a field
- [x] Remove spine/Array.h include since spine/spine.h already includes it
- [x] Remove Array/~Array constructor/destructor check - Member now has explicit constructor/destructor types
- [x] Fix template parameter replacement - Array methods are templated, need to replace T with actual element type
- [x] **MAJOR REFACTOR**: Extract common method/constructor generation logic to avoid duplication between generators

## file-writer.ts (merged into c-writer.ts)
- [x] Remove unused writeType and writeEnum methods (only writeTypeRaw and writeEnumRaw are used)
- [x] Rename writeTypeRaw/writeEnumRaw to just writeClassOrStruct/writeEnum since the old ones are unused
- [x] Merged all functionality into c-writer.ts

## Architecture Refactor - Intermediate Representation

### Core Types (add to c-types.ts):
```typescript
interface CParameter {
  name: string;          // Parameter name in C
  cType: string;         // C type (e.g., "float*", "spine_bone")
  cppType: string;       // Original C++ type (e.g., "float&", "Bone*")
  isOutput: boolean;     // true for non-const references that become output params
}

interface CMethod {
  name: string;          // Full C function name (e.g., "spine_bone_get_x")
  returnType: string;    // C return type
  parameters: CParameter[];
  body: string;          // The actual implementation code (e.g., "return ((Bone*)self)->getX();")
}

interface CClassOrStruct {
  name: string;          // C type name (e.g., "spine_bone")
  cppType: ClassOrStruct;  // Original C++ type info
  constructors: CMethod[];  // All constructors (including default)
  destructor: CMethod;      // Always present (calls delete)
  methods: CMethod[];       // All methods
}

interface CEnumValue {
  name: string;          // C enum value name (e.g., "SPINE_BLEND_MODE_NORMAL")
  value?: string;        // Optional explicit value
}

interface CEnum {
  name: string;          // C type name (e.g., "spine_blend_mode")
  cppType: Enum;         // Original C++ enum info
  values: CEnumValue[];  // Converted enum values
}
```

### Generators produce C types:
- Each generator analyzes its Type and produces CClassOrStruct/CEnum with all methods/values
- No more direct string generation in generators
- Clear separation between "what to generate" and "how to format it"

### CWriter (new file: c-writer.ts):
```typescript
class CWriter {
  writeClassHeader(type: CClassOrStruct): string {
    // Generate all function declarations
    // Handle SPINE_C_API macros
    // Format with proper spacing
  }

  writeClassSource(type: CClassOrStruct): string {
    // Generate all function implementations
    // Just output the body from each CMethod
  }

  writeEnumHeader(enumType: CEnum): string {
    // Generate enum declaration
  }

  private writeMethodDeclaration(method: CMethod): string
  private writeMethodImplementation(method: CMethod): string
```

### Refactoring Steps (complete):
- [x] Create c-types.ts with IR types
- [x] Create c-writer.ts with CWriter class
- [x] Create ir-generator.ts with functions to convert Type → C types:
  - [x] `generateConstructors(type: ClassOrStruct): CMethod[]`
  - [x] `generateDestructor(type: ClassOrStruct): CMethod`
  - [x] `generateMethods(type: ClassOrStruct): CMethod[]`
  - [x] `generateArrayMethods(elementType: string, cTypeName: string, arrayType: ClassOrStruct): CMethod[]`
  - [x] `generateEnum(enumType: Enum): CEnum`
- [x] Update index.ts to use new architecture:
  - [x] Generate CClassOrStruct for each class/struct type
  - [x] Generate CEnum for each enum type
  - [x] Pass to CWriter to generate code
  - [x] For arrays, generate specialized CClassOrStruct with array methods
- [x] Delete old generators after verification
- [x] Verify output is working (some minor issues with RTTI and const types to fix later)

## Error Fixes
- [x] Fix exclusions.txt to use :: instead of . for method separators
- [x] Add missing exclusions for unsupported array types (Array<String>, Array<Array<T>>)
- [x] Make unsupported array types a hard error instead of warning
- [x] Filter out excluded sources before reporting array errors
- [x] Add isFieldExcluded, isFieldGetterExcluded, isFieldSetterExcluded functions
- [x] Fix abstract class instantiation (Attachment) - don't generate constructors for abstract classes
- [x] Fix mixin class constructors (BoneTimeline) - only generate constructors for classes that inherit from SpineObject
- [x] Fix method name conflicts with type names (spine_bone_pose) - added checkMethodTypeNameConflicts check and excluded Bone::pose
- [x] Add exclusions for BoneTimeline1 and BoneTimeline2 (have pure virtual methods but not detected as abstract)
- [x] Fix method overload naming conflicts - include type information in suffix for methods with same names but different parameter types
- [x] Fix static methods returning value types - Color::valueOf returns Color not Color* - added checkValueReturns and excluded Color::valueOf
- [x] Enhanced type extractor to extract protected members (with access level) for proper abstract class detection
- [x] Fixed BoneTimeline1/BoneTimeline2 abstract detection by including protected pure virtual methods
- [x] Fix checkValueReturns to allow enum return values (enums are just integers in C)

## warnings.ts

## type-extractor.ts
- [x] Fix inheritance processing order - addInheritedMethods assumes parent types are already processed but extractTypes doesn't guarantee this order
- [x] Bug: Method name hiding - DeformTimeline has protected apply(5 params) which hides inherited public apply(8 params) from SlotCurveTimeline due to C++ name hiding rules
- [x] Bug: addInheritedMethods was missing guard check and not setting inheritedMethodsAdded flag, causing duplicate inherited methods

## ir-generator.ts (continued)
- [x] Fix inherited method calls to use base class cast when fromSupertype is set to avoid C++ name hiding issues
- [x] Fix naming conflict between methods named "create" and constructors - always add suffix to create methods

## checks.ts (continued)
- [x] Fix checkConstNonConstConflicts - it was checking for different return types instead of checking for const vs non-const methods

## Build fixes
- [x] Fixed RTTI linking errors by including flags.cmake in spine-c-new CMakeLists.txt to enable -fno-rtti flag
