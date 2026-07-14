#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { ClassInfo, PropertyInfo } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// IR Type Definitions
interface SerializerIR {
	publicMethods: PublicMethod[];
	writeMethods: WriteMethod[];
	enumMappings: { [enumName: string]: { [javaValue: string]: string } };
}

interface PublicMethod {
	name: string;
	paramType: string;
	paramName: string;
	writeMethodCall: string;
}

interface WriteMethod {
	name: string;
	paramType: string;
	properties: Property[];
	isAbstractType: boolean;
	subtypeChecks?: SubtypeCheck[];
}

interface SubtypeCheck {
	typeName: string;
	writeMethodCall: string;
}

type Property = Primitive | Object | Enum | Array | NestedArray;

interface Primitive {
	kind: "primitive";
	name: string;
	getter: string;
	valueType: string;
	isNullable: boolean;
}

interface Object {
	kind: "object";
	name: string;
	getter: string;
	valueType: string;
	writeMethodCall: string;
	isNullable: boolean;
}

interface Enum {
	kind: "enum";
	name: string;
	getter: string;
	enumName: string;
	isNullable: boolean;
}

interface Array {
	kind: "array";
	name: string;
	getter: string;
	elementType: string;
	elementKind: "primitive" | "object";
	writeMethodCall?: string;
	isNullable: boolean;
}

interface NestedArray {
	kind: "nestedArray";
	name: string;
	getter: string;
	elementType: string;
	isNullable: boolean;
}

interface SerializedAnalysisResult {
	classMap: [string, ClassInfo][];
	accessibleTypes: string[];
	abstractTypes: [string, string[]][];
	allTypesToGenerate: string[];
	typeProperties: [string, PropertyInfo[]][];
}

function loadExclusions (): { types: Set<string>, methods: Map<string, Set<string>>, fields: Map<string, Set<string>> } {
	const exclusionsPath = path.resolve(__dirname, '../java-exclusions.txt');
	const types = new Set<string>();
	const methods = new Map<string, Set<string>>();
	const fields = new Map<string, Set<string>>();

	if (!fs.existsSync(exclusionsPath)) {
		return { types, methods, fields };
	}

	const content = fs.readFileSync(exclusionsPath, 'utf-8');
	const lines = content.split('\n');

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const parts = trimmed.split(/\s+/);
		if (parts.length < 2) continue;

		const [type, className, property] = parts;

		switch (type) {
			case 'type':
				types.add(className);
				break;
			case 'method':
				if (property) {
					if (!methods.has(className)) {
						methods.set(className, new Set());
					}
					methods.get(className)!.add(property);
				}
				break;
			case 'field':
				if (property) {
					if (!fields.has(className)) {
						fields.set(className, new Set());
					}
					fields.get(className)!.add(property);
				}
				break;
		}
	}

	return { types, methods, fields };
}

function analyzePropertyType (propType: string, classMap: Map<string, ClassInfo>): Property {
	// Handle null annotations
	const isNullable = propType.includes('@Null');
	propType = propType.replace(/@Null\s+/g, '').trim();

	// Extract property name and getter from the type analysis
	// This is a simplified version - in practice we'd get this from PropertyInfo
	const name = "propertyName"; // placeholder
	const getter = "getPropertyName"; // placeholder

	// Primitive types
	if (['String', 'int', 'float', 'boolean', 'short', 'byte', 'double', 'long'].includes(propType)) {
		return {
			kind: "primitive",
			name,
			getter,
			valueType: propType,
			isNullable
		};
	}

	// Check if it's an enum
	let classInfo = classMap.get(propType);
	if (!classInfo && !propType.includes('.')) {
		// Try to find by short name
		for (const [fullName, info] of classMap) {
			if (fullName.split('.').pop() === propType) {
				classInfo = info;
				break;
			}
		}
	}

	if (classInfo?.isEnum) {
		return {
			kind: "enum",
			name,
			getter,
			enumName: propType.split('.').pop()!,
			isNullable
		};
	}

	// Arrays
	if (propType.startsWith('Array<')) {
		const innerType = propType.match(/Array<(.+?)>/)![1].trim();
		const elementKind = ['String', 'int', 'float', 'boolean', 'short', 'byte', 'double', 'long'].includes(innerType) ? "primitive" : "object";

		return {
			kind: "array",
			name,
			getter,
			elementType: innerType,
			elementKind,
			writeMethodCall: elementKind === "object" ? `write${innerType}` : undefined,
			isNullable
		};
	}

	// Handle nested arrays (like float[][])
	if (propType.endsWith('[]')) {
		const elemType = propType.slice(0, -2);
		if (elemType.endsWith('[]')) {
			const nestedType = elemType.slice(0, -2);
			return {
				kind: "nestedArray",
				name,
				getter,
				elementType: nestedType,
				isNullable
			};
		} else {
			const elementKind = ['String', 'int', 'float', 'boolean', 'short', 'byte', 'double', 'long'].includes(elemType) ? "primitive" : "object";
			return {
				kind: "array",
				name,
				getter,
				elementType: elemType,
				elementKind,
				writeMethodCall: elementKind === "object" ? `write${elemType}` : undefined,
				isNullable
			};
		}
	}

	// Special libGDX types that get custom handling
	if (['Color', 'TextureRegion', 'IntArray', 'FloatArray'].includes(propType)) {
		return {
			kind: "object",
			name,
			getter,
			valueType: propType,
			writeMethodCall: `write${propType}`,
			isNullable
		};
	}

	// Object types
	const shortType = propType.split('.').pop()!;
	return {
		kind: "object",
		name,
		getter,
		valueType: propType,
		writeMethodCall: `write${shortType}`,
		isNullable
	};
}

