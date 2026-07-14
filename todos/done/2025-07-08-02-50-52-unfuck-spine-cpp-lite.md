# Create spine-c-new - automated C wrapper generator for spine-cpp

**Status:** In Progress
**Created:** 2025-01-08T02:50:52
**Agent PID:** 11931

## Description
Create a new project `spine-c-new` with a TypeScript-based code generator that parses spine-cpp headers and generates a C wrapper API. This will replace spine-cpp-lite but we'll keep the current spine-cpp-lite as reference. The new project will live in the spine-runtimes root folder and contain both the generator and generated code. It references spine-cpp in its CMake build.

### Key Paths
- **spine-cpp headers**: `/spine-cpp/spine-cpp/include/spine/*.h`
- **spine-cpp-lite reference**: `/spine-cpp/spine-cpp-lite/`
- **New project location**: `/spine-c-new/` (create in spine-runtimes root)
- **Type hierarchy reference**: `/docs/generate-type-hierarchy.js`

## Design

### Scope
- **Include**: Every concrete type in spine-cpp (classes, enums, inner classes)
- **Exclude**: Types and methods defined in exclusions.txt
- **Custom**: Additional C-specific functionality in custom.h/.cpp

### File Organization
Project structure:
```
spine-c-new/
├── codegen/              # TypeScript generator
│   ├── src/
│   ├── exclusions.txt
│   ├── rtti-bases.txt
│   └── package.json
├── src/
│   ├── custom.h/.cpp     # Custom C-specific code
│   └── generated/        # Generated C wrapper code
│       ├── bone.h/.c
│       ├── animation.h/.c
│       ├── animation-timeline.h/.c
│       ├── animation-alpha-timeline.h/.c
│       └── ... (one file pair per type)
├── include/
│   └── spine-c.h        # Main header that includes all
└── CMakeLists.txt

### Code Generation Rules

#### Opaque Types
- All C++ classes exposed as opaque pointers using SPINE_OPAQUE_TYPE macro
- Pattern: `typedef struct spine_<type>_wrapper {} spine_<type>_wrapper; typedef spine_<type>_wrapper* spine_<type>;`

#### Constructor Mapping
- Generate multiple create functions for types with multiple constructors
- Naming: `spine_<type>_create()`, `spine_<type>_create_with_<param_names>()`
- Example: `spine_bone_create()`, `spine_bone_create_with_data(spine_bone_data data)`
- Types without public constructors: No create functions generated
- All types get `spine_<type>_dispose()` that cleans up wrapper and child objects

#### Method Mapping
- Getters: `spine_<type>_get_<property>(spine_<type> obj)`
- Setters: `spine_<type>_set_<property>(spine_<type> obj, <type> value)`
- Methods: `spine_<type>_<method_name>(spine_<type> obj, params...)`
- Include inherited methods (generate for each subclass)
- Ignore operator overloads

#### Collection Handling
Types may return Vector collections, e.g. `Vector<IkConstraint*>& SkeletonData::getIkConstraints()`. For these we generate:
- `spine_skeleton_data_get_num_ik_constraints(spine_skeleton_data obj)` - Returns count
- `spine_skeleton_data_get_ik_constraints(spine_skeleton_data obj)` - Returns array pointer
- `spine_skeleton_data_ik_constraints_set(spine_skeleton_data obj, index, item)`
- `spine_skeleton_data_ik_constraints_add(spine_skeleton_data obj, item)`
- `spine_skeleton_data_ik_constraints_remove(spine_skeleton_data obj, index)`
- `spine_skeleton_data_ik_constraints_clear(spine_skeleton_data obj)`

No memory management in add/remove - user handles via create/dispose

#### String Handling
- All string returns use `const utf8*` (typedef for `const char*`)
- String parameters accept `const utf8*`
- All methods return `const String&` from C++ as `const utf8*`

#### RTTI Emulation
Generate type enums and cast functions for base types specified in `rtti-bases.txt`.

**rtti-bases.txt format:**
```
# Base types that need RTTI emulation
Attachment
Constraint
ConstraintData
Pose
Posed
PosedData
Timeline
```

**Example for Attachment hierarchy:**
```c
// Generated enum (leaf types only, no VertexAttachment)
typedef enum spine_attachment_type {
    SPINE_TYPE_ATTACHMENT_REGION = 0,
    SPINE_TYPE_ATTACHMENT_MESH,
    SPINE_TYPE_ATTACHMENT_BOUNDING_BOX,
    SPINE_TYPE_ATTACHMENT_CLIPPING,
    SPINE_TYPE_ATTACHMENT_PATH,
    SPINE_TYPE_ATTACHMENT_POINT,
    SPINE_TYPE_ATTACHMENT_SKELETON
} spine_attachment_type;

