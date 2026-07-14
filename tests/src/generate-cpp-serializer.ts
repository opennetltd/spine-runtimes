#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Property, SerializerIR } from './generate-serializer-ir';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function transformType (javaType: string): string {
	// Remove package prefixes
	const simpleName = javaType.includes('.') ? javaType.split('.').pop()! : javaType;

	// Handle primitive types
	if (simpleName === 'String') return 'const String&';
	if (simpleName === 'int') return 'int';
	if (simpleName === 'float') return 'float';
	if (simpleName === 'boolean') return 'bool';
	if (simpleName === 'short') return 'short';

	// Handle arrays
	if (simpleName.endsWith('[]')) {
		const baseType = simpleName.slice(0, -2);
		return `Array<${transformType(baseType)}>`;
	}

	// Object types become pointers
	return simpleName;
}

function generatePropertyCode (property: Property, indent: string, enumMappings: { [enumName: string]: { [javaValue: string]: string } }): string[] {
	const lines: string[] = [];

	// Transform field access for C++: add _ prefix except for Color fields
	let accessor = `obj->${property.getter}`;
	if (!property.getter.includes('()')) {
		// This is a field access, not a method call
		const fieldName = property.getter;
		// Color fields (r, g, b, a) don't get _ prefix, all others do
		const isColorField = ['r', 'g', 'b', 'a'].includes(fieldName);
		if (!isColorField) {
			accessor = `obj->_${fieldName}`;
		} else {
			accessor = `obj->${fieldName}`;
		}
	}

	// C++-specific: darkColor specifically has hasDarkColor() method
	const isDarkColor = property.kind === "object" &&
		property.valueType === "Color" &&
		property.getter === "getDarkColor()";

	if (isDarkColor) {
		const colorAccessor = `&${accessor}`;

		lines.push(`${indent}if (obj->hasDarkColor()) {`);
		lines.push(`${indent}    ${property.writeMethodCall}(${colorAccessor});`);
		lines.push(`${indent}} else {`);
		lines.push(`${indent}    _json.writeNull();`);
		lines.push(`${indent}}`);
		return lines;
	}

	switch (property.kind) {
		case "primitive":
			lines.push(`${indent}_json.writeValue(${accessor});`);
			break;

		case "object":
			if (property.isNullable) {
				lines.push(`${indent}if (${accessor} == nullptr) {`);
				lines.push(`${indent}    _json.writeNull();`);
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

			if (enumMap && Object.keys(enumMap).length > 0) {
				// Generate switch statement for enum
				lines.push(`${indent}_json.writeValue([&]() -> String {`);
				lines.push(`${indent}    switch(${accessor}) {`);

				for (const [javaValue, cppValue] of Object.entries(enumMap)) {
					lines.push(`${indent}        case ${cppValue}: return "${javaValue}";`);
				}

				lines.push(`${indent}        default: return "unknown";`);
				lines.push(`${indent}    }`);
				lines.push(`${indent}}());`);
			} else {
				// Fallback if no enum mapping
				lines.push(`${indent}_json.writeValue(String::valueOf((int)${accessor}));`);
			}
			break;
		}
		case "array": {
			// In C++, arrays are never null - empty arrays (size() == 0) are equivalent to Java null
			lines.push(`${indent}_json.writeArrayStart();`);
			lines.push(`${indent}for (size_t i = 0; i < ${accessor}.size(); i++) {`);
			const elementAccess = `${accessor}[i]`;
			if (property.elementKind === "primitive") {
				lines.push(`${indent}    _json.writeValue(${elementAccess});`);
			} else {
				lines.push(`${indent}    ${property.writeMethodCall}(${elementAccess});`);
			}
			lines.push(`${indent}}`);
			lines.push(`${indent}_json.writeArrayEnd();`);
			break;
		}
		case "nestedArray":
			// Nested arrays are always considered non-null in both Java and C++
			lines.push(`${indent}_json.writeArrayStart();`);
			lines.push(`${indent}for (size_t i = 0; i < ${accessor}.size(); i++) {`);
			lines.push(`${indent}    Array<${property.elementType}>& nestedArray = ${accessor}[i];`);
			lines.push(`${indent}    _json.writeArrayStart();`);
			lines.push(`${indent}    for (size_t j = 0; j < nestedArray.size(); j++) {`);
			lines.push(`${indent}        _json.writeValue(nestedArray[j]);`);
			lines.push(`${indent}    }`);
			lines.push(`${indent}    _json.writeArrayEnd();`);
			lines.push(`${indent}}`);
			lines.push(`${indent}_json.writeArrayEnd();`);
			break;
	}

	return lines;
}