function generateSerializerIR (analysisData: SerializedAnalysisResult): SerializerIR {
	// Convert arrays back to Maps
	const classMap = new Map(analysisData.classMap);
	const abstractTypes = new Map(analysisData.abstractTypes);
	const typeProperties = new Map(analysisData.typeProperties);
	const exclusions = loadExclusions();

	// Generate enum mappings
	const enumMappings: { [enumName: string]: { [javaValue: string]: string } } = {};
	for (const [className, classInfo] of classMap) {
		if (classInfo.isEnum && classInfo.enumValues) {
			const shortName = className.split('.').pop()!;
			const valueMap: { [javaValue: string]: string } = {};

			for (const javaValue of classInfo.enumValues) {
				// Convert Java enum value to C++ enum value
				// e.g. "setup" -> "MixBlend_Setup", "first" -> "MixBlend_First"
				const cppValue = `${shortName}_${javaValue.charAt(0).toUpperCase() + javaValue.slice(1)}`;
				valueMap[javaValue] = cppValue;
			}

			enumMappings[shortName] = valueMap;
		}
	}

	// Generate public methods
	const publicMethods: PublicMethod[] = [
		{
			name: "serializeSkeletonData",
			paramType: "SkeletonData",
			paramName: "data",
			writeMethodCall: "writeSkeletonData"
		},
		{
			name: "serializeSkeleton",
			paramType: "Skeleton",
			paramName: "skeleton",
			writeMethodCall: "writeSkeleton"
		},
		{
			name: "serializeAnimationState",
			paramType: "AnimationState",
			paramName: "state",
			writeMethodCall: "writeAnimationState"
		}
	];

	// Collect all types that need write methods
	const typesNeedingMethods = new Set<string>();

	// Add all types from allTypesToGenerate
	for (const type of analysisData.allTypesToGenerate) {
		typesNeedingMethods.add(type);
	}

	// Add all abstract types that are referenced (but not excluded)
	for (const [abstractType] of abstractTypes) {
		if (!exclusions.types.has(abstractType)) {
			typesNeedingMethods.add(abstractType);
		}
	}

	// Add types referenced in properties
	for (const [typeName, props] of typeProperties) {
		if (!typesNeedingMethods.has(typeName)) continue;

		for (const prop of props) {
			let propType = prop.type.replace(/@Null\s+/g, '').trim();

			// Extract type from Array<Type>
			const arrayMatch = propType.match(/Array<(.+?)>/);
			if (arrayMatch) {
				propType = arrayMatch[1].trim();
			}

			// Extract type from Type[]
			if (propType.endsWith('[]')) {
				propType = propType.slice(0, -2);
			}

			// Skip primitives and special types
			if (['String', 'int', 'float', 'boolean', 'short', 'byte', 'double', 'long',
				'Color', 'TextureRegion', 'IntArray', 'FloatArray'].includes(propType)) {
				continue;
			}

			// Add the type if it's a class (but not excluded)
			if (propType.match(/^[A-Z]/)) {
				if (!exclusions.types.has(propType)) {
					typesNeedingMethods.add(propType);
				}

				// Also check if it's an abstract type in classMap
				for (const [fullName, info] of classMap) {
					if (fullName === propType || fullName.split('.').pop() === propType) {
						if ((info.isAbstract || info.isInterface) && !exclusions.types.has(fullName)) {
							typesNeedingMethods.add(fullName);
						}
						break;
					}
				}
			}
		}
	}

	// Generate write methods
	const writeMethods: WriteMethod[] = [];
	const generatedMethods = new Set<string>();

	for (const typeName of Array.from(typesNeedingMethods).sort()) {
		const classInfo = classMap.get(typeName);
		if (!classInfo) continue;

		// Skip enums - they are handled inline with .name() calls
		if (classInfo.isEnum) continue;

		const shortName = typeName.split('.').pop()!;

		// Skip if already generated (handle name collisions)
		if (generatedMethods.has(shortName)) continue;
		generatedMethods.add(shortName);

		const writeMethod: WriteMethod = {
			name: `write${shortName}`,
			paramType: typeName,
			properties: [],
			isAbstractType: classInfo.isAbstract || classInfo.isInterface || false
		};

		if (classInfo.isAbstract || classInfo.isInterface) {
			// Handle abstract types with instanceof chain
			const implementations = classInfo.concreteImplementations || [];

			// Filter out excluded types from implementations
			const filteredImplementations = implementations.filter(impl => {
				return !exclusions.types.has(impl);
			});

			if (filteredImplementations.length > 0) {
				writeMethod.subtypeChecks = filteredImplementations.map(impl => {
					const implShortName = impl.split('.').pop()!;
					return {
						typeName: impl,
						writeMethodCall: `write${implShortName}`
					};
				});
			}
		} else {
			// Handle concrete types - convert properties
			const properties = typeProperties.get(typeName) || [];

			for (const prop of properties) {
				if (prop.excluded) {
					continue; // Skip excluded properties
				}

				const propName = prop.isGetter ?
					prop.name.replace('get', '').replace('()', '').charAt(0).toLowerCase() +
					prop.name.replace('get', '').replace('()', '').slice(1) :
					prop.name;

				// Handle getter vs field access
				let getter: string;
				if (prop.isGetter) {
					// It's a method call - ensure it has parentheses
					getter = prop.name.includes('()') ? prop.name : `${prop.name}()`;
				} else {
					// It's a field access - use the field name directly
					getter = prop.name;
				}

				// Analyze the property type to determine the correct Property variant
				const irProperty = analyzePropertyWithDetails(prop, propName, getter, classMap);
				writeMethod.properties.push(irProperty);
			}
		}

		writeMethods.push(writeMethod);
	}

	return {
		publicMethods,
		writeMethods,
		enumMappings
	};
}

