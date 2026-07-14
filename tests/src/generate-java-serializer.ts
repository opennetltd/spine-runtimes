#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type { Property, SerializerIR, WriteMethod } from './generate-serializer-ir';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function generatePropertyCode (property: Property, indent: string, method?: WriteMethod): string[] {
	const lines: string[] = [];
	const accessor = `obj.${property.getter}`;

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

		case "enum":
			if (property.isNullable) {
				lines.push(`${indent}if (${accessor} == null) {`);
				lines.push(`${indent}    json.writeNull();`);
				lines.push(`${indent}} else {`);
				lines.push(`${indent}    json.writeValue(${accessor}.name());`);
				lines.push(`${indent}}`);
			} else {
				lines.push(`${indent}json.writeValue(${accessor}.name());`);
			}
			break;

		case "array": {
			// Special handling for Skin attachments - sort by slot index
			const isSkinAttachments = method?.paramType === 'Skin' && property.name === 'attachments' && property.elementType === 'SkinEntry';
			const sortedAccessor = isSkinAttachments ? 'sortedAttachments' : accessor;

			if (isSkinAttachments) {
				lines.push(`${indent}Array<${property.elementType}> sortedAttachments = new Array<>(${accessor});`);
				lines.push(`${indent}sortedAttachments.sort((a, b) -> Integer.compare(a.getSlotIndex(), b.getSlotIndex()));`);
			}

			if (property.isNullable) {
				lines.push(`${indent}if (${accessor} == null) {`);
				lines.push(`${indent}    json.writeNull();`);
				lines.push(`${indent}} else {`);
				lines.push(`${indent}    json.writeArrayStart();`);
				lines.push(`${indent}    for (${property.elementType} item : ${sortedAccessor}) {`);
				if (property.elementKind === "primitive") {
					lines.push(`${indent}        json.writeValue(item);`);
				} else {
					lines.push(`${indent}        ${property.writeMethodCall}(item);`);
				}
				lines.push(`${indent}    }`);
				lines.push(`${indent}    json.writeArrayEnd();`);
				lines.push(`${indent}}`);
			} else {
				lines.push(`${indent}json.writeArrayStart();`);
				lines.push(`${indent}for (${property.elementType} item : ${sortedAccessor}) {`);
				if (property.elementKind === "primitive") {
					lines.push(`${indent}    json.writeValue(item);`);
				} else {
					lines.push(`${indent}    ${property.writeMethodCall}(item);`);
				}
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
				lines.push(`${indent}    json.writeArrayStart();`);
				lines.push(`${indent}    for (${property.elementType}[] nestedArray : ${accessor}) {`);
				lines.push(`${indent}        if (nestedArray == null) {`);
				lines.push(`${indent}            json.writeNull();`);
				lines.push(`${indent}        } else {`);
				lines.push(`${indent}            json.writeArrayStart();`);
				lines.push(`${indent}            for (${property.elementType} elem : nestedArray) {`);
				lines.push(`${indent}                json.writeValue(elem);`);
				lines.push(`${indent}            }`);
				lines.push(`${indent}            json.writeArrayEnd();`);
				lines.push(`${indent}        }`);
				lines.push(`${indent}    }`);
				lines.push(`${indent}    json.writeArrayEnd();`);
				lines.push(`${indent}}`);
			} else {
				lines.push(`${indent}json.writeArrayStart();`);
				lines.push(`${indent}for (${property.elementType}[] nestedArray : ${accessor}) {`);
				lines.push(`${indent}    json.writeArrayStart();`);
				lines.push(`${indent}    for (${property.elementType} elem : nestedArray) {`);
				lines.push(`${indent}        json.writeValue(elem);`);
				lines.push(`${indent}    }`);
				lines.push(`${indent}    json.writeArrayEnd();`);
				lines.push(`${indent}}`);
				lines.push(`${indent}json.writeArrayEnd();`);
			}
			break;
		}
	}

	return lines;
}