// Generated is_type method with switch for RTTI checks
spine_bool spine_attachment_is_type(spine_attachment attachment, spine_attachment_type type) {
    if (!attachment) return 0;
    Attachment* _attachment = (Attachment*)attachment;

    switch (type) {
        case SPINE_TYPE_ATTACHMENT_REGION:
            return _attachment->getRTTI().instanceOf(RegionAttachment::rtti);
        case SPINE_TYPE_ATTACHMENT_MESH:
            return _attachment->getRTTI().instanceOf(MeshAttachment::rtti);
        case SPINE_TYPE_ATTACHMENT_BOUNDING_BOX:
            return _attachment->getRTTI().instanceOf(BoundingBoxAttachment::rtti);
        // ... etc for all types
    }
    return 0;
}

// Generated cast methods (return NULL if not the correct type)
spine_region_attachment spine_attachment_as_region_attachment(spine_attachment attachment) {
    if (!attachment) return NULL;
    Attachment* _attachment = (Attachment*)attachment;
    if (!_attachment->getRTTI().instanceOf(RegionAttachment::rtti)) return NULL;
    return (spine_region_attachment)attachment;
}
```

Apply same pattern to:
- **Attachment**: RegionAttachment, MeshAttachment, BoundingBoxAttachment, ClippingAttachment, PathAttachment, PointAttachment, SkeletonAttachment
- **Constraint**: IkConstraint, PathConstraint, PhysicsConstraint, Slider, TransformConstraint
- **ConstraintData**: IkConstraintData, PathConstraintData, PhysicsConstraintData, SliderData, TransformConstraintData
- **Pose**: BoneLocal, BonePose, IkConstraintPose, PathConstraintPose, PhysicsConstraintPose, SliderPose, SlotPose, TransformConstraintPose
- **Posed**: Bone, Slot (skip PosedActive - intermediate)
- **PosedData**: BoneData, SlotData
- **Timeline**: Timeline base class plus all leaf types (AlphaTimeline, AttachmentTimeline, RotateTimeline, etc. - skip intermediates like BoneTimeline, CurveTimeline)

#### Exclusions File Format
`exclusions.txt` defines both excluded types and methods:

```
# Excluded types (whole type is skipped)
type: SkeletonClipping
type: Triangulator
type: SpineObject