function generateCppFromIR (ir: SerializerIR): string {
	const cppOutput: string[] = [];

	// Generate C++ file header
	cppOutput.push('#ifndef Spine_SkeletonSerializer_h');
	cppOutput.push('#define Spine_SkeletonSerializer_h');
	cppOutput.push('');
	cppOutput.push('#include <spine/spine.h>');
	cppOutput.push('#include "JsonWriter.h"');
	cppOutput.push('#include <stdio.h>');
	cppOutput.push('#include <stdlib.h>');
	cppOutput.push('');
	cppOutput.push('namespace spine {');
	cppOutput.push('');
	cppOutput.push('class SkeletonSerializer {');
	cppOutput.push('private:');
	cppOutput.push('    HashMap<void*, String> _visitedObjects;');
	cppOutput.push('    int _nextId;');
	cppOutput.push('    JsonWriter _json;');
	cppOutput.push('');
	cppOutput.push('public:');
	cppOutput.push('    SkeletonSerializer() {}');
	cppOutput.push('    ~SkeletonSerializer() {}');
	cppOutput.push('');

	// Generate public methods
	for (const method of ir.publicMethods) {
		const cppParamType = transformType(method.paramType);
		cppOutput.push(`    String ${method.name}(${cppParamType}* ${method.paramName}) {`);
		cppOutput.push('        _visitedObjects.clear();');
		cppOutput.push('        _nextId = 1;');
		cppOutput.push('        _json = JsonWriter();');
		cppOutput.push(`        ${method.writeMethodCall}(${method.paramName});`);
		cppOutput.push('        return _json.getString();');
		cppOutput.push('    }');
		cppOutput.push('');
	}

	cppOutput.push('private:');

	// Generate write methods
	for (const method of ir.writeMethods) {
		const shortName = method.paramType.split('.').pop();
		const cppType = transformType(method.paramType);

		// Custom writeSkin and writeSkinEntry implementations
		if (method.name === 'writeSkin') {
			cppOutput.push('    void writeSkin(Skin* obj) {');
			cppOutput.push('        if (_visitedObjects.containsKey(obj)) {');
			cppOutput.push('            _json.writeValue(_visitedObjects[obj]);');
			cppOutput.push('            return;');
			cppOutput.push('        }');

			// Generate reference string for this object (only when first encountered)
			// Only use name if there's a proper getName() method returning String
			const nameGetter = method.properties.find(p =>
				(p.kind === 'object' || p.kind === "primitive") &&
				p.getter === 'getName()' &&
				p.valueType === 'String'
			);

			if (nameGetter) {
				// Use getName() if available and returns String
				cppOutput.push('        String name = obj->getName();');
				cppOutput.push('        String refString;');
				cppOutput.push('        if (!name.isEmpty()) {');
				cppOutput.push(`            refString.append("<${shortName}-").append(name).append(">");`);
				cppOutput.push('        } else {');
				cppOutput.push(`            refString.append("<${shortName}-").append(_nextId++).append(">");`);
				cppOutput.push('        }');
			} else {
				// No suitable name getter - use numbered ID
				cppOutput.push(`        String refString = String("<${shortName}-").append(_nextId++).append(">");`);
			}
			cppOutput.push('        _visitedObjects.put(obj, refString);');
			cppOutput.push('');
			cppOutput.push('');
			cppOutput.push('        _json.writeObjectStart();');

			cppOutput.push('        _json.writeName("refString");');
			cppOutput.push('        _json.writeValue(refString);');

			cppOutput.push('        _json.writeName("type");');
			cppOutput.push('        _json.writeValue("Skin");');
			cppOutput.push('');
			cppOutput.push('        _json.writeName("attachments");');
			cppOutput.push('        _json.writeArrayStart();');
			cppOutput.push('        Skin::AttachmentMap::Entries entries = obj->getAttachments();');
			cppOutput.push('        while (entries.hasNext()) {');
			cppOutput.push('            Skin::AttachmentMap::Entry& entry = entries.next();');
			cppOutput.push('            writeSkinEntry(&entry);');
			cppOutput.push('        }');
			cppOutput.push('        _json.writeArrayEnd();');
			cppOutput.push('');
			cppOutput.push('        _json.writeName("bones");');
			cppOutput.push('        _json.writeArrayStart();');
			cppOutput.push('        for (size_t i = 0; i < obj->getBones().size(); i++) {');
			cppOutput.push('            BoneData* item = obj->getBones()[i];');
			cppOutput.push('            writeBoneData(item);');
			cppOutput.push('        }');
			cppOutput.push('        _json.writeArrayEnd();');
			cppOutput.push('');
			cppOutput.push('        _json.writeName("constraints");');
			cppOutput.push('        _json.writeArrayStart();');
			cppOutput.push('        for (size_t i = 0; i < obj->getConstraints().size(); i++) {');
			cppOutput.push('            ConstraintData* item = obj->getConstraints()[i];');
			cppOutput.push('            writeConstraintData(item);');
			cppOutput.push('        }');
			cppOutput.push('        _json.writeArrayEnd();');
			cppOutput.push('');
			cppOutput.push('        _json.writeName("name");');
			cppOutput.push('        _json.writeValue(obj->getName());');
			cppOutput.push('');
			cppOutput.push('        _json.writeName("color");');
			cppOutput.push('        writeColor(&obj->getColor());');
			cppOutput.push('');
			cppOutput.push('        _json.writeObjectEnd();');
			cppOutput.push('    }');
			cppOutput.push('');
			continue;
		}

		// Custom writeSkinEntry
		if (method.name === 'writeSkinEntry') {
			// Custom writeSkinEntry implementation
			cppOutput.push('    void writeSkinEntry(Skin::AttachmentMap::Entry* obj) {');
			cppOutput.push('        _json.writeObjectStart();');

			// Generate refString using the name field if available
			cppOutput.push('        String name = obj->_name;');
			cppOutput.push('        String refString;');
			cppOutput.push('        if (!name.isEmpty()) {');
			cppOutput.push(`            refString.append("<${shortName}-").append(name).append(">");`);
			cppOutput.push('        } else {');
			cppOutput.push(`            refString.append("<${shortName}-").append(_nextId++).append(">");`);
			cppOutput.push('        }');
			cppOutput.push('        _json.writeName("refString");');
			cppOutput.push('        _json.writeValue(refString);');

			cppOutput.push('        _json.writeName("type");');
			cppOutput.push('        _json.writeValue("SkinEntry");');
			cppOutput.push('        _json.writeName("slotIndex");');
			cppOutput.push('        _json.writeValue((int)obj->_slotIndex);');
			cppOutput.push('        _json.writeName("name");');
			cppOutput.push('        _json.writeValue(obj->_name);');
			cppOutput.push('        _json.writeName("attachment");');
			cppOutput.push('        writeAttachment(obj->_attachment);');
			cppOutput.push('        _json.writeObjectEnd();');
			cppOutput.push('    }');
			cppOutput.push('');
			continue;
		}

		cppOutput.push(`    void ${method.name}(${cppType}* obj) {`);

		if (method.isAbstractType) {
			// Handle abstract types with instanceof chain
			if (method.subtypeChecks && method.subtypeChecks.length > 0) {
				let first = true;
				for (const subtype of method.subtypeChecks) {
					const subtypeShortName = subtype.typeName.split('.').pop();

					if (first) {
						cppOutput.push(`        if (obj->getRTTI().instanceOf(${subtypeShortName}::rtti)) {`);
						first = false;
					} else {
						cppOutput.push(`        } else if (obj->getRTTI().instanceOf(${subtypeShortName}::rtti)) {`);
					}
					cppOutput.push(`            ${subtype.writeMethodCall}((${subtypeShortName}*)obj);`);
				}
				cppOutput.push('        } else {');
				cppOutput.push(`            fprintf(stderr, "Error: Unknown ${shortName} type\\n"); exit(1);`);
				cppOutput.push('        }');
			} else {
				cppOutput.push('        _json.writeNull(); // No concrete implementations after filtering exclusions');
			}
		} else {
			// Handle concrete types
			// Add cycle detection
			cppOutput.push('        if (_visitedObjects.containsKey(obj)) {');
			cppOutput.push('            _json.writeValue(_visitedObjects[obj]);');
			cppOutput.push('            return;');
			cppOutput.push('        }');

			// Generate reference string for this object (only when first encountered)
			// Only use name if there's a proper getName() method returning String
			const nameGetter = method.properties.find(p =>
				(p.kind === 'object' || p.kind === "primitive") &&
				p.getter === 'getName()' &&
				p.valueType === 'String'
			);

			if (nameGetter) {
				// Use getName() if available and returns String
				cppOutput.push('        String name = obj->getName();');
				cppOutput.push('        String refString;');
				cppOutput.push('        if (!name.isEmpty()) {');
				cppOutput.push(`            refString.append("<${shortName}-").append(name).append(">");`);
				cppOutput.push('        } else {');
				cppOutput.push(`            refString.append("<${shortName}-").append(_nextId++).append(">");`);
				cppOutput.push('        }');
			} else {
				// No suitable name getter - use numbered ID
				cppOutput.push(`        String refString = String("<${shortName}-").append(_nextId++).append(">");`);
			}
			cppOutput.push('        _visitedObjects.put(obj, refString);');
			cppOutput.push('');

			cppOutput.push('        _json.writeObjectStart();');

			// Write reference string as first field for navigation
			cppOutput.push('        _json.writeName("refString");');
			cppOutput.push('        _json.writeValue(refString);');

			// Write type field
			cppOutput.push('        _json.writeName("type");');
			cppOutput.push(`        _json.writeValue("${shortName}");`);

			// Write properties
			for (const property of method.properties) {
				cppOutput.push('');
				cppOutput.push(`        _json.writeName("${property.name}");`);
				const propertyLines = generatePropertyCode(property, '        ', ir.enumMappings);
				cppOutput.push(...propertyLines);
			}

			cppOutput.push('');
			cppOutput.push('        _json.writeObjectEnd();');
		}

		cppOutput.push('    }');
		cppOutput.push('');
	}

	// Add custom helper methods for special types
	cppOutput.push('    // Custom helper methods');
	cppOutput.push('    void writeColor(Color* obj) {');
	cppOutput.push('        if (obj == nullptr) {');
	cppOutput.push('            _json.writeNull();');
	cppOutput.push('        } else {');
	cppOutput.push('            _json.writeObjectStart();');
	cppOutput.push('            _json.writeName("r");');
	cppOutput.push('            _json.writeValue(obj->r);');
	cppOutput.push('            _json.writeName("g");');
	cppOutput.push('            _json.writeValue(obj->g);');
	cppOutput.push('            _json.writeName("b");');
	cppOutput.push('            _json.writeValue(obj->b);');
	cppOutput.push('            _json.writeName("a");');
	cppOutput.push('            _json.writeValue(obj->a);');
	cppOutput.push('            _json.writeObjectEnd();');
	cppOutput.push('        }');
	cppOutput.push('    }');
	cppOutput.push('');

	cppOutput.push('    void writeColor(const Color& obj) {');
	cppOutput.push('        _json.writeObjectStart();');
	cppOutput.push('        _json.writeName("r");');
	cppOutput.push('        _json.writeValue(obj.r);');
	cppOutput.push('        _json.writeName("g");');
	cppOutput.push('        _json.writeValue(obj.g);');
	cppOutput.push('        _json.writeName("b");');
	cppOutput.push('        _json.writeValue(obj.b);');
	cppOutput.push('        _json.writeName("a");');
	cppOutput.push('        _json.writeValue(obj.a);');
	cppOutput.push('        _json.writeObjectEnd();');
	cppOutput.push('    }');
	cppOutput.push('');

	cppOutput.push('    void writeTextureRegion(TextureRegion* obj) {');
	cppOutput.push('        if (obj == nullptr) {');
	cppOutput.push('            _json.writeNull();');
	cppOutput.push('        } else {');
	cppOutput.push('            _json.writeObjectStart();');
	cppOutput.push('            _json.writeName("u");');
	cppOutput.push('            _json.writeValue(obj->getU());');
	cppOutput.push('            _json.writeName("v");');
	cppOutput.push('            _json.writeValue(obj->getV());');
	cppOutput.push('            _json.writeName("u2");');
	cppOutput.push('            _json.writeValue(obj->getU2());');
	cppOutput.push('            _json.writeName("v2");');
	cppOutput.push('            _json.writeValue(obj->getV2());');
	cppOutput.push('            _json.writeName("width");');
	cppOutput.push('            _json.writeValue(obj->getRegionWidth());');
	cppOutput.push('            _json.writeName("height");');
	cppOutput.push('            _json.writeValue(obj->getRegionHeight());');
	cppOutput.push('            _json.writeObjectEnd();');
	cppOutput.push('        }');
	cppOutput.push('    }');
	cppOutput.push('');

	cppOutput.push('    void writeTextureRegion(const TextureRegion& obj) {');
	cppOutput.push('        _json.writeObjectStart();');
	cppOutput.push('        _json.writeName("u");');
	cppOutput.push('        _json.writeValue(obj.getU());');
	cppOutput.push('        _json.writeName("v");');
	cppOutput.push('        _json.writeValue(obj.getV());');
	cppOutput.push('        _json.writeName("u2");');
	cppOutput.push('        _json.writeValue(obj.getU2());');
	cppOutput.push('        _json.writeName("v2");');
	cppOutput.push('        _json.writeValue(obj.getV2());');
	cppOutput.push('        _json.writeName("width");');
	cppOutput.push('        _json.writeValue(obj.getRegionWidth());');
	cppOutput.push('        _json.writeName("height");');
	cppOutput.push('        _json.writeValue(obj.getRegionHeight());');
	cppOutput.push('        _json.writeObjectEnd();');
	cppOutput.push('    }');
	cppOutput.push('');

	cppOutput.push('    void writeIntArray(const Array<int>& obj) {');
	cppOutput.push('        _json.writeArrayStart();');
	cppOutput.push('        for (size_t i = 0; i < obj.size(); i++) {');
	cppOutput.push('            _json.writeValue(obj[i]);');
	cppOutput.push('        }');
	cppOutput.push('        _json.writeArrayEnd();');
	cppOutput.push('    }');
	cppOutput.push('');

	cppOutput.push('    void writeFloatArray(const Array<float>& obj) {');
	cppOutput.push('        _json.writeArrayStart();');
	cppOutput.push('        for (size_t i = 0; i < obj.size(); i++) {');
	cppOutput.push('            _json.writeValue(obj[i]);');
	cppOutput.push('        }');
	cppOutput.push('        _json.writeArrayEnd();');
	cppOutput.push('    }');
	cppOutput.push('');

	// Add reference versions for write methods (excluding custom implementations)
	cppOutput.push('    // Reference versions of write methods');
	const writeMethods = ir.writeMethods.filter(m =>
		!m.isAbstractType &&
		m.name !== 'writeSkin' &&
		m.name !== 'writeSkinEntry'
	);
	for (const method of writeMethods) {
		const cppType = transformType(method.paramType);
		cppOutput.push(`    void ${method.name}(const ${cppType}& obj) {`);
		cppOutput.push(`        ${method.name}(const_cast<${cppType}*>(&obj));`);
		cppOutput.push('    }');
		cppOutput.push('');
	}

	// Add reference versions for abstract type write methods
	cppOutput.push('    // Reference versions of abstract type write methods');
	const abstractWriteMethods = ir.writeMethods.filter(m => m.isAbstractType);
	for (const method of abstractWriteMethods) {
		const cppType = transformType(method.paramType);
		cppOutput.push(`    void ${method.name}(const ${cppType}& obj) {`);
		cppOutput.push(`        ${method.name}(const_cast<${cppType}*>(&obj));`);
		cppOutput.push('    }');
		cppOutput.push('');
	}


	// C++ footer
	cppOutput.push('};');
	cppOutput.push('');
	cppOutput.push('} // namespace spine');
	cppOutput.push('');
	cppOutput.push('#endif');

	return cppOutput.join('\n');
}

async function main () {
	try {
		// Read the IR file
		const irFile = path.resolve(__dirname, '../output/serializer-ir.json');
		if (!fs.existsSync(irFile)) {
			console.error('Serializer IR not found. Run generate-serializer-ir.ts first.');
			process.exit(1);
		}

		const ir: SerializerIR = JSON.parse(fs.readFileSync(irFile, 'utf8'));

		// Generate C++ serializer from IR
		const cppCode = generateCppFromIR(ir);

		// Write the C++ file
		const cppFile = path.resolve(
			__dirname,
			'../../spine-cpp/tests/SkeletonSerializer.h'
		);

		fs.mkdirSync(path.dirname(cppFile), { recursive: true });
		fs.writeFileSync(cppFile, cppCode);

		console.log(`Generated C++ serializer from IR: ${cppFile}`);
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

export { generateCppFromIR };
