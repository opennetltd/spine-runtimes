# Swift Bindings Generator Analysis

## spine-c Codegen System Analysis

### Purpose and Architecture of the spine-c Codegen System

The spine-c codegen system is a sophisticated TypeScript-based code generator that automatically creates a complete C wrapper API for the Spine C++ runtime. Its primary purpose is to:

1. **Automatic API Wrapping**: Parse spine-cpp headers using Clang's AST and generate a systematic C API with opaque types
2. **Multi-language Binding Support**: Build inheritance maps and interface information to support binding generation for languages like Dart, Swift, Java, and others
3. **Type Safety and Consistency**: Apply systematic type conversion rules and extensive validation to ensure correctness

#### Architecture Overview

The system follows a **multi-stage pipeline architecture**:

1. **Type Extraction** - Uses Clang's `-ast-dump=json` to parse C++ headers
2. **Type Processing** - Filters and validates extracted types
3. **Validation** - Extensive checks for conflicts and unsupported patterns
4. **Array Scanning** - Detects and generates specialized array types
5. **IR Generation** - Converts C++ types to C intermediate representation
6. **Code Writing** - Generates header and implementation files
7. **Inheritance Analysis** - Builds inheritance maps for multi-language bindings

### Structure of Types Available from generate()

The `generate()` method returns a comprehensive data structure containing:

```typescript
{
  cTypes,           // Generated C wrapper types for classes
  cEnums,           // Generated C enum types
  cArrayTypes,      // Specialized array types (Array<T> → spine_array_T)
  inheritance,      // extends/implements map for single-inheritance languages
  supertypes,       // Legacy RTTI supertypes map
  subtypes,         // Legacy RTTI subtypes map
  isInterface       // Pure interface detection map
}
```

#### Key Type Definitions

From `types.ts`, the system defines several core interfaces:

- **ClassOrStruct**: Represents C++ classes/structs with members, inheritance, template info
- **Method**: Method definitions with parameters, virtuality, const-ness
- **Field**: Public fields with type and location information
- **Constructor/Destructor**: Special member functions
- **Enum**: Enumeration types with values
- **ArraySpecialization**: Specialized array type information

### Information Extracted from C Headers

The system extracts comprehensive information from spine-cpp headers:

#### Class/Struct Information:
- **Members**: All public methods, fields, constructors, destructors
- **Inheritance**: Supertype relationships and template inheritance
- **Properties**: Abstract status, template parameters, virtual methods
- **Location**: File and line number information for each member

#### Method Details:
- **Signatures**: Return types, parameter types and names
- **Modifiers**: Static, virtual, pure virtual, const qualifiers
- **Inheritance**: Which supertype the method comes from

#### Type Analysis:
- **Template Detection**: Identifies and handles template types
- **Interface Classification**: Distinguishes pure interfaces from concrete classes
- **Inheritance Mapping**: Builds complete inheritance hierarchies

#### Validation Information:
- **Conflict Detection**: Const/non-const method conflicts
- **Type Support**: Multi-level pointers, unsupported patterns
- **Name Conflicts**: Method/type name collisions

### How This Information Can Be Used for Generating Bindings

The extracted information enables sophisticated binding generation for multiple target languages:

#### 1. **Type System Mapping**
- **Opaque Types**: C++ classes become opaque pointers (`Skeleton*` → `spine_skeleton`)
- **Primitive Passthrough**: Direct mapping for int, float, bool, etc.
- **Special Conversions**: `String` → `const char*`, `PropertyId` → `int64_t`
- **Array Specializations**: `Array<T>` → `spine_array_T` with full CRUD operations

#### 2. **Inheritance Support**
The inheritance maps enable proper class hierarchies in target languages:
- **Single Inheritance**: `extends` relationships for concrete parent classes
- **Interface Implementation**: `mixins` for pure interface types
- **Conflict Detection**: Prevents multiple concrete inheritance (unsupported in many languages)

#### 3. **Memory Management**
- **Constructor Wrapping**: Generates `spine_type_create()` functions
- **Destructor Wrapping**: Generates `spine_type_dispose()` functions
- **RTTI Support**: Maintains Spine's custom RTTI system for type checking

#### 4. **Method and Field Access**
- **Method Wrapping**: `Class::method()` → `spine_class_method()`
- **Field Accessors**: Automatic getter/setter generation for public fields
- **Parameter Marshaling**: Proper conversion between C++ and C calling conventions

