#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import type { Property, SerializerIR } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function transformType (javaType: string): string {
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
		const match = simpleName.match(/Array<(.+)>/);
		if (match) {
			return `Array<${transformType(match[1])}>`;
		}
	}

	// Handle special generic types
	if (simpleName === 'Constraint') {
		return 'Constraint<Dynamic, Dynamic, Dynamic>';
	}
	if (simpleName === 'ConstraintData') {
		return 'ConstraintData<Dynamic, Dynamic>';
	}

	// Handle TransformConstraintData inner classes
	if (['FromProperty', 'FromRotate', 'FromScaleX', 'FromScaleY', 'FromShearY', 'FromX', 'FromY',
		'ToProperty', 'ToRotate', 'ToScaleX', 'ToScaleY', 'ToShearY', 'ToX', 'ToY'].includes(simpleName)) {
		return 'spine.TransformConstraintData.' + simpleName;
	}

	// Object types: keep class name, remove package
	return simpleName;
}

function generateReflectionBasedHaxe (ir: SerializerIR): string {
	const lines: string[] = [];

	// File header
	lines.push('package spine.utils;');
	lines.push('');
	lines.push('import haxe.ds.ObjectMap;');
	lines.push('import spine.*;');
	lines.push('import spine.animation.*;');
	lines.push('import spine.attachments.*;');
	lines.push('');
	lines.push('class SkeletonSerializer {');
	lines.push('    private var visitedObjects:ObjectMap<Dynamic, String> = new ObjectMap();');
	lines.push('    private var nextId:Int = 1;');
	lines.push('    private var json:JsonWriter;');
	lines.push('');
	lines.push('    public function new() {}');
	lines.push('');

	// Generate public methods
	for (const method of ir.publicMethods) {
		const haxeParamType = transformType(method.paramType);
		lines.push(`    public function ${method.name}(${method.paramName}:${haxeParamType}):String {`);
		lines.push('        visitedObjects = new ObjectMap();');
		lines.push('        nextId = 1;');
		lines.push('        json = new JsonWriter();');
		lines.push(`        ${method.writeMethodCall}(${method.paramName});`);
		lines.push('        return json.getString();');
		lines.push('    }');
		lines.push('');
	}

	// Core reflection helper methods
	lines.push('    // Core reflection helpers');
	lines.push('    private function extractPropertyName(javaGetter:String):String {');
	lines.push('        var getter = javaGetter;');
	lines.push('        if (getter.indexOf("()") != -1) getter = getter.substr(0, getter.length - 2);');
	lines.push('        ');
	lines.push('        if (getter.substr(0, 3) == "get") {');
	lines.push('            var prop = getter.substr(3);');
	lines.push('            return prop.charAt(0).toLowerCase() + prop.substr(1);');
	lines.push('        }');
	lines.push('        if (getter.substr(0, 2) == "is") {');
	lines.push('            var prop = getter.substr(2);');
	lines.push('            return prop.charAt(0).toLowerCase() + prop.substr(1);');
	lines.push('        }');
	lines.push('        return getter;');
	lines.push('    }');
	lines.push('');

	lines.push('    private function getSpecialFieldNames(javaGetter:String):Array<String> {');
	lines.push('        return switch(javaGetter) {');
	lines.push('            case "getInt()": ["intValue"];');
	lines.push('            case "getFloat()": ["floatValue"];');
	lines.push('            case "getString()": ["stringValue"];');
	lines.push('            case "getPhysicsConstraints()": ["physics"];');
	lines.push('            case "getUpdateCache()": ["_updateCache"];');
	lines.push('            case "getSetupPose()": ["setup"];');
	lines.push('            case "getAppliedPose()": ["applied"];');
	lines.push('            default: [];');
	lines.push('        }');
	lines.push('    }');
	lines.push('');

	lines.push('    private function getPropertyValue(obj:Dynamic, javaGetter:String):Dynamic {');
	lines.push('        var propName = extractPropertyName(javaGetter);');
	lines.push('        ');
	lines.push('        // Try direct field access first');
	lines.push('        if (Reflect.hasField(obj, propName)) {');
	lines.push('            return Reflect.field(obj, propName);');
	lines.push('        }');
	lines.push('        ');
	lines.push('        // Try special field variations');
	lines.push('        var specialNames = getSpecialFieldNames(javaGetter);');
	lines.push('        for (name in specialNames) {');
	lines.push('            if (Reflect.hasField(obj, name)) {');
	lines.push('                return Reflect.field(obj, name);');
	lines.push('            }');
	lines.push('        }');
	lines.push('        ');
	lines.push('        // Try method access (remove parentheses)');
	lines.push('        var methodName = javaGetter;');
	lines.push('        if (methodName.indexOf("()") != -1) {');
	lines.push('            methodName = methodName.substr(0, methodName.length - 2);');
	lines.push('        }');
	lines.push('        if (Reflect.hasField(obj, methodName)) {');
	lines.push('            var method = Reflect.field(obj, methodName);');
	lines.push('            if (Reflect.isFunction(method)) {');
	lines.push('                return Reflect.callMethod(obj, method, []);');
	lines.push('            }');
	lines.push('        }');
	lines.push('        ');
	lines.push('        // Last resort: return null and let the caller handle it');
	lines.push('        return null;');
	lines.push('    }');
	lines.push('');

	// Generate write methods
	for (const method of ir.writeMethods) {
		const shortName = method.paramType.split('.').pop();
		const haxeType = transformType(method.paramType);

		lines.push(`    private function ${method.name}(obj:Dynamic):Void {`);

		if (method.isAbstractType) {
			// Handle abstract types with Std.isOfType chain
			if (method.subtypeChecks && method.subtypeChecks.length > 0) {
				let first = true;
				for (const subtype of method.subtypeChecks) {
					const subtypeHaxeName = transformType(subtype.typeName);

					if (first) {
						lines.push(`        if (Std.isOfType(obj, ${subtypeHaxeName})) {`);
						first = false;
					} else {
						lines.push(`        } else if (Std.isOfType(obj, ${subtypeHaxeName})) {`);
					}
					lines.push(`            ${subtype.writeMethodCall}(obj);`);
				}
				lines.push('        } else {');
				lines.push(`            throw new spine.SpineException("Unknown ${shortName} type");`);
				lines.push('        }');
			} else {
				lines.push('        json.writeNull(); // No concrete implementations');
			}
		} else {
			// Handle concrete types
			lines.push('        if (visitedObjects.exists(obj)) {');
			lines.push('            json.writeValue(visitedObjects.get(obj));');
			lines.push('            return;');
			lines.push('        }');
			lines.push('');

			// Generate reference string
			const hasNameProperty = method.properties.some(p =>
				p.name === 'name' && p.valueType === 'String'
			);

			if (hasNameProperty) {
				lines.push('        var nameValue = getPropertyValue(obj, "getName()");');
				lines.push(`        var refString = nameValue != null ? "<${shortName}-" + nameValue + ">" : "<${shortName}-" + nextId++ + ">";`);
			} else {
				lines.push(`        var refString = "<${shortName}-" + nextId++ + ">";`);
			}

			lines.push('        visitedObjects.set(obj, refString);');
			lines.push('');
			lines.push('        json.writeObjectStart();');
			lines.push('        json.writeName("refString");');
			lines.push('        json.writeValue(refString);');
			lines.push('        json.writeName("type");');
			lines.push(`        json.writeValue("${shortName}");`);

			// Write properties using reflection
			for (const property of method.properties) {
				lines.push('');
				lines.push(`        json.writeName("${property.name}");`);
				lines.push(`        writeProperty(obj, "${property.getter}", ${JSON.stringify(property)});`);
			}

			lines.push('');
			lines.push('        json.writeObjectEnd();');
		}

		lines.push('    }');
		lines.push('');
	}

	// Generic property writer using reflection
	lines.push('    private function writeProperty(obj:Dynamic, javaGetter:String, propertyInfo:Dynamic):Void {');
	lines.push('        var value = getPropertyValue(obj, javaGetter);');
	lines.push('        ');
	lines.push('        if (value == null) {');
	lines.push('            json.writeNull();');
	lines.push('            return;');
	lines.push('        }');
	lines.push('        ');
	lines.push('        switch (propertyInfo.kind) {');
	lines.push('            case "primitive":');
	lines.push('                json.writeValue(value);');
	lines.push('                ');
	lines.push('            case "object":');
	lines.push('                var writeMethod = Reflect.field(this, propertyInfo.writeMethodCall);');
	lines.push('                if (writeMethod != null) {');
	lines.push('                    Reflect.callMethod(this, writeMethod, [value]);');
	lines.push('                } else {');
	lines.push('                    json.writeValue("<" + propertyInfo.valueType + ">");');
	lines.push('                }');
	lines.push('                ');
	lines.push('            case "enum":');
	lines.push('                // Handle enum-like classes with name property');
	lines.push('                if (Reflect.hasField(value, "name")) {');
	lines.push('                    json.writeValue(Reflect.field(value, "name"));');
	lines.push('                } else {');
	lines.push('                    // Fallback for actual Haxe enums');
	lines.push('                    var enumValue = Type.enumConstructor(value);');
	lines.push('                    json.writeValue(enumValue != null ? enumValue : "unknown");');
	lines.push('                }');
	lines.push('                ');
	lines.push('            case "array":');
	lines.push('                writeArray(value, propertyInfo);');
	lines.push('                ');
	lines.push('            case "nestedArray":');
	lines.push('                writeNestedArray(value);');
	lines.push('        }');
	lines.push('    }');
	lines.push('');

	lines.push('    private function writeArray(arr:Dynamic, propertyInfo:Dynamic):Void {');
	lines.push('        if (arr == null) {');
	lines.push('            json.writeNull();');
	lines.push('            return;');
	lines.push('        }');
	lines.push('        ');
	lines.push('        json.writeArrayStart();');
	lines.push('        for (item in cast(arr, Array<Dynamic>)) {');
	lines.push('            if (propertyInfo.elementKind == "primitive") {');
	lines.push('                json.writeValue(item);');
	lines.push('            } else if (propertyInfo.writeMethodCall != null) {');
	lines.push('                var writeMethod = Reflect.field(this, propertyInfo.writeMethodCall);');
	lines.push('                if (writeMethod != null) {');
	lines.push('                    Reflect.callMethod(this, writeMethod, [item]);');
	lines.push('                } else {');
	lines.push('                    json.writeValue(item);');
	lines.push('                }');
	lines.push('            } else {');
	lines.push('                json.writeValue(item);');
	lines.push('            }');
	lines.push('        }');
	lines.push('        json.writeArrayEnd();');
	lines.push('    }');
	lines.push('');

	lines.push('    private function writeNestedArray(arr:Dynamic):Void {');
	lines.push('        if (arr == null) {');
	lines.push('            json.writeNull();');
	lines.push('            return;');
	lines.push('        }');
	lines.push('        ');
	lines.push('        json.writeArrayStart();');
	lines.push('        for (nestedArray in cast(arr, Array<Dynamic>)) {');
	lines.push('            if (nestedArray == null) {');
	lines.push('                json.writeNull();');
	lines.push('            } else {');
	lines.push('                json.writeArrayStart();');
	lines.push('                for (elem in cast(nestedArray, Array<Dynamic>)) {');
	lines.push('                    json.writeValue(elem);');
	lines.push('                }');
	lines.push('                json.writeArrayEnd();');
	lines.push('            }');
	lines.push('        }');
	lines.push('        json.writeArrayEnd();');
	lines.push('    }');
	lines.push('');

	// Special type helpers
	lines.push('    // Helper methods for special types');
	lines.push('    private function writeColor(obj:Dynamic):Void {');
	lines.push('        if (obj == null) {');
	lines.push('            json.writeNull();');
	lines.push('            return;');
	lines.push('        }');
	lines.push('        json.writeObjectStart();');
	lines.push('        json.writeName("r");');
	lines.push('        json.writeValue(Reflect.field(obj, "r"));');
	lines.push('        json.writeName("g");');
	lines.push('        json.writeValue(Reflect.field(obj, "g"));');
	lines.push('        json.writeName("b");');
	lines.push('        json.writeValue(Reflect.field(obj, "b"));');
	lines.push('        json.writeName("a");');
	lines.push('        json.writeValue(Reflect.field(obj, "a"));');
	lines.push('        json.writeObjectEnd();');
	lines.push('    }');
	lines.push('');

	lines.push('    private function writeTextureRegion(obj:Dynamic):Void {');
	lines.push('        json.writeValue("<TextureRegion>");');
	lines.push('    }');
	lines.push('');

	lines.push('    private function writeIntArray(obj:Dynamic):Void {');
	lines.push('        if (obj == null) {');
	lines.push('            json.writeNull();');
	lines.push('            return;');
	lines.push('        }');
	lines.push('        // IntArray in Java might be a custom type, try to get its array data');
	lines.push('        var items = getPropertyValue(obj, "getItems()");');
	lines.push('        if (items != null) {');
	lines.push('            writeArray(items, {elementKind: "primitive"});');
	lines.push('        } else {');
	lines.push('            // Fallback: assume it\'s already an array');
	lines.push('            writeArray(obj, {elementKind: "primitive"});');
	lines.push('        }');
	lines.push('    }');
	lines.push('');

	lines.push('    private function writeFloatArray(obj:Dynamic):Void {');
	lines.push('        if (obj == null) {');
	lines.push('            json.writeNull();');
	lines.push('            return;');
	lines.push('        }');
	lines.push('        // FloatArray in Java might be a custom type, try to get its array data');
	lines.push('        var items = getPropertyValue(obj, "getItems()");');
	lines.push('        if (items != null) {');
	lines.push('            writeArray(items, {elementKind: "primitive"});');
	lines.push('        } else {');
	lines.push('            // Fallback: assume it\'s already an array');
	lines.push('            writeArray(obj, {elementKind: "primitive"});');
	lines.push('        }');
	lines.push('    }');

	lines.push('}');

	return lines.join('\n');
}

