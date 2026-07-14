# Haxe Serializer: Java Getter to Haxe Field/Method Mapping Analysis

## Overview

This document contains a comprehensive analysis of ALL patterns for transforming Java getter calls into appropriate Haxe field/method access, extracted from the java-haxe-diff.md file.

## General Patterns

### 1. Simple Field Access Pattern (Most Common)
Java getter `getX()` maps to Haxe field `x:Type`

**Examples:**
- `getName()` → `name:String`
- `getDuration()` → `duration:Float`
- `getTimeScale()` → `timeScale:Float`
- `getLoop()` → `loop:Bool`
- `getX()` → `x:Float`
- `getY()` → `y:Float`
- `getRotation()` → `rotation:Float`
- `getScaleX()` → `scaleX:Float`
- `getScaleY()` → `scaleY:Float`
- `getShearX()` → `shearX:Float`
- `getShearY()` → `shearY:Float`
- `getWidth()` → `width:Float`
- `getHeight()` → `height:Float`
- `getColor()` → `color:Color`
- `getAlpha()` → `alpha:Float`
- `getMix()` → `mix:Float`
- `getVisible()` → `visible:Bool`
- `getIndex()` → `index:Int`

### 2. Array Field Access Pattern
Java getter `getX()` returns array → Haxe field `x:Array<Type>`

**Examples:**
- `getTimelines()` → `timelines:Array<Timeline>`
- `getBones()` → `bones:Array<Int>` or `bones:Array<BoneData>` or `bones:Array<BonePose>` (context-dependent)
- `getChildren()` → `children:Array<Bone>`
- `getFrames()` → `frames:Array<Float>`
- `getAttachmentNames()` → `attachmentNames:Array<String>`
- `getVertices()` → `vertices:Array<Float>` or `vertices:Array<Array<Float>>` (context-dependent)
- `getEvents()` → `events:Array<Event>`
- `getDrawOrders()` → `drawOrders:Array<Array<Int>>`
- `getSlots()` → `slots:Array<Slot>` or `slots:Array<SlotData>` (context-dependent)
- `getTracks()` → `tracks:Array<TrackEntry>`
- `getTriangles()` → `triangles:Array<Int>`
- `getUVs()` → `uvs:Array<Float>`
- `getRegionUVs()` → `regionUVs:Array<Float>`
- `getEdges()` → `edges:Array<Int>`
- `getLengths()` → `lengths:Array<Float>`
- `getRegions()` → `regions:Array<TextureRegion>`
- `getAnimations()` → `animations:Array<Animation>`
- `getSkins()` → `skins:Array<Skin>`
- `getConstraints()` → `constraints:Array<Constraint<Dynamic, Dynamic, Dynamic>>` or `constraints:Array<ConstraintData<Dynamic, Dynamic>>`
- `getPhysicsConstraints()` → `physics:Array<PhysicsConstraint>`
- `getProperties()` → `properties:Array<FromProperty>`
- `getDeform()` → `deform:Array<Float>`

### 3. Method Remains Method Pattern
Some getters remain as methods in Haxe, typically those that perform calculations or have side effects.

**Examples:**
- `getFrameCount()` → `getFrameCount():Int`
- `getFrameEntries()` → `getFrameEntries():Int`
- `getDuration()` → `getDuration():Float` (in Timeline classes)
- `getSlotIndex()` → `getSlotIndex():Int`
- `getBoneIndex()` → `getBoneIndex():Int`
- `getConstraintIndex()` → `getConstraintIndex():Int`
- `getData()` → `getData():T` (where T is the data type)
- `getPose()` → `getPose():T` (where T is the pose type)
- `getAppliedPose()` → `getAppliedPose():T`
- `getSetupPose()` → `getSetupPose():T`
- `getAnimationTime()` → `getAnimationTime():Float`
- `getTrackComplete()` → `getTrackComplete():Float`
- `getWorldRotationX()` → `getWorldRotationX():Float`
- `getWorldRotationY()` → `getWorldRotationY():Float`
- `getWorldScaleX()` → `getWorldScaleX():Float`
- `getWorldScaleY()` → `getWorldScaleY():Float`
- `getAttachments()` → `getAttachments():Array<SkinEntry>`
- `getOffsetRotation()` → `getOffsetRotation():Float`
- `getOffsetX()` → `getOffsetX():Float`
- `getOffsetY()` → `getOffsetY():Float`
- `getOffsetScaleX()` → `getOffsetScaleX():Float`
- `getOffsetScaleY()` → `getOffsetScaleY():Float`
- `getOffsetShearY()` → `getOffsetShearY():Float`

### 4. Special Property Access Pattern
Some properties use Haxe's property syntax with get/set accessors.

**Examples:**
- `getName()` → `name(get, never):String` (in Attachment subclasses)
- `getRootBone()` → `rootBone(get, never):Bone`
- `getScaleY()` → `scaleY(get, default):Float` (in Skeleton)

