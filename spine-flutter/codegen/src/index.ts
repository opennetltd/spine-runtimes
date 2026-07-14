#!/usr/bin/env node
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate } from '../../../spine-c/codegen/src/index.js';
import { DartWriter } from './dart-writer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function generateFFIBindings(spineCDir: string): Promise<void> {
    const ffigenPath = await generateFFigenYaml(spineCDir);

    // Run ffigen to generate bindings
    console.log('Running ffigen...');
    try {
        execSync('dart run ffigen --config ffigen.yaml', {
            cwd: path.join(__dirname, '../..'),
            stdio: 'inherit'
        });
    } catch (error) {
        console.error('Failed to run ffigen:', error);
        throw error;
    }

    // Check if bindings were generated successfully
    const bindingsPath = path.join(__dirname, '../../lib/generated/spine_dart_bindings_generated.dart');
    if (!fs.existsSync(bindingsPath)) {
        throw new Error('Failed to generate bindings');
    }

    // Replace dart:ffi import with universal_ffi
    console.log('Replacing dart:ffi import with universal_ffi...');
    let content = fs.readFileSync(bindingsPath, 'utf8');
    content = content.replace("import 'dart:ffi' as ffi;", "import 'package:universal_ffi/ffi.dart' as ffi;");

    // For web_ffi compatibility, we need to convert wrapper structs to Opaque
    console.log('Converting wrapper structs to Opaque for web_ffi compatibility...');
    const wrapperMatches = content.match(/final class \w+_wrapper extends ffi\.Struct \{[^}]+\}/g) || [];
    console.log(`Found ${wrapperMatches.length} wrapper structs to convert`);
    content = content.replace(/final class (\w+_wrapper) extends ffi\.Struct \{[^}]+\}/g,
        'final class $1 extends ffi.Opaque {}');

    // Also remove __mbstate_t and other system types
    console.log('Removing system types like __mbstate_t...');
    content = content.replace(/final class __mbstate_t extends ffi\.Union \{[^}]*\}/gs, '');
    content = content.replace(/final class __\w+ extends ffi\.\w+ \{[^}]*\}/gs, '');

    // Remove structs with external fields (spine_rect and spine_vector2)
    console.log('Removing structs with external fields...');
    content = content.replace(/final class (spine_rect|spine_vector2) extends ffi\.Struct \{[\s\S]*?\n\}/gm, '');

    fs.writeFileSync(bindingsPath, content);

    // Clean up ffigen.yaml
    console.log('Cleaning up ffigen.yaml...');
    fs.unlinkSync(ffigenPath);

    console.log('✅ FFI bindings generated successfully!');
}

async function generateFFigenYaml(spineCDir: string): Promise<string> {
    console.log('Finding all header files...');
    const generatedDir = path.join(spineCDir, 'src/generated');
    const headerFiles = fs.readdirSync(generatedDir)
        .filter(f => f.endsWith('.h'))
        .map(f => path.join('src/spine-c/src/generated', f))
        .sort();

    console.log(`Found ${headerFiles.length} header files`);

    // Generate ffigen.yaml configuration
    console.log('Generating ffigen.yaml configuration...');
    const ffigenConfig = `# Run with \`dart run ffigen --config ffigen.yaml\`.
name: SpineDartBindings
description: |
  Bindings for Spine C headers.

  Regenerate bindings with \`dart run ffigen --config ffigen.yaml\`.
output: 'lib/generated/spine_dart_bindings_generated.dart'
llvm-path:
    - '/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/'
headers:
  entry-points:
    - 'src/spine-c/include/spine-c.h'
compiler-opts:
  - '-Isrc/spine-c/include'
  - '-Isrc/spine-c/src'
  - '-Isrc/spine-c/src/generated'
  - '-xc'
  - '-std=c99'
functions:
  include:
    - 'spine_.*'
structs:
  include:
    - 'spine_.*'
  exclude:
    - '__.*'  # Exclude all structs starting with __
  dependency-only: opaque
enums:
  include:
    - 'spine_.*'
typedefs:
  include:
    - 'spine_.*'
  exclude:
    - '__.*'  # Exclude system typedefs like __mbstate_t
preamble: |
  // ignore_for_file: always_specify_types, constant_identifier_names
  // ignore_for_file: camel_case_types
  // ignore_for_file: non_constant_identifier_names
comments:
  style: any
  length: full
`;

    const ffigenPath = path.join(__dirname, '../../ffigen.yaml');
    fs.writeFileSync(ffigenPath, ffigenConfig);
    console.log(`FFigen config written to: ${ffigenPath}`);
    return ffigenPath;
}

async function main() {
    const args = process.argv.slice(2);
    const justGenerateYaml = args.includes('--yaml-only');

    if (justGenerateYaml) {
        console.log('Generating ffigen.yaml only...\n');

        // Generate FFI bindings YAML config only
        const spineCDir = path.join(__dirname, '../../src/spine-c');
        await generateFFigenYaml(spineCDir);
        console.log('✅ ffigen.yaml generated successfully!');
        return;
    }

    console.log('Generating Spine Flutter bindings and wrappers...\n');

    console.log('🔧 Using Dart writer implementation\n');

    try {
        // Step 1: Generate C intermediate representation using spine-c codegen
        console.log('Step 1: Generating C intermediate representation...');
        const { cTypes, cEnums, cArrayTypes, inheritance, supertypes, subtypes, isInterface } = await generate();
        console.log(`Generated ${cTypes.length} C types, ${cEnums.length} enums, and ${cArrayTypes.length} array types\n`);

        // Step 2: Write Dart wrapper classes
        console.log('Step 2: Writing Dart wrapper classes...');
        const outputDir = path.join(__dirname, '../../lib/generated');
        const dartWriter = new DartWriter(outputDir);
        await dartWriter.writeAll(cTypes, cEnums, cArrayTypes, inheritance, isInterface, supertypes);
        console.log();

        // Step 3: Generate FFI bindings using ffigen
        console.log('Step 3: Generating FFI bindings...');
        const spineCDir = path.join(__dirname, '../../src/spine-c');
        await generateFFIBindings(spineCDir);

        // Step 4: Format and fix generated Dart code
        console.log('Step 4: Formatting and fixing generated Dart code...');
        try {
            const projectRoot = path.join(__dirname, '../..');

            // Run dart fix to remove unused imports and apply other fixes
            console.log('Running dart fix --apply...');
            execSync('dart fix --apply lib/generated/', {
                cwd: projectRoot,
                stdio: 'inherit'
            });

            // Run custom dart format script
            console.log('Running dart format...');
            execSync(path.join(__dirname, '../../../formatters/format-dart.sh lib/generated/'), {
                cwd: projectRoot,
                stdio: 'inherit'
            });

            console.log('✅ Dart code formatting and fixes applied successfully!');
        } catch (error) {
            console.warn('⚠️ Warning: Could not format/fix Dart code:', error);
            console.warn('You may want to run "dart fix --apply lib/generated/" and "dart format lib/generated/" manually');
        }

        console.log('\n✅ All code generation completed successfully!');
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

main();