# Excluded methods (specific methods on otherwise included types)
method: AnimationState::setListener
method: AnimationState::addListener
method: AnimationState::removeListener
method: AnimationState::clearListeners
method: Skeleton::updateCache
```

Rules:
- One exclusion per line
- Comments start with #
- Type exclusions: `type: <ClassName>`
- Method exclusions: `method: <ClassName>::<methodName>`
- If a type is excluded, all its methods are automatically excluded
- Method names can be overloaded (excludes all overloads)

### Custom Code (from spine-cpp-lite)
These components will be ported to spine-c-new/src/custom.h/.cpp from these locations:
- Atlas loading with callback-based texture loading (`/spine-cpp/spine-cpp-lite/spine-cpp-lite.cpp:56-74`)
- SkeletonDrawable implementation (`/spine-cpp/spine-cpp-lite/spine-cpp-lite.cpp:146-219`)
- Result/error wrapper structs (`/spine-cpp/spine-cpp-lite/spine-cpp-lite.cpp:77-87`)
- Extension management (`/spine-cpp/spine-cpp-lite/spine-cpp-lite.cpp:88-109`)
- Helper types: bounds, vector, skin entries (`/spine-cpp/spine-cpp-lite/spine-cpp-lite.cpp:110-115`)
- RenderCommand C API (`/spine-cpp/spine-cpp-lite/spine-cpp-lite.h:318-331`)
- Skin manipulation special cases (`/spine-cpp/spine-cpp-lite/spine-cpp-lite.cpp:1509-1585`)
- SPINE_OPAQUE_TYPE macro and other macros (`/spine-cpp/spine-cpp-lite/spine-cpp-lite.h:39-60`)

### Validation Strategy
- Ensure all concrete types in spine-cpp are wrapped (except those in exclusions.txt)
- Generate coverage report showing:
  - Which types were included
  - Which types were excluded and why
  - Which methods were excluded
- Verify generated code compiles with spine-cpp
- Test that spine-flutter and spine-ios can use the generated API

## Type Extraction with extract-spine-cpp-types.js

The `/spine-cpp/extract-spine-cpp-types.js` script provides ALL the information needed to generate C wrappers. Key features:

### Complete Type Information
Each type in the output JSON contains:
- **name**: Type name (e.g., "Bone", "Animation")
- **kind**: "class", "struct", or "enum"
- **superTypes**: Array of direct base classes (e.g., ["Posed", "PosedActive"])
- **members**: ALL public members including:
  - Direct members defined in this type
  - ALL inherited members from the entire parent chain recursively
  - Template methods with proper parameter substitution
- **isAbstract**: true if class has pure virtual methods
- **isTemplate**: true for template classes
- **templateParams**: Template parameter names (e.g., ["T", "U"])

### Inherited Member Resolution
The script performs two passes:
1. **Pass 1**: Extract all type definitions from all headers
2. **Pass 2**: Add inherited methods with these features:
   - Methods from all ancestors are included (grandparent → parent → child)
   - Template inheritance is resolved (e.g., `Vector<Bone*>` → concrete types)
   - Each inherited method has `fromSupertype` field showing immediate source
   - SpineObject methods are excluded as noise
   - No need to manually track inheritance - it's all resolved!

### Example Type Entry
```json
{
  "name": "Bone",
  "kind": "class",
  "superTypes": ["Posed", "PosedActive"],
  "members": [
    // Direct members
    {
      "kind": "field",
      "name": "x",
      "type": "float"
    },
    {
      "kind": "method",
      "name": "setX",
      "returnType": "void",
      "parameters": [{"name": "x", "type": "float"}]
    },
    // Inherited from Posed
    {
      "kind": "method",
      "name": "getPosedData",
      "returnType": "PosedData *",
      "parameters": [],
      "fromSupertype": "Posed"  // Shows this came from Posed
    },
    // Inherited from template supertype with substitution
    {
      "kind": "method",
      "name": "add",
      "returnType": "void",
      "parameters": [{"name": "item", "type": "Bone *"}],  // T substituted with Bone*
      "fromSupertype": "Vector<Bone *>"
    }
  ]
}
```

### Usage for Wrapper Generation
```bash
# Generate complete type information for all spine-cpp headers
cd /spine-cpp
./extract-spine-cpp-types.js > all-spine-types.json
```

The output JSON has structure:
```json
{
  "spine/Bone.h": [...types in Bone.h...],
  "spine/Animation.h": [...types in Animation.h...],
  ...
}
```

## Implementation Plan
- [x] Create spine-c-new project structure:
  - [x] Create spine-c-new/ directory in spine-runtimes root
  - [x] Create subdirectories: codegen/, src/, src/generated/, include/
  - [x] Set up CMakeLists.txt for spine-c-new
- [x] Port custom code from spine-cpp-lite:
  - [x] Copy and adapt custom code to spine-c-new/src/custom.h/.cpp
  - [x] Test compilation of custom code

## Notes
- Fixed spine-cpp build error with TEXTURE_FILTER_ENUM by using correct enum name
- Excluded spine-cpp-lite from spine-cpp CMakeLists.txt as it's incompatible with 4.3-beta API
- Fixed spine-c-new custom code to be compatible with spine-cpp 4.3-beta:
  - Changed isPma() to pma (field access)
  - Updated readSkeletonData calls (no error parameter in 4.3)
  - Fixed Skeleton and AnimationStateData constructors (reference vs pointer)
  - Made EventListener inherit from both AnimationStateListenerObject and SpineObject for memory tracking
- Code generator is working and created 150+ header/source file pairs
- Generated code has some issues that need refinement:
  - Type forward declarations needed
  - Better handling of Vector<> types in parameters
  - Duplicate method removal
  - RTTI method type conversion fixes
- **spine-cpp namespace removed**: All spine:: namespace prefixes have been removed from spine-cpp headers
  - Generator needs cleanup to remove all special handling for spine:: namespace
  - This simplifies type conversion significantly
- [x] Set up TypeScript generator in spine-c-new/codegen/:
  - [x] Initialize npm project with TypeScript
  - [x] Create exclusions.txt for excluded types and methods
  - [x] Create rtti-bases.txt with base types needing RTTI emulation
- [x] Implement type extraction:
  - [x] Run `/spine-cpp/extract-spine-cpp-types.js > all-spine-types.json`
  - [x] Load and parse the JSON (all inheritance already resolved!)
  - [x] Filter types based on exclusions.txt
  - [x] Identify which types need RTTI based on rtti-bases.txt
- [x] Implement code generators:
  - [x] Opaque type declarations generator
  - [x] Create/dispose functions generator (handle multiple constructors)
  - [x] Getter/setter generator (generate for all fields)
  - [x] Method wrapper generator (all methods including inherited are in members array)
  - [x] Collection access generator (detect Vector<> return types)
  - [x] RTTI emulation generator (check superTypes against rtti-bases.txt)
  - [x] Enum wrapper generator (use values array)
- [x] Implement file writer:
  - [x] Generate one .h/.c pair per type in spine-c-new/src/generated/
  - [x] Generate main spine-c.h in spine-c-new/include/
  - [x] Configure CMakeLists.txt glob patterns for src/ and src/generated/
- [x] Validate coverage:
  - [x] Generate coverage report of all types in spine-cpp
  - [x] Verify all concrete types are included (except exclusions)
  - [x] Review excluded methods to ensure nothing important is missed
  - [ ] Add any missing exclusions to exclusions.txt
- [ ] Integration testing:
  - [ ] Automated test: Compile spine-c-new
- [ ] User test: Run full generation on current spine-cpp
- [ ] User test: Verify generated code is according to specs

### Key Implementation Notes
1. **No manual inheritance tracking needed** - extract-spine-cpp-types.js provides complete member lists
2. **Template inheritance is pre-resolved** - Vector<Bone*> methods already have Bone* substituted
3. **Abstract classes are marked** - Check `isAbstract` field
4. **All constructors are listed** - Filter members where `kind === "constructor"`
5. **Method overrides are handled** - Script ensures no duplicates in inheritance
6. **Collection detection** - Check return types and parameters for `Vector<` patterns
7. **RTTI hierarchy** - Use superTypes array to build complete inheritance tree

## Current Problem: Header Dependencies and Duplicate Methods

### Issues
1. Generated headers fail to compile because they use types without proper declarations/includes
2. Duplicate method declarations (C++ overloaded methods causing conflicts)
3. Type name conflicts between generated types and custom types
4. Missing forward declarations

### Solution: Single types.h File
Create a single `types.h` file that:
1. Forward declares all non-enum types using `SPINE_OPAQUE_TYPE` macro
2. Includes all enum header files (enums can't be forward declared)
3. Gets included by all generated .h and .cpp files

This eliminates the need for complex dependency analysis and ensures all types are available everywhere.

### Implementation Steps
- [x] Remove DependencyAnalyzer - no longer needed
- [x] Create types.h generator:
  - [x] Collect all parsed types from all headers
  - [x] Generate forward declarations for all class/struct types
  - [x] Generate includes for all enum header files
  - [x] Place in src/generated/types.h
- [x] Update FileWriter:
  - [x] Include types.h in all generated headers
  - [x] Include types.h in all generated source files
  - [x] Remove any other type includes
- [x] Fix duplicate method issues:
  - [x] When generating Vector getters, skip the raw getter
  - [x] Track method signatures to prevent duplicates
- [x] Update spine-c.h:
  - [x] Include types.h before other headers

## Revised Approach: Remove Custom RTTI System

### Reasoning
Originally, we were generating custom enum-based RTTI emulation for polymorphic types. However, since we're now exposing spine::RTTI as an opaque type (spine_rtti), we can directly wrap the C++ RTTI system instead of creating a parallel one. This simplifies the implementation significantly.

### Benefits
1. **No duplicate RTTI system** - Use spine-cpp's existing RTTI directly
2. **Simpler code generation** - No need for RttiGenerator or enum generation
3. **Better compatibility** - Direct pass-through to C++ RTTI
4. **Cleaner API** - RTTI methods become static (no object parameter needed)

### Changes Required
1. **Remove RttiGenerator completely** - No longer needed
2. **Remove spine_size_t typedef** - Unnecessary abstraction, use size_t directly
3. **Fix RTTI getter methods**:
   - Change from: `spine_rtti spine_scale_timeline_get_rtti(spine_scale_timeline obj)`
   - To: `spine_rtti spine_scale_timeline_get_rtti()` (static, returns ScaleTimeline::rtti)
4. **Exclude spine_rtti create/dispose** - RTTI objects are static singletons
5. **Remove type enums** - No longer needed with direct RTTI access

### Implementation
- [x] Remove RttiGenerator from codegen
- [x] Remove spine_size_t from custom.h
- [x] Update method generator to make get_rtti() methods static
- [x] Add exclusion for spine_rtti create/dispose
- [x] Remove RTTI enum generation from all types

## Header Organization Problem

### Issue
The custom.h file contains both:
1. Basic type definitions and macros that don't depend on generated types
2. Extension functions that use generated types (spine_atlas, spine_color, etc.)

This creates a circular dependency problem when types.h tries to include custom.h.

### Solution
Split custom.h into two files:
1. **base.h** - Contains only:
   - Export macros (SPINE_C_EXPORT)
   - SPINE_OPAQUE_TYPE macro
   - Basic typedefs (utf8, spine_bool)
   - Non-generated custom types (spine_skeleton_data_result, etc.)

2. **extensions.h** - Contains all extension functions that depend on generated types:
   - Color functions
   - Bounds functions
   - Atlas functions
   - Skeleton data functions
   - Render command functions
   - Skin functions

### Include Order
The main spine-c.h header will include in this order:
1. base.h (basic definitions)
2. types.h (all forward declarations and enum includes)
3. extensions.h (extension functions that use the types)
4. All generated type headers

This ensures all types are declared before being used.

### Implementation Steps
- [x] Create base.h with content from custom.h up to spine_bool typedef
- [x] Create extensions.h with remaining content from custom.h
- [x] Rename custom.cpp to extensions.cpp
- [x] Update types.h to include base.h instead of custom.h
- [x] Update FileWriter to generate includes for base.h instead of custom.h
- [x] Update spine-c.h to include files in correct order: base.h, types.h, extensions.h
- [x] Delete custom.h
- [x] Regenerate code and test build

## Current Issues: Type System and Code Generation

### Problems
1. **Unstructured type conversion** - toCTypeName has too many special cases
2. **Unclear inclusion/exclusion rules** - We're patching issues as they arise
3. **Abstract class detection** - Need automatic detection of classes with unimplemented pure virtuals
4. **Template class handling** - Should be automatically excluded
5. **Array (formerly Vector) handling** - Need proper C API exposure
6. **Const/non-const method conflicts** - C++ patterns incompatible with C

### Root Cause
We've been adding patches without a systematic approach:
- Manual exclusions for template classes (should be auto-detected)
- Manual exclusions for abstract classes that inherit pure virtuals
- Special cases in type conversion without clear categories
- Hidden Array/Vector types behind void* instead of proper wrappers

## Proposed Solution: Systematic Type Handling

### 1. Type Inclusion/Exclusion Rules

**Auto-exclude:**
- Template classes (detected by isTemplate field)
- Internal utility classes (Array, String, HashMap, etc.)

**Auto-include with limitations:**
- Abstract classes (has pure virtuals or inherits unimplemented ones)
  - Include type definition (users need to work with pointers)
  - No create methods
  - Include dispose method (if applicable)
- Concrete classes - full API

### 2. Array Type Specializations

spine-cpp changed Vector to Array. Generate concrete wrapper types for each Array specialization found in spine-cpp:

**Implementation approach:**
1. Scan all spine-cpp types and their members to enumerate Array<T> usage
2. Generate specialized wrappers in `src/generated/arrays.h` and `arrays.cpp`
3. Include `arrays.h` at the bottom of `types.h`
4. Generated methods can then use these specialized array types

```c
// In generated/arrays.h

