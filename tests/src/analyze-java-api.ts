#!/usr/bin/env tsx

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { ClassInfo, PropertyInfo, AnalysisResult } from './types';
import type { LspCliResult, SymbolInfo } from '@mariozechner/lsp-cli';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function ensureOutputDir (): string {
	const outputDir = path.resolve(__dirname, '../output');
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}
	return outputDir;
}

function generateLspData (outputDir: string): string {
	const outputFile = path.join(outputDir, 'spine-libgdx-symbols.json');
	const projectDir = path.resolve(__dirname, '../../spine-libgdx');
	const srcDir = path.join(projectDir, 'spine-libgdx/src');

	// Check if we need to regenerate
	let needsRegeneration = true;
	if (fs.existsSync(outputFile)) {
		const outputStats = fs.statSync(outputFile);
		const outputTime = outputStats.mtime.getTime();

		// Find the newest source file
		const newestSourceTime = execSync(
			`find "${srcDir}" -name "*.java" -type f ! -name "SkeletonSerializer.java" -exec stat -f "%m" {} \\; | sort -nr | head -1`,
			{ encoding: 'utf8' }
		).trim();

		if (newestSourceTime) {
			const sourceTime = parseInt(newestSourceTime) * 1000; // Convert to milliseconds
			needsRegeneration = sourceTime > outputTime;
		}
	}

	if (needsRegeneration) {
		console.error('Generating LSP data for spine-libgdx...');
		try {
			execSync(`node ${path.join(__dirname, '../node_modules/@mariozechner/lsp-cli/dist/index.js')} "${projectDir}" java "${outputFile}"`, {
				stdio: 'inherit' // Show all output
			});
			console.error('LSP data generated successfully');
		} catch (error: any) {
			console.error('Error generating LSP data:', error.message);
			throw error;
		}
	} else {
		console.error('Using existing LSP data (up to date)');
	}

	return outputFile;
}

function analyzeClasses (symbols: SymbolInfo[]): Map<string, ClassInfo> {
	const classMap = new Map<string, ClassInfo>();
	const srcPath = path.resolve(__dirname, '../../spine-libgdx/spine-libgdx/src/');

	function processSymbol (symbol: SymbolInfo, parentName?: string) {
		if (symbol.kind !== 'class' && symbol.kind !== 'enum' && symbol.kind !== 'interface') return;

		// Filter: only process symbols in spine-libgdx/src, excluding SkeletonSerializer
		if (!symbol.file.startsWith(srcPath)) return;
		if (symbol.file.endsWith('SkeletonSerializer.java')) return;

		const className = parentName ? `${parentName}.${symbol.name}` : symbol.name;

		const classInfo: ClassInfo = {
			className: className,
			superTypes: (symbol.supertypes || []).map(st => st.name.replace('$', '.')),
			superTypeDetails: symbol.supertypes,
			file: symbol.file,
			getters: [],
			fields: [],
			isAbstract: false,
			isInterface: symbol.kind === 'interface',
			isEnum: symbol.kind === 'enum',
			typeParameters: symbol.typeParameters || []
		};

		// Check if abstract class
		if (symbol.preview && symbol.preview.includes('abstract ')) {
			classInfo.isAbstract = true;
		}

		// Find all getter methods, public fields, inner classes, and enum values
		if (symbol.children) {
			for (const child of symbol.children) {
				if (child.kind === 'class' || child.kind === 'enum' || child.kind === 'interface') {
					// Process inner class
					processSymbol(child, className);
				} else if (child.kind === 'enumMember') {
					// Collect enum values
					if (!classInfo.enumValues) {
						classInfo.enumValues = [];
					}
					classInfo.enumValues.push(child.name);
				} else if (child.kind === 'field' && child.preview) {
					// Check if it's a public field
					if (child.preview.includes('public ')) {
						// Extract field type from preview
						// Examples: "public float offset;", "public final Array<ToProperty> to = ..."
						const fieldMatch = child.preview.match(/public\s+(final\s+)?(.+?)\s+(\w+)\s*[;=]/);
						if (fieldMatch) {
							const isFinal = !!fieldMatch[1];
							const fieldType = fieldMatch[2].trim();
							const fieldName = fieldMatch[3];
							classInfo.fields.push({ fieldName, fieldType, isFinal });
						}
					}
				} else if (child.kind === 'method' &&
					child.name.startsWith('get') &&
					child.name !== 'getClass()' &&
					child.name.endsWith('()')) { // Only parameterless getters

					const methodName = child.name.slice(0, -2); // Remove ()

					if (methodName.length > 3 && methodName[3] === methodName[3].toUpperCase()) {
						// Extract return type from preview
						let returnType = 'unknown';
						if (child.preview) {
							const returnMatch = child.preview.match(/(?:public|protected|private)?\s*(.+?)\s+\w+\s*\(\s*\)/);
							if (returnMatch) {
								returnType = returnMatch[1].trim();
							}
						}

						classInfo.getters.push({ methodName, returnType });
					}
				}
			}
		}

		classMap.set(className, classInfo);
	}

	for (const symbol of symbols) {
		processSymbol(symbol);
	}

	return classMap;
}

