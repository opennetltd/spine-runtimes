#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Generate LSP symbols if not already present
const symbolsFile = path.join(__dirname, 'spine-libgdx-symbols.json');
if (!fs.existsSync(symbolsFile)) {
    console.log('Generating LSP symbols for spine-libgdx...');
    execSync(`npx lsp-cli ../spine-libgdx/spine-libgdx/src java ${symbolsFile}`, { 
        stdio: 'inherit',
        cwd: __dirname 
    });
}

// Read and parse symbols
const data = JSON.parse(fs.readFileSync(symbolsFile, 'utf8'));
const allTypes = [];

// Recursively collect all types (including inner types)
function collectTypes(symbols, parentName = '') {
    symbols.forEach(symbol => {
        if (['class', 'interface', 'enum'].includes(symbol.kind)) {
            // Skip utils package
            if (symbol.file && symbol.file.includes('/utils/')) {
                return;
            }
            
            // Skip SkeletonRenderer classes
            if (symbol.name === 'SkeletonRenderer' || symbol.name === 'SkeletonRendererDebug') {
                return;
            }
            
            const fullName = parentName ? `${parentName}.${symbol.name}` : symbol.name;
            allTypes.push({
                name: fullName,
                kind: symbol.kind,
                supertypes: symbol.supertypes || [],
                documentation: symbol.documentation || null
            });
            
            // Recursively process children
            if (symbol.children) {
                collectTypes(symbol.children, fullName);
            }
        }
    });
}

// Collect all types
collectTypes(data.symbols);

// Sort types alphabetically
allTypes.sort((a, b) => a.name.localeCompare(b.name));

// Generate markdown
let markdown = `# Spine Runtime Types

Generated from spine-libgdx (reference implementation)
Total types: ${allTypes.length}

## Type Hierarchy

`;

// Build hierarchy map
const childrenMap = new Map();
allTypes.forEach(type => {
    type.supertypes.forEach(supertype => {
        if (!childrenMap.has(supertype)) {
            childrenMap.set(supertype, []);
        }
        childrenMap.get(supertype).push(type.name);
    });
});

// Helper to print hierarchy
function printHierarchy(typeName, indent = '') {
    const children = childrenMap.get(typeName);
    if (children && children.length > 0) {
        children.sort().forEach(child => {
            markdown += `${indent}- ${child}\n`;
            printHierarchy(child, indent + '  ');
        });
    }
}

// Only show types that have subclasses
const typesWithChildren = [];
allTypes.forEach(type => {
    if (childrenMap.has(type.name)) {
        typesWithChildren.push(type.name);
    }
});

// Sort and print hierarchy for types with children
typesWithChildren.sort().forEach(typeName => {
    markdown += `\n**${typeName}**\n`;
    printHierarchy(typeName, '');
});

// Add complete type list
markdown += `\n## All Types\n\n`;

allTypes.forEach(type => {
    markdown += `- **${type.name}** (${type.kind})`;
    
    if (type.supertypes.length > 0) {
        markdown += ` extends ${type.supertypes.join(', ')}`;
    }
    
    if (type.documentation) {
        const firstLine = type.documentation.split('\n')[0].trim();
        if (firstLine) {
            markdown += ` - ${firstLine}`;
        }
    }
    
    markdown += '\n';
});

// Write output
const outputFile = path.join(__dirname, 'spine-runtimes-types.md');
fs.writeFileSync(outputFile, markdown);
console.log(`Generated: ${outputFile}`);
console.log(`Total types: ${allTypes.length}`);