#### 5. **Language-Specific Features**
- **Nullability**: Identifies nullable pointer types vs non-null references
- **Array Operations**: Complete CRUD operations for specialized array types
- **Enum Conversion**: Systematic enum name conversion with prefixes

#### 6. **Validation and Safety**
The extensive validation ensures generated bindings are safe and correct:
- **Type Safety**: Prevents unsupported type patterns
- **Name Conflicts**: Ensures no function name collisions
- **Interface Compliance**: Verifies inheritance patterns work in target languages

This comprehensive system allows binding generators for languages like Dart, Swift, Java, etc. to automatically create type-safe, idiomatic APIs that properly expose the full Spine C++ functionality while respecting each language's conventions and constraints.

## Dart Codegen Implementation Analysis

Based on my analysis of the Dart codegen implementation in spine-flutter, here's a comprehensive breakdown of how it works and the patterns that would be applicable to Swift:

### **1. Architecture Overview**

The Dart codegen follows a clean layered architecture:

1. **Input**: Uses the `generate()` function from spine-c's codegen to get the C Intermediate Representation (CIR)
2. **Transform**: Converts CIR to clean Dart model using `DartWriter`
3. **Generate**: Creates idiomatic Dart code from the model
4. **Output**: Writes individual files plus arrays and exports

### **2. How It Uses the generate() Output**

From `/Users/badlogic/workspaces/spine-runtimes/spine-flutter/codegen/src/index.ts`:

```typescript
const { cTypes, cEnums, cArrayTypes, inheritance, supertypes, subtypes, isInterface } = await generate();
```

The codegen consumes:
- **cTypes**: All C wrapper types with nullability information
- **cEnums**: Enum definitions
- **cArrayTypes**: Array specializations
- **inheritance**: Extends/implements relationships
- **isInterface**: Map of which types are pure interfaces
- **supertypes**: Type hierarchy for RTTI-based instantiation

### **3. Type Hierarchy and Inheritance Handling**

The implementation elegantly handles complex inheritance:

#### **Concrete Classes** (like `Skeleton`)
```dart
class Skeleton {
  final Pointer<spine_skeleton_wrapper> _ptr;
  Skeleton.fromPointer(this._ptr);
  Pointer get nativePtr => _ptr;
  // ... methods
}
```

#### **Abstract Classes** (like `Attachment`)
```dart
abstract class Attachment {
  final Pointer<spine_attachment_wrapper> _ptr;
  Attachment.fromPointer(this._ptr);
  Pointer get nativePtr => _ptr;
  // ... concrete methods with RTTI switching
}
```

#### **Interfaces** (like `Constraint`)
```dart
abstract class Constraint implements Update {
  @override
  Pointer get nativePtr;
  ConstraintData get data;  // abstract getters
  void sort(Skeleton skeleton);  // abstract methods
  static Rtti rttiStatic() { /* implementation */ }
}
```

**Key Pattern**: The implementation uses single inheritance (`extends`) for concrete parent classes and multiple interface implementation (`implements`) for mixins.

### **4. Nullability Handling**

The nullability system is comprehensive and automatic:

#### **Nullable Return Values**
```dart
Bone? get rootBone {
  final result = SpineBindings.bindings.spine_skeleton_get_root_bone(_ptr);
  return result.address == 0 ? null : Bone.fromPointer(result);
}
```

#### **Nullable Parameters**
```dart
void sortBone(Bone? bone) {
  SpineBindings.bindings.spine_skeleton_sort_bone(
    _ptr,
    bone?.nativePtr.cast() ?? Pointer.fromAddress(0)
  );
}
```

#### **Non-nullable Types**
```dart
String get name {  // No '?' - guaranteed non-null
  final result = SpineBindings.bindings.spine_attachment_get_name(_ptr);
  return result.cast<Utf8>().toDartString();
}
```

The nullability information flows from:
1. **C++ analysis**: Pointers can be null, references cannot
2. **CIR encoding**: `returnTypeNullable` and `parameter.isNullable` flags
3. **Dart generation**: Automatic `?` types and null checks

### **5. Generated Code Structure**

#### **Class Structure**
Each generated class follows a consistent pattern:
- License header
- Imports (FFI, bindings, related types)
- Class declaration with inheritance
- Pointer field (`_ptr`)
- Pointer constructor (`fromPointer`)
- Native pointer getter
- Factory constructors
- Properties (getters/setters)
- Methods
- Dispose method (for concrete classes)