function findAccessibleTypes (
	classMap: Map<string, ClassInfo>,
	startingTypes: string[]
): Set<string> {
	const accessible = new Set<string>();
	const toVisit = [...startingTypes];
	const visited = new Set<string>();

	// Helper to find all concrete subclasses of a type
	function findConcreteSubclasses (typeName: string, addToQueue: boolean = true): string[] {
		const concreteClasses: string[] = [];

		if (!classMap.has(typeName)) return concreteClasses;

		const classInfo = classMap.get(typeName)!;

		// Add the type itself if it's concrete
		if (!classInfo.isAbstract && !classInfo.isInterface && !classInfo.isEnum) {
			concreteClasses.push(typeName);
		}

		// Find all subclasses recursively
		for (const [className, info] of classMap) {
			// Check if this class extends our target (handle both qualified and unqualified names)
			const extendsTarget = info.superTypes.some(st =>
				st === typeName ||
				st === typeName.split('.').pop() ||
				(typeName.includes('.') && className.startsWith(typeName.split('.')[0] + '.') && st === typeName.split('.').pop())
			);

			if (extendsTarget) {
				// Recursively find concrete subclasses
				const subclasses = findConcreteSubclasses(className, false);
				concreteClasses.push(...subclasses);

				if (addToQueue && !visited.has(className)) {
					toVisit.push(className);
				}
			}
		}

		return concreteClasses;
	}

	while (toVisit.length > 0) {
		const typeName = toVisit.pop()!;

		if (visited.has(typeName)) continue;
		visited.add(typeName);

		if (!classMap.has(typeName)) {
			console.error(`Type ${typeName} not found in classMap`);
			continue;
		}

		const classInfo = classMap.get(typeName)!;

		// Add the type itself if it's concrete
		if (!classInfo.isAbstract && !classInfo.isInterface && !classInfo.isEnum) {
			accessible.add(typeName);
			console.error(`Added concrete type: ${typeName}`);
		}

		// Find all concrete subclasses of this type
		const concreteClasses = findConcreteSubclasses(typeName);
		concreteClasses.forEach(c => accessible.add(c));

		// Add types from getter return types and field types
		const allTypes = [
			...classInfo.getters.map(g => g.returnType),
			...classInfo.fields.map(f => f.fieldType)
		];

		for (const type of allTypes) {
			const returnType = type
				.replace(/@Null\s+/g, '') // Remove @Null annotations
				.replace(/\s+/g, ' ');     // Normalize whitespace

			// Extract types from Array<Type>, IntArray, FloatArray, etc.
			const arrayMatch = returnType.match(/Array<(.+?)>/);
			if (arrayMatch) {
				const innerType = arrayMatch[1].trim();
				// Handle inner classes like AnimationState.TrackEntry
				if (innerType.includes('.')) {
					if (classMap.has(innerType) && !visited.has(innerType)) {
						toVisit.push(innerType);
					}
				} else {
					// Try both plain type and as inner class of current type
					if (classMap.has(innerType) && !visited.has(innerType)) {
						toVisit.push(innerType);
					}
					// Also try as inner class of the declaring type
					const parts = typeName.split('.');
					for (let i = parts.length; i >= 1; i--) {
						const parentPath = parts.slice(0, i).join('.');
						const innerClassPath = `${parentPath}.${innerType}`;
						if (classMap.has(innerClassPath) && !visited.has(innerClassPath)) {
							toVisit.push(innerClassPath);
							break;
						}
					}
				}
			}

			// Extract all capitalized type names
			const typeMatches = returnType.match(/\b([A-Z]\w+(?:\.[A-Z]\w+)*)\b/g);
			if (typeMatches) {
				for (const match of typeMatches) {
					if (classMap.has(match) && !visited.has(match)) {
						toVisit.push(match);
					}
					// For non-qualified names, also try as inner class
					if (!match.includes('.')) {
						// Try as inner class of current type and its parents
						const parts = typeName.split('.');
						for (let i = parts.length; i >= 1; i--) {
							const parentPath = parts.slice(0, i).join('.');
							const innerClassPath = `${parentPath}.${match}`;
							if (classMap.has(innerClassPath) && !visited.has(innerClassPath)) {
								toVisit.push(innerClassPath);
								break;
							}
						}
					}
				}
			}
		}
	}

	console.error(`Found ${accessible.size} accessible types`);
	return accessible;
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

function isTypeExcluded (typeName: string, exclusions: ReturnType<typeof loadExclusions>): boolean {
	return exclusions.types.has(typeName);
}

function isPropertyExcluded (className: string, propertyName: string, isGetter: boolean, exclusions: ReturnType<typeof loadExclusions>): boolean {
	if (isGetter) {
		return exclusions.methods.get(className)?.has(propertyName) || false;
	} else {
		return exclusions.fields.get(className)?.has(propertyName) || false;
	}
}

function getAllProperties (classMap: Map<string, ClassInfo>, className: string, symbolsFile: string, exclusions: ReturnType<typeof loadExclusions>): PropertyInfo[] {
	const allProperties: PropertyInfo[] = [];
	const visited = new Set<string>();
	const classInfo = classMap.get(className);
	if (!classInfo) return [];

	// Build type parameter mapping based on supertype details
	const typeParamMap = new Map<string, string>();

	// Helper to build parameter mappings for a specific supertype
	function buildTypeParamMapping (currentClass: string, targetSupertype: string): Map<string, string> {
		const mapping = new Map<string, string>();
		const currentInfo = classMap.get(currentClass);
		if (!currentInfo || !currentInfo.superTypeDetails) return mapping;

		// Find the matching supertype
		for (const supertype of currentInfo.superTypeDetails) {
			if (supertype.name === targetSupertype && supertype.typeArguments) {
				// Get the supertype's class info to know its type parameters
				const supertypeInfo = classMap.get(targetSupertype);
				if (supertypeInfo && supertypeInfo.typeParameters) {
					// Map type parameters to arguments
					for (let i = 0; i < Math.min(supertypeInfo.typeParameters.length, supertype.typeArguments.length); i++) {
						mapping.set(supertypeInfo.typeParameters[i], supertype.typeArguments[i]);
					}
				}
				break;
			}
		}
		return mapping;
	}

	function resolveType (type: string, typeMap: Map<string, string> = new Map()): string {
		// Resolve generic type parameters
		if (typeMap.has(type)) {
			return typeMap.get(type)!;
		}
		// TODO: Handle complex types like Array<T>, Map<K, V>, etc.
		return type;
	}

	// Collect properties in inheritance order (most specific first)
	function collectProperties (currentClass: string, inheritanceLevel: number = 0, currentTypeMap: Map<string, string> = new Map()) {
		if (visited.has(currentClass)) return;
		visited.add(currentClass);

		const classInfo = classMap.get(currentClass);
		if (!classInfo) return;

		// Add this class's getters with resolved types
		for (const getter of classInfo.getters) {
			const propertyName = getter.methodName + '()';
			allProperties.push({
				name: propertyName,
				type: resolveType(getter.returnType, currentTypeMap),
				isGetter: true,
				inheritedFrom: inheritanceLevel === 0 ? undefined : currentClass,
				excluded: isPropertyExcluded(currentClass, propertyName, true, exclusions)
			});
		}

		// Add this class's public fields
		for (const field of classInfo.fields) {
			allProperties.push({
				name: field.fieldName,
				type: resolveType(field.fieldType, currentTypeMap),
				isGetter: false,
				inheritedFrom: inheritanceLevel === 0 ? undefined : currentClass,
				excluded: isPropertyExcluded(currentClass, field.fieldName, false, exclusions)
			});
		}

		// Recursively collect from supertypes
		for (const superType of classInfo.superTypes) {
			// Build type parameter mapping for this supertype
			const supertypeMapping = buildTypeParamMapping(currentClass, superType);

			// Compose mappings - resolve type arguments through current mapping
			const composedMapping = new Map<string, string>();
			for (const [param, arg] of supertypeMapping) {
				composedMapping.set(param, resolveType(arg, currentTypeMap));
			}

			// Try to find the supertype - it might be unqualified
			let superClassInfo = classMap.get(superType);

			// If not found and it's unqualified, try to find it as an inner class
			if (!superClassInfo && !superType.includes('.')) {
				// Try as inner class of the same parent
				if (currentClass.includes('.')) {
					const parentPrefix = currentClass.substring(0, currentClass.lastIndexOf('.'));
					const qualifiedSuper = `${parentPrefix}.${superType}`;
					superClassInfo = classMap.get(qualifiedSuper);
					if (superClassInfo) {
						collectProperties(qualifiedSuper, inheritanceLevel + 1, composedMapping);
						continue;
					}
				}

				// Try as top-level class
				for (const [name, info] of classMap) {
					if (name === superType || name.endsWith(`.${superType}`)) {
						collectProperties(name, inheritanceLevel + 1, composedMapping);
						break;
					}
				}
			} else if (superClassInfo) {
				collectProperties(superType, inheritanceLevel + 1, composedMapping);
			}
		}
	}

	collectProperties(className);

	// Remove duplicates (overridden methods/shadowed fields), keeping the most specific one
	const seen = new Map<string, PropertyInfo>();
	for (const prop of allProperties) {
		const key = prop.isGetter ? prop.name : `field:${prop.name}`;
		if (!seen.has(key)) {
			seen.set(key, prop);
		}
	}

	return Array.from(seen.values());
}

// Helper to find all implementations of a type (both concrete and abstract)
function findAllImplementations (classMap: Map<string, ClassInfo>, typeName: string, concreteOnly: boolean = false): string[] {
	const implementations: string[] = [];
	const visited = new Set<string>();

	function findImplementations (currentType: string) {
		if (visited.has(currentType)) return;
		visited.add(currentType);

		// Get the short name for comparison
		const currentShortName = currentType.split('.').pop()!;
		const currentPrefix = currentType.includes('.') ? currentType.split('.')[0] : '';

		for (const [className, classInfo] of classMap) {
			// Check if this class extends/implements the current type
			let extendsType = false;

			// For inner classes, we need to check if they're in the same outer class
			if (currentPrefix && className.startsWith(currentPrefix + '.')) {
				// Both are inner classes of the same outer class
				extendsType = classInfo.superTypes.some(st =>
					st === currentShortName || st === currentType
				);
			} else {
				// Standard inheritance check
				extendsType = classInfo.superTypes.some(st =>
					st === currentType || st === currentShortName
				);
			}

			if (extendsType) {
				if (!classInfo.isAbstract && !classInfo.isInterface && !classInfo.isEnum) {
					// This is a concrete implementation
					implementations.push(className);
				} else {
					// This is abstract/interface
					if (!concreteOnly) {
						// Include abstract types when getting all implementations
						implementations.push(className);
					}
					// Always recurse to find further implementations
					findImplementations(className);
				}
			}
		}
	}

	findImplementations(typeName);
	return [...new Set(implementations)].sort(); // Remove duplicates and sort
}

function analyzeForSerialization (classMap: Map<string, ClassInfo>, symbolsFile: string): AnalysisResult {
	const startingTypes = ['SkeletonData', 'Skeleton', 'AnimationState'];
	const accessibleTypes = findAccessibleTypes(classMap, startingTypes);

	// First pass: populate implementations for all abstract types
	for (const [className, classInfo] of classMap) {
		if (classInfo.isAbstract || classInfo.isInterface) {
			// Get only concrete implementations
			const concreteImplementations = findAllImplementations(classMap, className, true);
			classInfo.concreteImplementations = concreteImplementations;

			// Get all implementations (including intermediate abstract types)
			const allImplementations = findAllImplementations(classMap, className, false);
			classInfo.allImplementations = allImplementations;
		}
	}

	// Collect abstract types and their implementations
	const abstractTypes = new Map<string, string[]>();
	const allTypesToGenerate = new Set<string>(accessibleTypes);

	// Find all abstract types referenced by accessible types
	for (const typeName of accessibleTypes) {
		const classInfo = classMap.get(typeName);
		if (!classInfo) continue;

		// Check return types and field types for abstract classes
		const allTypes = [
			...classInfo.getters.map(g => g.returnType),
			...classInfo.fields.map(f => f.fieldType)
		];

		for (const type of allTypes) {
			const returnType = type
				.replace(/@Null\s+/g, '')
				.replace(/\s+/g, ' ');

			// Extract types from Array<Type>
			let checkTypes: string[] = [];
			const arrayMatch = returnType.match(/Array<(.+?)>/);
			if (arrayMatch) {
				checkTypes.push(arrayMatch[1].trim());
			} else if (returnType.match(/^[A-Z]\w+$/)) {
				checkTypes.push(returnType);
			}

			// Also check for type names that might be inner classes
			const typeMatches = returnType.match(/\b([A-Z]\w+)\b/g);
			if (typeMatches) {
				for (const match of typeMatches) {
					// Try as inner class of current type
					const parts = typeName.split('.');
					for (let i = parts.length; i >= 1; i--) {
						const parentPath = parts.slice(0, i).join('.');
						const innerClassPath = `${parentPath}.${match}`;
						if (classMap.has(innerClassPath)) {
							checkTypes.push(innerClassPath);
							break;
						}
					}
				}
			}

			for (const checkType of checkTypes) {
				if (checkType && classMap.has(checkType)) {
					const typeInfo = classMap.get(checkType)!;
					if (typeInfo.isAbstract || typeInfo.isInterface) {
						// Use the already populated concreteImplementations
						const implementations = typeInfo.concreteImplementations || [];
						abstractTypes.set(checkType, implementations);

						// Add all concrete implementations to types to generate
						implementations.forEach(impl => allTypesToGenerate.add(impl));
					}
				}
			}
		}
	}

	// Load exclusions
	const exclusions = loadExclusions();

	// Filter out excluded types from allTypesToGenerate
	const filteredTypesToGenerate = new Set<string>();
	for (const typeName of allTypesToGenerate) {
		if (!isTypeExcluded(typeName, exclusions)) {
			filteredTypesToGenerate.add(typeName);
		} else {
			console.error(`Excluding type: ${typeName}`);
		}
	}


	// Update allTypesToGenerate to the filtered set
	allTypesToGenerate.clear();
	filteredTypesToGenerate.forEach(type => allTypesToGenerate.add(type));

	// Collect all properties for each type (including inherited ones)
	const typeProperties = new Map<string, PropertyInfo[]>();
	for (const typeName of allTypesToGenerate) {
		const props = getAllProperties(classMap, typeName, symbolsFile, exclusions);
		typeProperties.set(typeName, props);
	}

	// Also collect properties for abstract types (so we know what properties their implementations should have)
	for (const abstractType of abstractTypes.keys()) {
		if (!typeProperties.has(abstractType) && !isTypeExcluded(abstractType, exclusions)) {
			const props = getAllProperties(classMap, abstractType, symbolsFile, exclusions);
			typeProperties.set(abstractType, props);
		}
	}

	// Second pass: find additional concrete types referenced in properties
	const additionalTypes = new Set<string>();
	for (const [typeName, props] of typeProperties) {
		for (const prop of props) {
			const propType = prop.type.replace(/@Null\s+/g, '').trim();

			// Check if it's a simple type name
			const typeMatch = propType.match(/^([A-Z]\w+)$/);
			if (typeMatch) {
				const type = typeMatch[1];
				if (classMap.has(type)) {
					const typeInfo = classMap.get(type)!;
					if (!typeInfo.isAbstract && !typeInfo.isInterface && !typeInfo.isEnum) {
						if (!allTypesToGenerate.has(type)) {
							additionalTypes.add(type);
							console.error(`Found additional type ${type} from property ${prop.name} of ${typeName}`);
						}
					}
				}
			}
		}
	}

	// Add the additional types (filtered)
	additionalTypes.forEach(type => {
		if (!isTypeExcluded(type, exclusions)) {
			allTypesToGenerate.add(type);
		} else {
			console.error(`Excluding additional type: ${type}`);
		}
	});

	// Get properties for the additional types too
	for (const typeName of additionalTypes) {
		if (!isTypeExcluded(typeName, exclusions)) {
			const props = getAllProperties(classMap, typeName, symbolsFile, exclusions);
			typeProperties.set(typeName, props);
		} else {
			console.error(`Excluding additional type: ${typeName}`);
		}
	}

	return {
		classMap,
		accessibleTypes,
		abstractTypes,
		allTypesToGenerate,
		typeProperties
	};
}

async function main () {
	try {
		// Ensure output directory exists
		const outputDir = ensureOutputDir();

		// Generate LSP data
		const jsonFile = generateLspData(outputDir);

		// Read and parse the JSON
		const jsonContent = fs.readFileSync(jsonFile, 'utf8');
		const lspData: LspCliResult = JSON.parse(jsonContent);

		console.error(`Analyzing ${lspData.symbols.length} symbols...`);

		// Analyze all classes
		const classMap = analyzeClasses(lspData.symbols);
		console.error(`Found ${classMap.size} classes`);

		// Perform serialization analysis
		const analysisResult = analyzeForSerialization(classMap, jsonFile);
		console.error(`Found ${analysisResult.accessibleTypes.size} accessible types`);
		console.error(`Found ${analysisResult.allTypesToGenerate.size} types to generate`);

		// Save analysis result to file
		const analysisFile = path.join(outputDir, 'analysis-result.json');

		// Convert Maps to arrays and handle nested Maps in ClassInfo
		const classMapArray: [string, any][] = [];
		for (const [name, info] of analysisResult.classMap) {
			const serializedInfo = {
				...info,
				typeParameters: info.typeParameters ? Array.from(info.typeParameters.entries()) : undefined
			};
			classMapArray.push([name, serializedInfo]);
		}

		const resultToSave = {
			...analysisResult,
			// Convert Maps and Sets to arrays for JSON serialization
			classMap: classMapArray,
			accessibleTypes: Array.from(analysisResult.accessibleTypes),
			abstractTypes: Array.from(analysisResult.abstractTypes.entries()),
			allTypesToGenerate: Array.from(analysisResult.allTypesToGenerate),
			typeProperties: Array.from(analysisResult.typeProperties.entries())
		};

		fs.writeFileSync(analysisFile, JSON.stringify(resultToSave, null, 2));
		console.log(`Analysis result written to: ${analysisFile}`);

	} catch (error: any) {
		console.error('Error:', error.message);
		process.exit(1);
	}
}

main();