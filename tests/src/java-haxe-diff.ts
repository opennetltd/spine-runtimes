#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import type { SerializerIR } from './generate-serializer-ir';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface TypeLocation {
	file: string;
	line: number;
}

function findTypeInJava (typeName: string): TypeLocation | null {
	try {
		// Search for class, interface, or enum definitions
		const result = execSync(
			`grep -rn "\\(class\\|interface\\|enum\\)\\s\\+${typeName}\\b" ../../spine-libgdx --include="*.java" | head -1`,
			{ cwd: __dirname, encoding: 'utf8' }
		).trim();

		if (result) {
			const parts = result.split(':');
			const lineNum = parts[1];
			const file = parts[0];
			return { file, line: parseInt(lineNum) };
		}
	} catch (e) {
		// Ignore errors
	}

	return null;
}

function findTypeInHaxe (typeName: string): TypeLocation | null {
	try {
		// Search for class, interface, enum, typedef, or abstract definitions
		const result = execSync(
			`grep -rn "\\(class\\|interface\\|enum\\|typedef\\|abstract\\)\\s\\+${typeName}\\b" ../../spine-haxe --include="*.hx" | grep -v "/tests/" | head -1`,
			{ cwd: __dirname, encoding: 'utf8' }
		).trim();

		if (result) {
			const parts = result.split(':');
			const lineNum = parts[1];
			const file = parts[0];
			return { file, line: parseInt(lineNum) };
		}
	} catch (e) {
		// Ignore errors
	}

	return null;
}

async function main (): Promise<void> {
	// Read the IR file
	const irFile = path.resolve(__dirname, '../output/serializer-ir.json');
	if (!fs.existsSync(irFile)) {
		console.error('Serializer IR not found. Run generate-serializer-ir.ts first.');
		process.exit(1);
	}

	const ir: SerializerIR = JSON.parse(fs.readFileSync(irFile, 'utf8'));

	// Build a map of type to getters
	const typeToGetters = new Map<string, string[]>();
	for (const method of ir.writeMethods) {
		const typeName = method.paramType.split('.').pop()!.replace(/<.*>/, '');
		const getters = method.properties.map(p => p.getter);
		typeToGetters.set(typeName, getters);
	}

	// Process ALL write methods
	const typeEntries: Array<{
		typeName: string;
		javaLocation: TypeLocation | null;
		haxeLocation: TypeLocation | null;
		getters: string[];
	}> = [];

	console.log(`Processing ${ir.writeMethods.length} write methods...`);

	for (const method of ir.writeMethods) {
		// Extract just the type name (last part after .)
		const typeName = method.paramType.split('.').pop()!.replace(/<.*>/, '');

		console.log(`Looking for ${typeName}...`);
		const javaLocation = findTypeInJava(typeName);
		const haxeLocation = findTypeInHaxe(typeName);
		const getters = typeToGetters.get(typeName) || [];

		typeEntries.push({ typeName, javaLocation, haxeLocation, getters });

		if (!javaLocation) console.log(`  Java: NOT FOUND`);
		else console.log(`  Java: ${javaLocation.file}:${javaLocation.line}`);

		if (!haxeLocation) console.log(`  Haxe: NOT FOUND`);
		else console.log(`  Haxe: ${haxeLocation.file}:${haxeLocation.line}`);
	}

	// Generate the markdown file
	const outputPath = path.resolve(__dirname, '../output/java-haxe-diff.md');
	let markdown = `# Java vs Haxe API Differences

This file contains ALL types from the serializer IR that need to be analyzed for API differences.

## Purpose

We are building a Haxe serializer generator that transforms Java getter calls into appropriate Haxe field/method access. To do this correctly, we need to:
1. Map every Java getter method to its corresponding Haxe field or method
2. Identify systematic patterns in these mappings
3. Document special cases where simple transformations don't work

## Automated Analysis Instructions

For each type below which has an unchecked checkbox, use the Task tool with this prompt template:

\`\`\`
Analyze Haxe type for Java getter mappings. MECHANICAL TASK ONLY.

1. Use Read tool to read Haxe file: [HAXE_FILE_PATH]
   - If file is too large, use chunked reads (offset/limit parameters)
2. For each Java getter listed below, find the corresponding field/method in Haxe
   - NOTE: The method may be inherited. If not found in the current type, check the super type (usually Type extends/implements SuperType in Haxe maps to SuperType.hx file)
3. Output the mapping in the following format, replacing the TODO with the actual Haxe field/method:
	- \`Java getter\` → \`Haxe field/method including return type\`

Java getters to map:
[GETTER_LIST]

NO additional tool use other than the Read tool call(s).
\`\`\`

Use the Grep tool to find the next type to process by searching for - [ ] and read 5 lines starting from the first line.

## Types to Analyze (${typeEntries.length} total)

`;

	for (const entry of typeEntries) {
		markdown += `- [ ] **${entry.typeName}**\n`;

		if (entry.javaLocation) {
			markdown += `  - Java: [${entry.javaLocation.file}:${entry.javaLocation.line}](${entry.javaLocation.file}#L${entry.javaLocation.line})\n`;
		} else {
			markdown += `  - Java: NOT FOUND\n`;
		}

		if (entry.haxeLocation) {
			markdown += `  - Haxe: [${entry.haxeLocation.file}:${entry.haxeLocation.line}](${entry.haxeLocation.file}#L${entry.haxeLocation.line})\n`;
		} else {
			markdown += `  - Haxe: NOT FOUND\n`;
		}

		markdown += `  - Java getters:\n`;
		if (entry.getters.length > 0) {
			for (const getter of entry.getters) {
				markdown += `    - \`${getter}\` → TODO\n`;
			}
		} else {
			markdown += `    - (no getters found in IR)\n`;
		}

		markdown += '\n';
	}

	// Write the file
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	fs.writeFileSync(outputPath, markdown);

	console.log(`\nGenerated diff analysis file: ${outputPath}`);
	console.log(`Total types to analyze: ${typeEntries.length}`);

	const foundBoth = typeEntries.filter(e => e.javaLocation && e.haxeLocation).length;
	const javaOnly = typeEntries.filter(e => e.javaLocation && !e.haxeLocation).length;
	const haxeOnly = typeEntries.filter(e => !e.javaLocation && e.haxeLocation).length;
	const foundNeither = typeEntries.filter(e => !e.javaLocation && !e.haxeLocation).length;

	console.log(`  Found in both: ${foundBoth}`);
	console.log(`  Java only: ${javaOnly}`);
	console.log(`  Haxe only: ${haxeOnly}`);
	console.log(`  Neither: ${foundNeither}`);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(err => {
		console.error('Error:', err);
		process.exit(1);
	});
}