### 5. Field Name Variations
Some getters have slight variations in their Haxe field names.

**Examples:**
- `getInt()` → `intValue:Int`
- `getFloat()` → `floatValue:Float`
- `getString()` → `stringValue:String`
- `getUpdateCache()` → `_updateCache:Array<Dynamic>` (with underscore prefix)
- `getPropertyIds()` → `propertyIds:Array<String>`
- `getDefaultSkin()` → `defaultSkin:Skin`

### 6. Type Reference Patterns
Getters that reference other objects.

**Examples:**
- `getParent()` → `parent:Bone` or `parent:BoneData` (context-dependent)
- `getTarget()` → `target:Bone` or `target:BoneData` (context-dependent)
- `getSource()` → `source:Bone` or `source:BoneData` (context-dependent)
- `getAttachment()` → `attachment:Attachment` or `attachment:VertexAttachment` (context-dependent)
- `getSlot()` → `slot:Slot` or `slot:SlotData` (context-dependent)
- `getBone()` → `bone:Bone` or `bone:BoneData` or `bone:BonePose` (context-dependent)
- `getSkin()` → `skin:Skin`
- `getAnimation()` → `animation:Animation`
- `getRegion()` → `region:TextureRegion`
- `getSequence()` → `sequence:Sequence`
- `getParentMesh()` → `parentMesh:MeshAttachment`
- `getEndSlot()` → `endSlot:SlotData`

## Context-Dependent Mappings

### 1. `getBones()` mapping depends on containing class:
- In `Animation`: → `bones:Array<Int>`
- In `BoneData`, `IkConstraintData`, `PathConstraintData`, `TransformConstraintData`, `Skin`: → `bones:Array<BoneData>`
- In `IkConstraint`, `PathConstraint`, `TransformConstraint`: → `bones:Array<BonePose>`
- In `BoundingBoxAttachment`, `ClippingAttachment`, `MeshAttachment`, `PathAttachment`, `VertexAttachment`: → `bones:Array<Int>`

### 2. `getVertices()` mapping depends on containing class:
- In `DeformTimeline`: → `vertices:Array<Array<Float>>` (2D array)
- In `ClippingAttachment`, `MeshAttachment`, `PathAttachment`, `VertexAttachment`: → `vertices:Array<Float>` (1D array)

### 3. `getDuration()` mapping depends on containing class:
- In `Animation`: → `duration:Float` (field)
- In Timeline classes: → `getDuration():Float` (method)

### 4. Special Cases in Timeline Classes:
All Timeline subclasses have these getters as methods:
- `getFrameCount()` → `getFrameCount():Int`
- `getFrameEntries()` → `getFrameEntries():Int`
- `getDuration()` → `getDuration():Float`
- `getPropertyIds()` → `propertyIds:Array<String>` (field)
- `getFrames()` → `frames:Array<Float>` (field)

### 5. Special Cases in Constraint Classes:
- `getData()` → `getData():T` (method returning specific data type)
- `getPose()` → `getPose():T` (method returning specific pose type)
- `getAppliedPose()` → `getAppliedPose():T` (method returning specific pose type)

## Type Transformations

### Java to Haxe Type Mappings:
- `int` → `Int`
- `float` → `Float`
- `double` → `Float`
- `boolean` → `Bool`
- `String` → `String`
- `Array`/`List` → `Array<T>`
- `IntArray` → `Array<Int>` (custom type)
- Object types remain the same (e.g., `Color` → `Color`)

## Special Edge Cases

### 1. Incomplete Mappings (marked as TODO in the file):
- `BonePose.getInherit()` → TODO
- `BoundingBoxAttachment.getVertices()` → TODO
- `BoundingBoxAttachment.getWorldVerticesLength()` → TODO
- `BoundingBoxAttachment.getTimelineAttachment()` → TODO
- `BoundingBoxAttachment.getId()` → TODO
- `BoundingBoxAttachment.getName()` → TODO

### 2. Inherited Methods:
Some getters are inherited from parent classes and noted as such:
- `getName()` in attachment classes inherits from `Attachment`
- Properties in `FromRotate`, `FromScaleX`, etc. inherit from `FromProperty`
- Properties in constraint data classes inherit from `PosedData`

### 3. Special Skeleton Fields:
- `getUpdateCache()` → `_updateCache:Array<Dynamic>` (private with underscore)
- `getRootBone()` → `rootBone(get, never):Bone` (computed property)
- `getScaleY()` → `scaleY(get, default):Float` (property with default)

### 4. DrawOrderTimeline Exception:
- `getFrameCount()` → `frameCount:Int` (field instead of method, unlike other timelines)