#### **Method Generation**
The codegen intelligently detects:
- **Getters**: `spine_skeleton_get_data` → `SkeletonData get data`
- **Setters**: `spine_skeleton_set_x` → `set x(double value)`
- **Methods**: `spine_skeleton_update` → `void update(double delta)`
- **Constructors**: `spine_skeleton_create` → `factory Skeleton()`

#### **Method Overloading**
Handles C's numbered method pattern:
```dart
// spine_skeleton_set_skin_1 → setSkin(String)
void setSkin(String skinName) { ... }

// spine_skeleton_set_skin_2 → setSkin2(Skin?)
void setSkin2(Skin? newSkin) { ... }
```

### **6. RTTI-Based Instantiation**

For abstract types, the codegen generates runtime type checking:

```dart
Attachment? getAttachment(String slotName, String attachmentName) {
  final result = SpineBindings.bindings.spine_skeleton_get_attachment_1(...);
  if (result.address == 0) return null;

  final rtti = SpineBindings.bindings.spine_attachment_get_rtti(result);
  final className = SpineBindings.bindings.spine_rtti_get_class_name(rtti)
      .cast<Utf8>().toDartString();

  switch (className) {
    case 'spine_region_attachment':
      return RegionAttachment.fromPointer(result.cast());
    case 'spine_mesh_attachment':
      return MeshAttachment.fromPointer(result.cast());
    // ... other concrete types
    default:
      throw UnsupportedError('Unknown concrete type: $className');
  }
}
```

### **7. Array Types**

Arrays get specialized wrapper classes extending `NativeArray<T>`:

```dart
class ArrayFloat extends NativeArray<double> {
  final bool _ownsMemory;

  ArrayFloat.fromPointer(Pointer<spine_array_float_wrapper> ptr, {bool ownsMemory = false})
      : _ownsMemory = ownsMemory, super(ptr);

  factory ArrayFloat() { /* create constructor */ }

  @override
  int get length { /* implementation */ }

  @override
  double operator [](int index) { /* implementation */ }

  void dispose() { /* only if _ownsMemory */ }
}
```

**Key Features**:
- Memory ownership tracking
- Bounds checking
- Null handling for object arrays
- Factory constructors for creation

### **8. Enum Generation**

Enums use Dart's modern enum syntax with values:

```dart
enum BlendMode {
  normal(0),
  additive(1),
  multiply(2),
  screen(3);

  const BlendMode(this.value);
  final int value;

  static BlendMode fromValue(int value) {
    return values.firstWhere(
      (e) => e.value == value,
      orElse: () => throw ArgumentError('Invalid BlendMode value: $value'),
    );
  }
}
```

### **9. Special Patterns for Swift**

Several patterns from the Dart implementation would translate well to Swift:

#### **Memory Management**
```swift
// Swift equivalent of pointer wrapping
class Skeleton {
    private let ptr: OpaquePointer

    init(fromPointer ptr: OpaquePointer) {
        self.ptr = ptr
    }

    var nativePtr: OpaquePointer { ptr }

    deinit {
        spine_skeleton_dispose(ptr)
    }
}
```

#### **Optional Handling**
```swift
// Swift's optionals map naturally to Dart's nullability
var rootBone: Bone? {
    let result = spine_skeleton_get_root_bone(ptr)
    return result == nil ? nil : Bone(fromPointer: result!)
}
```

#### **RTTI Switching**
```swift
// Swift's switch with associated values
func getAttachment(_ slotName: String, _ attachmentName: String) -> Attachment? {
    guard let result = spine_skeleton_get_attachment_1(ptr, slotName, attachmentName) else {
        return nil
    }

    let rtti = spine_attachment_get_rtti(result)
    let className = String(cString: spine_rtti_get_class_name(rtti))

    switch className {
    case "spine_region_attachment":
        return RegionAttachment(fromPointer: result)
    case "spine_mesh_attachment":
        return MeshAttachment(fromPointer: result)
    default:
        fatalError("Unknown concrete type: \(className)")
    }
}
```

#### **Protocol-Based Interfaces**
```swift
// Swift protocols map well to Dart interfaces
protocol Constraint: Update {
    var nativePtr: OpaquePointer { get }
    var data: ConstraintData { get }
    func sort(_ skeleton: Skeleton)
    var isSourceActive: Bool { get }
}
```

### **10. Key Takeaways for Swift Implementation**