function analyzePropertyWithDetails (prop: PropertyInfo, propName: string, getter: string, classMap: Map<string, ClassInfo>): Property {
	// Handle null annotations
	const isNullable = prop.type.includes('@Null');
	let propType = prop.type.replace(/@Null\s+/g, '').trim();

	// Primitive types
	if (['String', 'int', 'float', 'boolean', 'short', 'byte', 'double', 'long'].includes(propType)) {
		return {
			kind: "primitive",
			name: propName,
			getter,
			valueType: propType,
			isNullable
		};
	}

	// Check if it's an enum
	let classInfo = classMap.get(propType);
	if (!classInfo && !propType.includes('.')) {
		// Try to find by short name
		for (const [fullName, info] of classMap) {
			if (fullName.split('.').pop() === propType) {
				classInfo = info;
				propType = fullName; // Use full name
				break;
			}
		}
	}

	if (classInfo?.isEnum) {
		return {
			kind: "enum",
			name: propName,
			getter,
			enumName: propType.split('.').pop()!,
			isNullable
		};
	}

	// Arrays
	if (propType.startsWith('Array<')) {
		const innerType = propType.match(/Array<(.+?)>/)![1].trim();
		const elementKind = ['String', 'int', 'float', 'boolean', 'short', 'byte', 'double', 'long'].includes(innerType) ? "primitive" : "object";

		return {
			kind: "array",
			name: propName,
			getter,
			elementType: innerType,
			elementKind,
			writeMethodCall: elementKind === "object" ? `write${innerType.split('.').pop()}` : undefined,
			isNullable
		};
	}

	// Handle nested arrays (like float[][])
	if (propType.endsWith('[]')) {
		const elemType = propType.slice(0, -2);
		if (elemType.endsWith('[]')) {
			const nestedType = elemType.slice(0, -2);
			return {
				kind: "nestedArray",
				name: propName,
				getter,
				elementType: nestedType,
				isNullable
			};
		} else {
			const elementKind = ['String', 'int', 'float', 'boolean', 'short', 'byte', 'double', 'long'].includes(elemType) ? "primitive" : "object";
			return {
				kind: "array",
				name: propName,
				getter,
				elementType: elemType,
				elementKind,
				writeMethodCall: elementKind === "object" ? `write${elemType.split('.').pop()}` : undefined,
				isNullable
			};
		}
	}

	// Special libGDX types that get custom handling
	if (['Color', 'TextureRegion', 'IntArray', 'FloatArray'].includes(propType)) {
		return {
			kind: "object",
			name: propName,
			getter,
			valueType: propType,
			writeMethodCall: `write${propType}`,
			isNullable
		};
	}

	// Object types
	const shortType = propType.split('.').pop()!;
	return {
		kind: "object",
		name: propName,
		getter,
		valueType: propType,
		writeMethodCall: `write${shortType}`,
		isNullable
	};
}

async function main () {
	try {
		// Read analysis result
		const analysisFile = path.resolve(__dirname, '../output/analysis-result.json');
		if (!fs.existsSync(analysisFile)) {
			console.error('Analysis result not found. Run analyze-java-api.ts first.');
			process.exit(1);
		}

		const analysisData: SerializedAnalysisResult = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));

		// Generate IR
		const ir = generateSerializerIR(analysisData);

		// Write the IR file
		const irFile = path.resolve(__dirname, '../output/serializer-ir.json');
		fs.mkdirSync(path.dirname(irFile), { recursive: true });
		fs.writeFileSync(irFile, JSON.stringify(ir, null, 2));

		console.log(`Generated serializer IR: ${irFile}`);
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

export { generateSerializerIR, type SerializerIR, type PublicMethod, type WriteMethod, type Property };