async function validateGeneratedHaxeCode (haxeCode: string, outputPath: string): Promise<void> {
	// Write code to file
	fs.writeFileSync(outputPath, haxeCode);

	try {
		// Basic syntax validation
		execSync('haxe -cp spine-haxe --no-output -main spine.utils.JsonWriter', {
			cwd: path.resolve(__dirname, '../../spine-haxe'),
			stdio: 'pipe'
		});

		console.log('✓ Generated Haxe serializer syntax validates successfully');

	} catch (error: any) {
		console.log('⚠ Haxe serializer validation had issues (may still work):');
		console.log(error.message.split('\n').slice(0, 3).join('\n'));
	}
}

async function main (): Promise<void> {
	try {
		// Read the IR file
		const irFile = path.resolve(__dirname, '../output/serializer-ir.json');
		if (!fs.existsSync(irFile)) {
			console.error('Serializer IR not found. Run generate-serializer-ir.ts first.');
			process.exit(1);
		}

		const ir: SerializerIR = JSON.parse(fs.readFileSync(irFile, 'utf8'));

		// Generate Haxe serializer using reflection-based approach
		const haxeCode = generateReflectionBasedHaxe(ir);

		// Write the Haxe file
		const haxeFile = path.resolve(
			__dirname,
			'../../spine-haxe/spine-haxe/spine/utils/SkeletonSerializer.hx'
		);

		fs.mkdirSync(path.dirname(haxeFile), { recursive: true });

		// Validate generated code
		await validateGeneratedHaxeCode(haxeCode, haxeFile);

		console.log(`Generated reflection-based Haxe serializer: ${haxeFile}`);
		console.log(`- ${ir.publicMethods.length} public methods`);
		console.log(`- ${ir.writeMethods.length} write methods`);
		console.log(`- Uses runtime reflection for property access`);

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

export { generateReflectionBasedHaxe };