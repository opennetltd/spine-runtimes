# Haxe Serializer Generator Implementation Plan

## Overview

This document outlines the complete implementation plan for adding Haxe support to the Spine runtime testing infrastructure. The goal is to generate a Haxe serializer that produces identical JSON output to the existing Java and C++ serializers, enabling cross-runtime compatibility testing.

## Current System Architecture

The existing system consists of three layers:

1. **SerializerIR Generation** (`tests/src/generate-serializer-ir.ts`)
   - Analyzes Java API to create intermediate representation
   - Outputs `tests/output/serializer-ir.json` with type and property metadata

2. **Language-Specific Generators** 
   - `tests/src/generate-java-serializer.ts` - Java implementation
   - `tests/src/generate-cpp-serializer.ts` - C++ implementation  
   - **Missing**: `tests/src/generate-haxe-serializer.ts`

3. **HeadlessTest Applications**
   - `spine-libgdx/spine-libgdx-tests/src/com/esotericsoftware/spine/HeadlessTest.java`
   - `spine-cpp/tests/HeadlessTest.cpp`
   - **Missing**: `spine-haxe/tests/HeadlessTest.hx`

4. **Test Runner** (`tests/src/headless-test-runner.ts`)
   - Orchestrates building and running tests
   - Compares outputs for consistency
   - Currently supports: Java, C++
   - **Needs**: Haxe support

## SerializerIR Structure Reference

Based on `tests/src/generate-serializer-ir.ts:10-80`:

```typescript
interface SerializerIR {
    publicMethods: PublicMethod[];     // Entry point methods
    writeMethods: WriteMethod[];       // Type-specific serializers  
    enumMappings: { [enumName: string]: { [javaValue: string]: string } };
}

interface WriteMethod {
    name: string;                      // writeSkeletonData, writeBone, etc.
    paramType: string;                 // Full Java class name
    properties: Property[];            // Fields to serialize
    isAbstractType: boolean;           // Needs instanceof chain
    subtypeChecks?: SubtypeCheck[];    // For abstract types
}

type Property = Primitive | Object | Enum | Array | NestedArray;
```

## Implementation Plan

### 1. Generate Haxe Serializer (`tests/src/generate-haxe-serializer.ts`)

Create the generator following the pattern from existing generators:

```typescript
#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Property, SerializerIR } from './generate-serializer-ir';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function transformType(javaType: string): string {
    // Java → Haxe type mappings
    const primitiveMap: Record<string, string> = {
        'String': 'String',
        'int': 'Int',
        'float': 'Float', 
        'boolean': 'Bool',
        'short': 'Int',
        'byte': 'Int',
        'double': 'Float',
        'long': 'Int'
    };

    // Remove package prefixes and map primitives
    const simpleName = javaType.includes('.') ? javaType.split('.').pop()! : javaType;
    
    if (primitiveMap[simpleName]) {
        return primitiveMap[simpleName];
    }

    // Handle arrays: Java T[] → Haxe Array<T>
    if (simpleName.endsWith('[]')) {
        const baseType = simpleName.slice(0, -2);
        return `Array<${transformType(baseType)}>`;
    }

    // Java Array<T> stays Array<T> in Haxe
    if (simpleName.startsWith('Array<')) {
        return simpleName;
    }

    // Object types: keep class name, remove package
    return simpleName;
}

function mapJavaGetterToHaxeField(javaGetter: string, objName: string): string {
    // Map Java getter methods to Haxe field access
    // Based on analysis of existing Haxe classes in spine-haxe/spine-haxe/spine/
    
    if (javaGetter.endsWith('()')) {
        const methodName = javaGetter.slice(0, -2);
        
        // Remove get/is prefix and convert to camelCase field
        if (methodName.startsWith('get')) {
            const fieldName = methodName.slice(3);
            const haxeField = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
            return `${objName}.${haxeField}`;
        }
        
        if (methodName.startsWith('is')) {
            const fieldName = methodName.slice(2);
            const haxeField = fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
            return `${objName}.${haxeField}`;
        }
        
        // Some methods might be direct field names
        return `${objName}.${methodName}`;
    }
    
    // Direct field access (already in correct format)
    return `${objName}.${javaGetter}`;
}

function generatePropertyCode(property: Property, indent: string, enumMappings: { [enumName: string]: { [javaValue: string]: string } }): string[] {
    const lines: string[] = [];
    const accessor = mapJavaGetterToHaxeField(property.getter, 'obj');

    switch (property.kind) {
        case "primitive":
            lines.push(`${indent}json.writeValue(${accessor});`);
            break;

        case "object":
            if (property.isNullable) {
                lines.push(`${indent}if (${accessor} == null) {`);
                lines.push(`${indent}    json.writeNull();`);
                lines.push(`${indent}} else {`);
                lines.push(`${indent}    ${property.writeMethodCall}(${accessor});`);
                lines.push(`${indent}}`);
            } else {
                lines.push(`${indent}${property.writeMethodCall}(${accessor});`);
            }
            break;

        case "enum": {
            const enumName = property.enumName;
            const enumMap = enumMappings[enumName];
            
            if (property.isNullable) {
                lines.push(`${indent}if (${accessor} == null) {`);
                lines.push(`${indent}    json.writeNull();`);
                lines.push(`${indent}} else {`);
            }

            if (enumMap && Object.keys(enumMap).length > 0) {
                // Generate switch statement for enum mapping
                lines.push(`${indent}${property.isNullable ? '    ' : ''}switch (${accessor}) {`);
                
                for (const [javaValue, haxeValue] of Object.entries(enumMap)) {
                    lines.push(`${indent}${property.isNullable ? '    ' : ''}    case ${haxeValue}: json.writeValue("${javaValue}");`);
                }
                
                lines.push(`${indent}${property.isNullable ? '    ' : ''}    default: json.writeValue("unknown");`);
                lines.push(`${indent}${property.isNullable ? '    ' : ''}}`);
            } else {
                // Fallback using Type.enumConstructor or similar
                lines.push(`${indent}${property.isNullable ? '    ' : ''}json.writeValue(Type.enumConstructor(${accessor}));`);
            }
            
            if (property.isNullable) {
                lines.push(`${indent}}`);
            }
            break;
        }

        case "array": {
            if (property.isNullable) {
                lines.push(`${indent}if (${accessor} == null) {`);
                lines.push(`${indent}    json.writeNull();`);
                lines.push(`${indent}} else {`);
                lines.push(`${indent}    json.writeArrayStart();`);
                lines.push(`${indent}    for (item in ${accessor}) {`);
            } else {
                lines.push(`${indent}json.writeArrayStart();`);
                lines.push(`${indent}for (item in ${accessor}) {`);
            }

            const itemIndent = property.isNullable ? `${indent}        ` : `${indent}    `;
            if (property.elementKind === "primitive") {
                lines.push(`${itemIndent}json.writeValue(item);`);
            } else {
                lines.push(`${itemIndent}${property.writeMethodCall}(item);`);
            }

            if (property.isNullable) {
                lines.push(`${indent}    }`);
                lines.push(`${indent}    json.writeArrayEnd();`);
                lines.push(`${indent}}`);
            } else {
                lines.push(`${indent}}`);
                lines.push(`${indent}json.writeArrayEnd();`);
            }
            break;
        }

        case "nestedArray": {
            if (property.isNullable) {
                lines.push(`${indent}if (${accessor} == null) {`);
                lines.push(`${indent}    json.writeNull();`);
                lines.push(`${indent}} else {`);
            }

            const outerIndent = property.isNullable ? `${indent}    ` : indent;
            lines.push(`${outerIndent}json.writeArrayStart();`);
            lines.push(`${outerIndent}for (nestedArray in ${accessor}) {`);
            lines.push(`${outerIndent}    if (nestedArray == null) {`);
            lines.push(`${outerIndent}        json.writeNull();`);
            lines.push(`${outerIndent}    } else {`);
            lines.push(`${outerIndent}        json.writeArrayStart();`);
            lines.push(`${outerIndent}        for (elem in nestedArray) {`);
            lines.push(`${outerIndent}            json.writeValue(elem);`);
            lines.push(`${outerIndent}        }`);
            lines.push(`${outerIndent}        json.writeArrayEnd();`);
            lines.push(`${outerIndent}    }`);
            lines.push(`${outerIndent}}`);
            lines.push(`${outerIndent}json.writeArrayEnd();`);

            if (property.isNullable) {
                lines.push(`${indent}}`);
            }
            break;
        }
    }

    return lines;
}

function generateHaxeFromIR(ir: SerializerIR): string {
    const haxeOutput: string[] = [];

    // Generate Haxe file header
    haxeOutput.push('package spine.utils;');
    haxeOutput.push('');
    haxeOutput.push('import haxe.ds.StringMap;');
    haxeOutput.push('import spine.*;');
    haxeOutput.push('import spine.animation.*;');
    haxeOutput.push('import spine.attachments.*;');
    haxeOutput.push('');
    haxeOutput.push('class SkeletonSerializer {');
    haxeOutput.push('    private var visitedObjects:StringMap<String> = new StringMap();');
    haxeOutput.push('    private var nextId:Int = 1;');
    haxeOutput.push('    private var json:JsonWriter;');
    haxeOutput.push('');
    haxeOutput.push('    public function new() {}');
    haxeOutput.push('');

    // Generate public methods
    for (const method of ir.publicMethods) {
        const haxeParamType = transformType(method.paramType);
        haxeOutput.push(`    public function ${method.name}(${method.paramName}:${haxeParamType}):String {`);
        haxeOutput.push('        visitedObjects = new StringMap();');
        haxeOutput.push('        nextId = 1;');
        haxeOutput.push('        json = new JsonWriter();');
        haxeOutput.push(`        ${method.writeMethodCall}(${method.paramName});`);
        haxeOutput.push('        return json.getString();');
        haxeOutput.push('    }');
        haxeOutput.push('');
    }

    // Generate write methods
    for (const method of ir.writeMethods) {
        const shortName = method.paramType.split('.').pop();
        const haxeType = transformType(method.paramType);

        haxeOutput.push(`    private function ${method.name}(obj:${haxeType}):Void {`);

        if (method.isAbstractType) {
            // Handle abstract types with Std.isOfType chain (Haxe equivalent of instanceof)
            if (method.subtypeChecks && method.subtypeChecks.length > 0) {
                let first = true;
                for (const subtype of method.subtypeChecks) {
                    const subtypeHaxeName = transformType(subtype.typeName);

                    if (first) {
                        haxeOutput.push(`        if (Std.isOfType(obj, ${subtypeHaxeName})) {`);
                        first = false;
                    } else {
                        haxeOutput.push(`        } else if (Std.isOfType(obj, ${subtypeHaxeName})) {`);
                    }
                    haxeOutput.push(`            ${subtype.writeMethodCall}(cast(obj, ${subtypeHaxeName}));`);
                }
                haxeOutput.push('        } else {');
                haxeOutput.push(`            throw new spine.SpineException("Unknown ${shortName} type");`);
                haxeOutput.push('        }');
            } else {
                haxeOutput.push('        json.writeNull(); // No concrete implementations after filtering exclusions');
            }
        } else {
            // Handle concrete types - add cycle detection
            haxeOutput.push('        if (visitedObjects.exists(obj)) {');
            haxeOutput.push('            json.writeValue(visitedObjects.get(obj));');
            haxeOutput.push('            return;');
            haxeOutput.push('        }');

            // Generate reference string
            const nameGetter = method.properties.find(p => 
                (p.kind === 'object' || p.kind === "primitive") &&
                p.getter === 'getName()' &&
                p.valueType === 'String'
            );

            if (nameGetter) {
                const nameAccessor = mapJavaGetterToHaxeField('getName()', 'obj');
                haxeOutput.push(`        var refString = ${nameAccessor} != null ? "<${shortName}-" + ${nameAccessor} + ">" : "<${shortName}-" + (nextId++) + ">";`);
            } else {
                haxeOutput.push(`        var refString = "<${shortName}-" + (nextId++) + ">";`);
            }
            haxeOutput.push('        visitedObjects.set(obj, refString);');
            haxeOutput.push('');

            haxeOutput.push('        json.writeObjectStart();');

            // Write reference string and type
            haxeOutput.push('        json.writeName("refString");');
            haxeOutput.push('        json.writeValue(refString);');
            haxeOutput.push('        json.writeName("type");');
            haxeOutput.push(`        json.writeValue("${shortName}");`);

            // Write properties
            for (const property of method.properties) {
                haxeOutput.push('');
                haxeOutput.push(`        json.writeName("${property.name}");`);
                const propertyLines = generatePropertyCode(property, '        ', ir.enumMappings);
                haxeOutput.push(...propertyLines);
            }

            haxeOutput.push('');
            haxeOutput.push('        json.writeObjectEnd();');
        }

        haxeOutput.push('    }');
        haxeOutput.push('');
    }

    // Add helper methods for special types (following C++ pattern)
    haxeOutput.push('    // Helper methods for special types');
    haxeOutput.push('    private function writeColor(obj:spine.Color):Void {');
    haxeOutput.push('        if (obj == null) {');
    haxeOutput.push('            json.writeNull();');
    haxeOutput.push('        } else {');
    haxeOutput.push('            json.writeObjectStart();');
    haxeOutput.push('            json.writeName("r");');
    haxeOutput.push('            json.writeValue(obj.r);');
    haxeOutput.push('            json.writeName("g");');
    haxeOutput.push('            json.writeValue(obj.g);');
    haxeOutput.push('            json.writeName("b");');
    haxeOutput.push('            json.writeValue(obj.b);');
    haxeOutput.push('            json.writeName("a");');
    haxeOutput.push('            json.writeValue(obj.a);');
    haxeOutput.push('            json.writeObjectEnd();');
    haxeOutput.push('        }');
    haxeOutput.push('    }');
    haxeOutput.push('');

    haxeOutput.push('}');

    return haxeOutput.join('\n');
}

async function main(): Promise<void> {
    try {
        // Read the IR file
        const irFile = path.resolve(__dirname, '../output/serializer-ir.json');
        if (!fs.existsSync(irFile)) {
            console.error('Serializer IR not found. Run generate-serializer-ir.ts first.');
            process.exit(1);
        }

        const ir: SerializerIR = JSON.parse(fs.readFileSync(irFile, 'utf8'));

        // Generate Haxe serializer from IR
        const haxeCode = generateHaxeFromIR(ir);

        // Write the Haxe file
        const haxeFile = path.resolve(
            __dirname,
            '../../spine-haxe/spine-haxe/spine/utils/SkeletonSerializer.hx'
        );

        fs.mkdirSync(path.dirname(haxeFile), { recursive: true });
        fs.writeFileSync(haxeFile, haxeCode);

        console.log(`Generated Haxe serializer from IR: ${haxeFile}`);
        console.log(`- ${ir.publicMethods.length} public methods`);
        console.log(`- ${ir.writeMethods.length} write methods`);
        console.log(`- ${Object.keys(ir.enumMappings).length} enum mappings`);

    } catch (error: any) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Allow running as a script or importing the function
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { generateHaxeFromIR };
```

### 2. JsonWriter Helper Class (`spine-haxe/spine-haxe/spine/utils/JsonWriter.hx`)

Based on the pattern from `spine-cpp/tests/JsonWriter.h`, create a Haxe equivalent:

```haxe
package spine.utils;

enum JsonContext {
    Object;
    Array;
}

class JsonWriter {
    private var buffer:StringBuf = new StringBuf();
    private var needsComma:Bool = false;
    private var contexts:Array<JsonContext> = [];

    public function new() {
        buffer = new StringBuf();
        needsComma = false;
        contexts = [];
    }

    public function writeObjectStart():Void {
        writeCommaIfNeeded();
        buffer.add("{");
        contexts.push(Object);
        needsComma = false;
    }

    public function writeObjectEnd():Void {
        buffer.add("}");
        contexts.pop();
        needsComma = true;
    }

    public function writeArrayStart():Void {
        writeCommaIfNeeded();
        buffer.add("[");
        contexts.push(Array);
        needsComma = false;
    }

    public function writeArrayEnd():Void {
        buffer.add("]");
        contexts.pop();
        needsComma = true;
    }

    public function writeName(name:String):Void {
        writeCommaIfNeeded();
        buffer.add('"${escapeString(name)}":');
        needsComma = false;
    }

    public function writeValue(value:Dynamic):Void {
        writeCommaIfNeeded();
        
        if (value == null) {
            buffer.add("null");
        } else if (Std.isOfType(value, String)) {
            buffer.add('"${escapeString(cast(value, String))}"');
        } else if (Std.isOfType(value, Bool)) {
            buffer.add(value ? "true" : "false");
        } else if (Std.isOfType(value, Float) || Std.isOfType(value, Int)) {
            // Ensure consistent float formatting (C locale style)
            buffer.add(Std.string(value));
        } else {
            buffer.add(Std.string(value));
        }
        
        needsComma = true;
    }

    public function writeNull():Void {
        writeCommaIfNeeded();
        buffer.add("null");
        needsComma = true;
    }

    public function getString():String {
        return buffer.toString();
    }

    private function writeCommaIfNeeded():Void {
        if (needsComma) {
            buffer.add(",");
        }
    }

    private function escapeString(str:String):String {
        // Escape special characters for JSON
        str = StringTools.replace(str, "\\", "\\\\");
        str = StringTools.replace(str, '"', '\\"');
        str = StringTools.replace(str, "\n", "\\n");
        str = StringTools.replace(str, "\r", "\\r");
        str = StringTools.replace(str, "\t", "\\t");
        return str;
    }
}
```

### 3. Haxe HeadlessTest Application (`spine-haxe/tests/HeadlessTest.hx`)

Following the pattern from existing HeadlessTest implementations:

```haxe
package;

import spine.*;
import spine.atlas.TextureAtlas;
import spine.atlas.TextureAtlasPage;
import spine.atlas.TextureLoader;
import spine.attachments.AtlasAttachmentLoader;
import spine.animation.*;
import spine.utils.SkeletonSerializer;
import sys.io.File;
import haxe.io.Bytes;

// Mock texture loader that doesn't require actual texture loading
class MockTextureLoader implements TextureLoader {
    public function new() {}
    
    public function load(page:TextureAtlasPage, path:String):Void {
        // Set mock dimensions - no actual texture loading needed
        page.width = 1024;
        page.height = 1024;
        page.texture = {}; // Empty object as mock texture
    }
    
    public function unload(texture:Dynamic):Void {
        // Nothing to unload in headless mode
    }
}

class HeadlessTest {
    static function main():Void {
        var args = Sys.args();
        
        if (args.length < 2) {
            Sys.stderr().writeString("Usage: HeadlessTest <skeleton-path> <atlas-path> [animation-name]\n");
            Sys.exit(1);
        }
        
        var skeletonPath = args[0];
        var atlasPath = args[1]; 
        var animationName = args.length >= 3 ? args[2] : null;
        
        try {
            // Load atlas with mock texture loader
            var textureLoader = new MockTextureLoader();
            var atlasContent = File.getContent(atlasPath);
            var atlas = new TextureAtlas(atlasContent, textureLoader);
            
            // Load skeleton data
            var skeletonData:SkeletonData;
            var attachmentLoader = new AtlasAttachmentLoader(atlas);
            
            if (StringTools.endsWith(skeletonPath, ".json")) {
                var loader = new SkeletonJson(attachmentLoader);
                var jsonContent = File.getContent(skeletonPath);
                skeletonData = loader.readSkeletonData(jsonContent);
            } else {
                var loader = new SkeletonBinary(attachmentLoader);
                var binaryContent = File.getBytes(skeletonPath);
                skeletonData = loader.readSkeletonData(binaryContent);
            }
            
            // Create serializer
            var serializer = new SkeletonSerializer();
            
            // Print skeleton data
            Sys.println("=== SKELETON DATA ===");
            Sys.println(serializer.serializeSkeletonData(skeletonData));
            
            // Create skeleton instance
            var skeleton = new Skeleton(skeletonData);
            
            // Handle animation if provided
            var state:AnimationState = null;
            if (animationName != null) {
                var stateData = new AnimationStateData(skeletonData);
                state = new AnimationState(stateData);
                
                var animation = skeletonData.findAnimation(animationName);
                if (animation == null) {
                    Sys.stderr().writeString('Animation not found: $animationName\n');
                    Sys.exit(1);
                }
                
                state.setAnimation(0, animation, true);
                state.update(0.016);
                state.apply(skeleton);
            }
            
            // Update world transforms (following the pattern from other HeadlessTests)
            skeleton.updateWorldTransform(Physics.update);
            
            // Print skeleton state
            Sys.println("\n=== SKELETON STATE ===");
            Sys.println(serializer.serializeSkeleton(skeleton));
            
            // Print animation state if present
            if (state != null) {
                Sys.println("\n=== ANIMATION STATE ===");
                Sys.println(serializer.serializeAnimationState(state));
            }
            
        } catch (e:Dynamic) {
            Sys.stderr().writeString('Error: $e\n');
            Sys.exit(1);
        }
    }
}
```

### 4. Build Script (`spine-haxe/build-headless-test.sh`)

```bash
#!/bin/bash

# Build Haxe HeadlessTest for cross-platform execution
# Following pattern from spine-cpp/build.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building Haxe HeadlessTest..."

# Clean previous build
rm -rf build/headless-test

# Create build directory
mkdir -p build

# Compile HeadlessTest to C++ for performance and consistency with other runtimes
haxe \
    -cp spine-haxe \
    -cp tests \
    -main HeadlessTest \
    -cpp build/headless-test \
    -D HXCPP_QUIET

# Make executable
chmod +x build/headless-test/HeadlessTest

echo "Build complete: build/headless-test/HeadlessTest"
```

### 5. Test Runner Integration (`tests/src/headless-test-runner.ts`)

Add Haxe support to the existing test runner. Key changes needed:

```typescript
// Line 207: Update supported languages
if (!['cpp', 'haxe'].includes(language)) {
    log_detail(`Invalid target language: ${language}. Must be cpp or haxe`);
    process.exit(1);
}

// Add needsHaxeBuild function (similar to needsCppBuild at line 96)
function needsHaxeBuild(): boolean {
    const haxeDir = join(SPINE_ROOT, 'spine-haxe');
    const buildDir = join(haxeDir, 'build');
    const headlessTest = join(buildDir, 'headless-test', 'HeadlessTest');

    try {
        // Check if executable exists
        if (!existsSync(headlessTest)) return true;

        // Get executable modification time
        const execTime = statSync(headlessTest).mtime.getTime();

        // Check Haxe source files
        const haxeSourceTime = getNewestFileTime(join(haxeDir, 'spine-haxe'), '*.hx');
        const testSourceTime = getNewestFileTime(join(haxeDir, 'tests'), '*.hx');
        const buildScriptTime = getNewestFileTime(haxeDir, 'build-headless-test.sh');

        const newestSourceTime = Math.max(haxeSourceTime, testSourceTime, buildScriptTime);

        return newestSourceTime > execTime;
    } catch {
        return true;
    }
}

// Add executeHaxe function (similar to executeCpp at line 321)
function executeHaxe(args: TestArgs): string {
    const haxeDir = join(SPINE_ROOT, 'spine-haxe');
    const testsDir = join(haxeDir, 'tests');

    if (!existsSync(testsDir)) {
        log_detail(`Haxe tests directory not found: ${testsDir}`);
        process.exit(1);
    }

    // Check if we need to build
    if (needsHaxeBuild()) {
        log_action('Building Haxe HeadlessTest');
        try {
            execSync('./build-headless-test.sh', {
                cwd: haxeDir,
                stdio: ['inherit', 'pipe', 'inherit']
            });
            log_ok();
        } catch (error: any) {
            log_fail();
            log_detail(`Haxe build failed: ${error.message}`);
            process.exit(1);
        }
    }

    // Run the headless test
    const testArgs = [args.skeletonPath, args.atlasPath];
    if (args.animationName) {
        testArgs.push(args.animationName);
    }

    const buildDir = join(haxeDir, 'build');
    const headlessTest = join(buildDir, 'headless-test', 'HeadlessTest');

    if (!existsSync(headlessTest)) {
        log_detail(`Haxe headless-test executable not found: ${headlessTest}`);
        process.exit(1);
    }

    log_action('Running Haxe HeadlessTest');
    try {
        const output = execSync(`${headlessTest} ${testArgs.join(' ')}`, {
            encoding: 'utf8',
            maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large output
        });
        log_ok();
        return output;
    } catch (error: any) {
        log_fail();
        log_detail(`Haxe execution failed: ${error.message}`);
        process.exit(1);
    }
}

// Update runTestsForFiles function around line 525 to handle Haxe
if (language === 'cpp') {
    targetOutput = executeCpp(testArgs);
} else if (language === 'haxe') {
    targetOutput = executeHaxe(testArgs);
} else {
    log_detail(`Unsupported target language: ${language}`);
    process.exit(1);
}
```

### 6. Build Integration (`tests/generate-serializers.sh`)

Update the serializer generation script to include Haxe:

```bash
# Add after C++ generation
echo "Generating Haxe serializer..."
tsx tests/src/generate-haxe-serializer.ts

echo "Type checking Haxe serializer..."
cd spine-haxe && haxe -cp spine-haxe --no-output -main spine.utils.SkeletonSerializer
cd ..
```

### 7. File Structure Summary

```
spine-haxe/
├── spine-haxe/spine/utils/
│   ├── SkeletonSerializer.hx  (generated)
│   └── JsonWriter.hx          (helper class)
├── tests/
│   └── HeadlessTest.hx        (console application)
├── build-headless-test.sh     (build script)
└── build/headless-test/       (compiled executable)
    └── HeadlessTest

tests/src/
├── generate-haxe-serializer.ts (new generator)
└── headless-test-runner.ts     (updated with Haxe support)
```

## Type Checking and Validation

### Compilation Validation

Add type checking to the generator to ensure generated code compiles:

```typescript
import { execSync } from 'child_process';

async function validateGeneratedHaxeCode(haxeCode: string, outputPath: string): Promise<void> {
    // Write code to file
    fs.writeFileSync(outputPath, haxeCode);
    
    try {
        // Attempt compilation without output (type check only)
        execSync('haxe -cp spine-haxe --no-output -main spine.utils.SkeletonSerializer', {
            cwd: path.resolve(__dirname, '../../spine-haxe'),
            stdio: 'pipe'
        });
        
        console.log('✓ Generated Haxe serializer compiles successfully');
        
    } catch (error: any) {
        fs.unlinkSync(outputPath);
        throw new Error(`Generated Haxe serializer failed to compile:\n${error.message}`);
    }
}

// Call in main() after generating code
await validateGeneratedHaxeCode(haxeCode, haxeFile);
```

## Key Implementation Notes

### Java → Haxe Property Mapping

Based on analysis of `spine-haxe/spine-haxe/spine/` classes:

- `obj.getName()` → `obj.name`
- `obj.getBones()` → `obj.bones` 
- `obj.isActive()` → `obj.active`
- `obj.getColor()` → `obj.color`

### Enum Handling

Haxe enums are different from Java enums. Use `Type.enumConstructor()` to get string representation:

```haxe
// For enum serialization
json.writeValue(Type.enumConstructor(obj.blendMode));
```

### Array Handling 

Haxe uses `Array<T>` syntax similar to Java, but iteration is different:

```haxe
// Haxe iteration
for (item in obj.bones) {
    writeBone(item);
}
```

### Null Safety

Haxe has explicit null checking:

```haxe
if (obj.skin == null) {
    json.writeNull();
} else {
    writeSkin(obj.skin);
}
```

## Testing and Verification

### Cross-Runtime Consistency

The test runner will automatically:

1. Build all three runtimes (Java, C++, Haxe)
2. Run identical test cases on same skeleton files
3. Compare JSON outputs for exact matches
4. Report any differences

### Manual Testing

```bash
# Generate all serializers
./tests/generate-serializers.sh

# Test specific skeleton with all runtimes
tsx tests/src/headless-test-runner.ts cpp -s spineboy idle
tsx tests/src/headless-test-runner.ts haxe -s spineboy idle

# Compare outputs
diff tests/output/skeleton-data-cpp-json.json tests/output/skeleton-data-haxe-json.json
```

## Implementation Checklist

- [ ] Create `tests/src/generate-haxe-serializer.ts`
- [ ] Create `spine-haxe/spine-haxe/spine/utils/JsonWriter.hx`
- [ ] Create `spine-haxe/tests/HeadlessTest.hx`
- [ ] Create `spine-haxe/build-headless-test.sh`
- [ ] Update `tests/src/headless-test-runner.ts` with Haxe support
- [ ] Update `tests/generate-serializers.sh`
- [ ] Test with existing skeleton examples
- [ ] Verify JSON output matches Java/C++ exactly
- [ ] Add to CI pipeline

## Expected Benefits

1. **Cross-Runtime Testing**: Verify Haxe runtime behavior matches Java/C++
2. **Debugging Support**: Unified JSON format for inspection across all runtimes  
3. **API Consistency**: Ensure Haxe API changes don't break compatibility
4. **Quality Assurance**: Automated verification of serialization correctness
5. **Development Velocity**: Fast detection of runtime-specific issues

This implementation follows the established patterns while adapting to Haxe's specific language features and build system.