// Primitive arrays
typedef struct spine_array_float spine_array_float;
typedef struct spine_array_int32_t spine_array_int32_t;
typedef struct spine_array_uint8_t spine_array_uint8_t;

// Object arrays
typedef struct spine_array_attachment spine_array_attachment;
typedef struct spine_array_bone spine_array_bone;
typedef struct spine_array_track_entry spine_array_track_entry;
// ... etc for all Array<T*> found

// Full API for each specialization
spine_array_float spine_array_float_create();
spine_array_float spine_array_float_create_with_capacity(int32_t capacity);
void spine_array_float_dispose(spine_array_float arr);
float spine_array_float_get(spine_array_float arr, int32_t index);
void spine_array_float_set(spine_array_float arr, int32_t index, float value);
float* spine_array_float_buffer(spine_array_float arr);
int32_t spine_array_float_size(spine_array_float arr);
int32_t spine_array_float_capacity(spine_array_float arr);
void spine_array_float_add(spine_array_float arr, float value);
void spine_array_float_clear(spine_array_float arr);
void spine_array_float_ensure_capacity(spine_array_float arr, int32_t capacity);
// etc...
```

### 3. Systematic Type Conversion

Instead of special cases, classify types first:

**Categories:**
1. **Primitives**: int, float, double, bool, char, void, size_t
2. **Pointers**: Based on what they point to
3. **References**: Based on const-ness and type
4. **Arrays**: Array<T> specializations
5. **Enums**: Known spine enums
6. **Classes**: Spine types

**Conversion rules by category:**
- Primitives: Direct mapping (bool → spine_bool)
- Primitive pointer: Direct (float* → float*)
- Class pointer: ClassName* → spine_class_name
- Const class ref: const T& → spine_t
- Non-const primitive ref: T& → T* (output param)
- Array<T>: → spine_array_t
- Enum: EnumName → spine_enum_name

### 4. Const/Non-Const Method Handling

Implemented support for excluding specific const/non-const versions of methods:
- Exclusion format: `method: Type::method const` (excludes only const version)
- Generator detects const methods by return type pattern (e.g., `const T&`)
- Automatically reports all const/non-const conflicts before failing
- Currently excluding const versions of getSetupPose() methods

### 5. Automatic Type Extraction

The generator should automatically run `extract-spine-cpp-types.js` to ensure we have the latest type information:

1. **Rename output file**: `all-spine-types.json` → `spine-cpp-types.json`
2. **Auto-generate on demand**:
   - Check if `spine-cpp-types.json` exists
   - If not, run `extract-spine-cpp-types.js`
   - If it exists, check timestamps:
     - Get newest modification time of all `/spine-cpp/spine-cpp/include/spine/*.h` files
     - If any header is newer than `spine-cpp-types.json`, regenerate
3. **Separate extraction step**:
   - Create a dedicated function/module for type extraction
   - Run at the start of code generation
   - Log when regenerating vs using cached data

### Implementation Progress

#### Completed Tasks (2025-01-08):
1. **Systematic Type Handling**: Completely refactored `toCTypeName` with proper type classification instead of ad-hoc special cases
2. **Namespace Removal**: Removed all spine:: namespace handling from the code generator
3. **Array Generation**: Implemented automatic generation of Array specializations with proper type handling
4. **Bug Fixes**: Fixed class/struct prefix handling in array element types that was causing incorrect type names

The code generator now runs successfully without namespace handling and generates proper array specializations for all Array<T> types found in spine-cpp.

### Implementation Steps

1. **Implement automatic type extraction**:
   - [x] Create type extraction module (type-extractor.ts)
   - [x] Check file timestamps for regeneration
   - [x] Run extract-spine-cpp-types.js when needed
   - [x] Rename output to spine-cpp-types.json
   - [x] Integrated into main generator - runs automatically

2. **Update type extractor** (if needed):
   - [x] Already extracts isTemplate and isAbstract
   - [x] Run updated extractor with Array instead of Vector
   - [ ] Ensure it detects Array usage patterns

3. **Implement abstract class detection**:
   - [x] Auto-detect classes with unimplemented pure virtuals
   - [x] Remove manual exclusions for these (auto-detected now)

4. **Implement Array specialization generator**:
   - [x] Enumerate all Array<T> usage in spine-cpp types
   - Found 36 Array specializations:
     - Primitive: float, int, unsigned short
     - Enums: PropertyId
     - Special: String (skip with warning), nested arrays (skip with warning)
     - Pointers: 27 object pointer types
   - [x] Create array generator that:
     - Only processes Arrays from non-excluded types (filters template placeholders)
     - Generates specializations for: primitives, enums, pointer types
     - Emits warnings for: String arrays, nested arrays
     - Automatically generates methods from Array type definition
     - Adds hardcoded get/set methods for element access
   - [x] Generate arrays.h/arrays.cpp with all specializations
   - [x] Include arrays.h at bottom of types.h
   - [x] Update toCTypeName to handle Array types
   - [x] Fix class/struct prefix handling in array element types

5. **Refactor toCTypeName**:
   - [x] Implement type classification
   - [x] Apply systematic rules per category
   - [x] Remove special cases

6. **Update method generation**:
   - [x] Handle const/non-const method conflicts systematically
   - [ ] Generate proper Array method signatures

7. **Clean up exclusions.txt**:
   - [x] Remove manually excluded template/abstract types (now auto-detected)
   - [x] Keep only API design exclusions and const method exclusions

8. **Remove spine:: namespace handling**:
   - [x] Remove all spine:: prefix handling in toCTypeName
   - [x] Remove spine:: handling in method generator
   - [x] Remove spine:: handling in enum detection
   - [x] Update array-specializations.ts to remove EventData special case
   - [x] Clean up any other namespace-related special cases
   - [x] Test that code generation works without namespace handling