### 5. Enum and Constant Mappings:
- `getBlendMode()` → `blendMode:BlendMode`
- `getPositionMode()` → `positionMode:PositionMode`
- `getSpacingMode()` → `spacingMode:SpacingMode`
- `getRotateMode()` → `rotateMode:RotateMode`
- `getMixBlend()` → `mixBlend:MixBlend`
- `getInherit()` → `inherit:Inherit`

## Summary

The transformation rules can be categorized as:

1. **Default Rule**: `getX()` → `x:Type` (lowercase first letter, remove get prefix)
2. **Method Preservation**: Keep as method for calculated values or methods with side effects
3. **Special Properties**: Use Haxe property syntax for computed/readonly properties
4. **Context Awareness**: Same getter can map differently based on containing class
5. **Type Transformation**: Java primitive types map to Haxe equivalents
6. **Special Cases**: Some fields have custom names (e.g., `getInt()` → `intValue`)

When implementing the Haxe serializer generator, these patterns should be applied in order of specificity:
1. Check for exact class + getter combinations first
2. Check for class-specific patterns (e.g., all Timeline getters)
3. Apply general transformation rules
4. Handle special cases and exceptions

---

# Revised Implementation Plan: Reflection-Based Haxe Serializer

## Key Insight

Instead of maintaining complex mapping tables, we can leverage Haxe's dynamic reflection capabilities to automatically resolve field vs method access at runtime.

## Simplified Architecture

### Core Approach: Runtime Property Resolution

```haxe
private function getPropertyValue(obj:Dynamic, javaGetter:String):Dynamic {
    // Extract property name from Java getter
    var propName = extractPropertyName(javaGetter); // getName() → "name"
    
    // 1. Try direct field access first (most common case)
    if (Reflect.hasField(obj, propName)) {
        return Reflect.field(obj, propName);
    }
    
    // 2. Try special field variations
    var specialNames = getSpecialFieldNames(javaGetter, propName);
    for (name in specialNames) {
        if (Reflect.hasField(obj, name)) {
            return Reflect.field(obj, name);
        }
    }
    
    // 3. Try method access (for computed properties)
    if (Reflect.hasField(obj, javaGetter.replace("()", ""))) {
        return Reflect.callMethod(obj, Reflect.field(obj, javaGetter.replace("()", "")), []);
    }
    
    // 4. Handle property syntax (get, never)
    // This would need special handling or we just access the underlying getter
    
    throw 'Property ${javaGetter} not found on object';
}
```

### Special Name Mappings

Based on the pattern analysis, we only need to handle these special cases:

```haxe
private function getSpecialFieldNames(javaGetter:String, defaultName:String):Array<String> {
    return switch(javaGetter) {
        case "getInt()": ["intValue"];
        case "getFloat()": ["floatValue"];
        case "getString()": ["stringValue"];
        case "getPhysicsConstraints()": ["physics"];
        case "getUpdateCache()": ["_updateCache"];
        case "getSetupPose()": ["setup"];
        case "getAppliedPose()": ["applied"];
        default: [];
    }
}
```

## Implementation Steps

### Phase 1: Core Reflection System
1. Implement `getPropertyValue` with fallback chain
2. Handle special field name mappings
3. Test with known edge cases

### Phase 2: Type Handling
1. Keep existing Java → Haxe type transformations
2. Use `Dynamic` for runtime resolution
3. Cast results when needed for type safety

### Phase 3: Code Generation
1. Generate simpler code using reflection helpers
2. No need for complex getter-to-field mappings
3. Handle enums with runtime type checking

## Advantages

1. **Simplicity**: No need to parse mapping files or maintain lookup tables
2. **Robustness**: Automatically handles API changes
3. **Correctness**: Runtime resolution ensures we get the right value
4. **Maintainability**: Minimal special cases to maintain

## Trade-offs

1. **Performance**: Reflection is slower than direct access (acceptable for serialization)
2. **Type Safety**: Less compile-time checking (mitigated by runtime tests)
3. **Debugging**: Harder to trace field access (can add logging)

## Example Generated Code

```haxe
private function writeAnimation(obj:Animation):Void {
    // ... cycle detection ...
    
    json.writeObjectStart();
    json.writeName("type");
    json.writeValue("Animation");
    
    // Use reflection for all properties
    json.writeName("timelines");
    writeArray(getPropertyValue(obj, "getTimelines()"), writeTimeline);
    
    json.writeName("duration");
    json.writeValue(getPropertyValue(obj, "getDuration()"));
    
    json.writeName("bones");
    writeIntArray(getPropertyValue(obj, "getBones()"));
    
    json.writeName("name");
    json.writeValue(getPropertyValue(obj, "getName()"));
    
    json.writeObjectEnd();
}
```

## Summary

This reflection-based approach eliminates the complexity of maintaining mapping tables while preserving correctness. The patterns we analyzed show that most getters follow predictable conventions, with only a handful of special cases that can be handled with a simple switch statement.