function generateJavaFromIR (ir: SerializerIR): string {
	const javaOutput: string[] = [];

	// Generate Java file header
	javaOutput.push('package com.esotericsoftware.spine.utils;');
	javaOutput.push('');
	javaOutput.push('import com.esotericsoftware.spine.*;');
	javaOutput.push('import com.esotericsoftware.spine.Animation.*;');
	javaOutput.push('import com.esotericsoftware.spine.AnimationState.*;');
	javaOutput.push('import com.esotericsoftware.spine.BoneData.Inherit;');
	javaOutput.push('import com.esotericsoftware.spine.Skin.SkinEntry;');
	javaOutput.push('import com.esotericsoftware.spine.PathConstraintData.*;');
	javaOutput.push('import com.esotericsoftware.spine.TransformConstraintData.*;');
	javaOutput.push('import com.esotericsoftware.spine.attachments.*;');
	javaOutput.push('import com.badlogic.gdx.graphics.Color;');
	javaOutput.push('import com.badlogic.gdx.graphics.g2d.TextureRegion;');
	javaOutput.push('import com.badlogic.gdx.utils.Array;');
	javaOutput.push('import com.badlogic.gdx.utils.IntArray;');
	javaOutput.push('import com.badlogic.gdx.utils.FloatArray;');
	javaOutput.push('');
	javaOutput.push('import java.util.Locale;');
	javaOutput.push('import java.util.Map;');
	javaOutput.push('import java.util.HashMap;');
	javaOutput.push('');
	javaOutput.push('public class SkeletonSerializer {');
	javaOutput.push('    private final Map<Object, String> visitedObjects = new HashMap<>();');
	javaOutput.push('    private int nextId = 1;');
	javaOutput.push('    private JsonWriter json;');
	javaOutput.push('');

	// Generate public methods
	for (const method of ir.publicMethods) {
		javaOutput.push(`    public String ${method.name}(${method.paramType} ${method.paramName}) {`);
		javaOutput.push('        visitedObjects.clear();');
		javaOutput.push('        nextId = 1;');
		javaOutput.push('        json = new JsonWriter();');
		javaOutput.push(`        ${method.writeMethodCall}(${method.paramName});`);
		javaOutput.push('        json.close();');
		javaOutput.push('        return json.getString();');
		javaOutput.push('    }');
		javaOutput.push('');
	}

	// Generate write methods
	for (const method of ir.writeMethods) {
		const shortName = method.paramType.split('.').pop();
		const className = method.paramType.includes('.') ? method.paramType : shortName;

		javaOutput.push(`    private void ${method.name}(${className} obj) {`);

		if (method.isAbstractType) {
			// Handle abstract types with instanceof chain
			if (method.subtypeChecks && method.subtypeChecks.length > 0) {
				let first = true;
				for (const subtype of method.subtypeChecks) {
					const subtypeShortName = subtype.typeName.split('.').pop();
					const subtypeClassName = subtype.typeName.includes('.') ? subtype.typeName : subtypeShortName;

					if (first) {
						javaOutput.push(`        if (obj instanceof ${subtypeClassName}) {`);
						first = false;
					} else {
						javaOutput.push(`        } else if (obj instanceof ${subtypeClassName}) {`);
					}
					javaOutput.push(`            ${subtype.writeMethodCall}((${subtypeClassName}) obj);`);
				}
				javaOutput.push('        } else {');
				javaOutput.push(`            throw new RuntimeException("Unknown ${shortName} type: " + obj.getClass().getName());`);
				javaOutput.push('        }');
			} else {
				javaOutput.push('        json.writeNull(); // No concrete implementations after filtering exclusions');
			}
		} else {
			// Handle concrete types
			// Add cycle detection
			javaOutput.push('        if (visitedObjects.containsKey(obj)) {');
			javaOutput.push('            json.writeValue(visitedObjects.get(obj));');
			javaOutput.push('            return;');
			javaOutput.push('        }');

			// Generate reference string for this object (only when first encountered)
			// Only use name if there's a proper getName() method returning String
			const nameGetter = method.properties.find(p =>
				(p.kind === 'object' || p.kind === "primitive") &&
				p.getter === 'getName()' &&
				p.valueType === 'String'
			);

			if (nameGetter) {
				// Use getName() if available and returns String
				javaOutput.push(`        String refString = obj.getName() != null ? "<${shortName}-" + obj.getName() + ">" : "<${shortName}-" + (nextId++) + ">";`);
			} else {
				// No suitable name getter - use numbered ID
				javaOutput.push(`        String refString = "<${shortName}-" + (nextId++) + ">";`);
			}
			javaOutput.push('        visitedObjects.put(obj, refString);');
			javaOutput.push('');

			javaOutput.push('        json.writeObjectStart();');

			// Write reference string as first field for navigation
			javaOutput.push('        json.writeName("refString");');
			javaOutput.push('        json.writeValue(refString);');

			// Write type field
			javaOutput.push('        json.writeName("type");');
			javaOutput.push(`        json.writeValue("${shortName}");`);

			// Write properties
			for (const property of method.properties) {
				javaOutput.push('');
				javaOutput.push(`        json.writeName("${property.name}");`);
				const propertyLines = generatePropertyCode(property, '        ', method);
				javaOutput.push(...propertyLines);
			}

			javaOutput.push('');
			javaOutput.push('        json.writeObjectEnd();');
		}

		javaOutput.push('    }');
		javaOutput.push('');
	}

	// Add helper methods for special types
	javaOutput.push('    private void writeColor(Color obj) {');
	javaOutput.push('        if (obj == null) {');
	javaOutput.push('            json.writeNull();');
	javaOutput.push('        } else {');
	javaOutput.push('            json.writeObjectStart();');
	javaOutput.push('            json.writeName("r");');
	javaOutput.push('            json.writeValue(obj.r);');
	javaOutput.push('            json.writeName("g");');
	javaOutput.push('            json.writeValue(obj.g);');
	javaOutput.push('            json.writeName("b");');
	javaOutput.push('            json.writeValue(obj.b);');
	javaOutput.push('            json.writeName("a");');
	javaOutput.push('            json.writeValue(obj.a);');
	javaOutput.push('            json.writeObjectEnd();');
	javaOutput.push('        }');
	javaOutput.push('    }');
	javaOutput.push('');

	javaOutput.push('    private void writeTextureRegion(TextureRegion obj) {');
	javaOutput.push('        if (obj == null) {');
	javaOutput.push('            json.writeNull();');
	javaOutput.push('        } else {');
	javaOutput.push('            json.writeObjectStart();');
	javaOutput.push('            json.writeName("u");');
	javaOutput.push('            json.writeValue(obj.getU());');
	javaOutput.push('            json.writeName("v");');
	javaOutput.push('            json.writeValue(obj.getV());');
	javaOutput.push('            json.writeName("u2");');
	javaOutput.push('            json.writeValue(obj.getU2());');
	javaOutput.push('            json.writeName("v2");');
	javaOutput.push('            json.writeValue(obj.getV2());');
	javaOutput.push('            json.writeName("width");');
	javaOutput.push('            json.writeValue(obj.getRegionWidth());');
	javaOutput.push('            json.writeName("height");');
	javaOutput.push('            json.writeValue(obj.getRegionHeight());');
	javaOutput.push('            json.writeObjectEnd();');
	javaOutput.push('        }');
	javaOutput.push('    }');

	// Add IntArray and FloatArray helper methods
	javaOutput.push('');
	javaOutput.push('    private void writeIntArray(IntArray obj) {');
	javaOutput.push('        if (obj == null) {');
	javaOutput.push('            json.writeNull();');
	javaOutput.push('        } else {');
	javaOutput.push('            json.writeArrayStart();');
	javaOutput.push('            for (int i = 0; i < obj.size; i++) {');
	javaOutput.push('                json.writeValue(obj.get(i));');
	javaOutput.push('            }');
	javaOutput.push('            json.writeArrayEnd();');
	javaOutput.push('        }');
	javaOutput.push('    }');
	javaOutput.push('');

	javaOutput.push('    private void writeFloatArray(FloatArray obj) {');
	javaOutput.push('        if (obj == null) {');
	javaOutput.push('            json.writeNull();');
	javaOutput.push('        } else {');
	javaOutput.push('            json.writeArrayStart();');
	javaOutput.push('            for (int i = 0; i < obj.size; i++) {');
	javaOutput.push('                json.writeValue(obj.get(i));');
	javaOutput.push('            }');
	javaOutput.push('            json.writeArrayEnd();');
	javaOutput.push('        }');
	javaOutput.push('    }');

	javaOutput.push('}');

	return javaOutput.join('\n');
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

		// Generate Java serializer from IR
		const javaCode = generateJavaFromIR(ir);

		// Write the Java file
		const javaFile = path.resolve(
			__dirname,
			'../../spine-libgdx/spine-libgdx-tests/src/com/esotericsoftware/spine/utils/SkeletonSerializer.java'
		);

		fs.mkdirSync(path.dirname(javaFile), { recursive: true });
		fs.writeFileSync(javaFile, javaCode);

		console.log(`Generated Java serializer from IR: ${javaFile}`);
		console.log(`- ${ir.publicMethods.length} public methods`);
		console.log(`- ${ir.writeMethods.length} write methods`);

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

export { generateJavaFromIR };