1. **Consistent Architecture**: Use the same 3-step process (input CIR → transform → generate)
2. **Nullability Mapping**: Leverage Swift's optionals to match CIR nullability exactly
3. **Memory Management**: Use automatic reference counting with `deinit` for cleanup
4. **Type Safety**: Generate compile-time safe wrappers around C pointers
5. **RTTI Handling**: Use Swift's powerful switch statements for type resolution
6. **Protocol Orientation**: Use Swift protocols for interfaces/mixins
7. **Value Types**: Use Swift enums with raw values for C enums
8. **Collection Types**: Create Array wrapper classes similar to Dart's approach
9. **Method Overloading**: Swift's native overloading can handle numbered C methods more elegantly
10. **Property Synthesis**: Use Swift's computed properties for getters/setters

The Dart implementation provides an excellent blueprint for creating idiomatic, type-safe wrappers around the C API while maintaining full compatibility with the underlying spine-c layer.

## Existing Swift Implementation Analysis

### 1. Current Code Generation Approach (Python-based)

**File**: `/Users/badlogic/workspaces/spine-runtimes/spine-cpp/spine-cpp-lite/spine-cpp-lite-codegen.py`

The current generator uses a Python script that:

- **Parses C++ header file** (`spine-cpp-lite.h`) using regex patterns to extract:
  - Opaque types (between `@start: opaque_types` and `@end: opaque_types`)
  - Function declarations (between `@start: function_declarations` and `@end: function_declarations`)
  - Enums (between `@start: enums` and `@end: enums`)

- **Type mapping** approach:
  ```python
  supported_types_to_swift_types = {
      'void *': 'UnsafeMutableRawPointer',
      'const utf8 *': 'String?',
      'uint64_t': 'UInt64',
      'float *': 'Float?',
      'float': 'Float',
      'int32_t': 'Int32',
      'utf8 *': 'String?',
      'int32_t *': 'Int32?',
      'uint16_t *': 'UInt16',
      'spine_bool': 'Bool'
  }
  ```

- **Swift class generation pattern**:
  - Each opaque type becomes a Swift class inheriting from `NSObject`
  - Uses `@objc` and `@objcMembers` for Objective-C compatibility
  - Internal `wrappee` property holds the C++ pointer
  - Automatic generation of `isEqual` and `hash` methods
  - Smart getter/setter detection for computed properties

### 2. Current Generated Code Structure

**File**: `/Users/badlogic/workspaces/spine-runtimes/spine-ios/Sources/Spine/Spine.Generated.swift`

The generated code follows these patterns:

- **Type aliases for enums**:
  ```swift
  public typealias BlendMode = spine_blend_mode
  public typealias MixBlend = spine_mix_blend
  // etc.
  ```

- **Class structure**:
  ```swift
  @objc(SpineTransformConstraintData)
  @objcMembers
  public final class TransformConstraintData: NSObject {
      internal let wrappee: spine_transform_constraint_data

      internal init(_ wrappee: spine_transform_constraint_data) {
          self.wrappee = wrappee
          super.init()
      }

      public override func isEqual(_ object: Any?) -> Bool {
          guard let other = object as? TransformConstraintData else { return false }
          return self.wrappee == other.wrappee
      }

      public override var hash: Int {
          var hasher = Hasher()
          hasher.combine(self.wrappee)
          return hasher.finalize()
      }
  }
  ```

- **Smart property generation**:
  - Detects getter/setter pairs and creates computed properties
  - Handles array types with companion `get_num_*` functions
  - Boolean conversion (`spine_bool` ↔ Swift `Bool`)
  - Optional handling with `flatMap`

### 3. Extensions and Manual Code

**File**: `/Users/badlogic/workspaces/spine-runtimes/spine-ios/Sources/Spine/Spine.Generated+Extensions.swift`

Contains manually written extensions that provide:
- Async loading methods (`fromBundle`, `fromFile`, `fromHttp`)
- Swift-friendly error handling with `SpineError`
- Integration with iOS types (`UIImage`, `CGRect`)
- Memory management and resource disposal
- SwiftUI integration

### 4. Module Map Setup

**Files**:
- `/Users/badlogic/workspaces/spine-runtimes/spine-ios/Sources/SpineCppLite/include/module.modulemap`
- `/Users/badlogic/workspaces/spine-runtimes/spine-ios/Sources/SpineShadersStructs/module.modulemap`

Simple module maps that expose C++ headers to Swift:
```
module SpineCppLite {
    header "spine-cpp-lite.h"
    export *
}
```